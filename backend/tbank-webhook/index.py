"""
Webhook от Т-Банк — получает уведомление об оплате и активирует подписку.
POST / — вызывается Т-Банком автоматически после оплаты.
"""
import os
import json
import hashlib
import psycopg2
from datetime import datetime, timezone, timedelta

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

PLAN_DAYS = {"week": 7, "month": 30}
MODE_PLAN_DAYS = {"week": 7, "month": 30}


def verify_token(params: dict, password: str) -> bool:
    received_token = params.get("Token", "")
    excluded = ("Token", "DATA", "Receipt", "Items", "Pan", "ExpDate", "CardId")
    filtered = {k: v for k, v in params.items() if k not in excluded}
    filtered["Password"] = password
    def to_str(v):
        if isinstance(v, bool):
            return str(v).lower()
        return str(v)
    sorted_values = "".join(to_str(v) for k, v in sorted(filtered.items()))
    print(f"[WEBHOOK] Token verify string: {sorted_values[:120]}")
    expected = hashlib.sha256(sorted_values.encode()).hexdigest()
    print(f"[WEBHOOK] Expected token: {expected}, Received: {received_token}")
    return received_token == expected


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """Обрабатывает webhook от Т-Банка, активирует подписку при успешной оплате."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    raw_body = event.get("body") or "{}"
    print(f"[WEBHOOK] Raw body: {raw_body[:500]}")

    body = json.loads(raw_body)
    secret_key = os.environ["TBANK_SECRET_KEY"]
    schema = os.environ.get("DB_SCHEMA", "t_p42562714_web_app_creation_1")

    print(f"[WEBHOOK] Secret key first5={secret_key[:5]}, last3={secret_key[-3:]}, len={len(secret_key)}")
    token_ok = verify_token(body, secret_key)
    print(f"[WEBHOOK] Token valid: {token_ok}")

    if not token_ok:
        print("[WEBHOOK] Token mismatch — returning FAIL")
        return {"statusCode": 200, "headers": CORS, "body": "FAIL"}

    status = body.get("Status")
    order_id = body.get("OrderId")
    tbank_payment_id = str(body.get("PaymentId", ""))
    print(f"[WEBHOOK] Status={status}, OrderId={order_id}, PaymentId={tbank_payment_id}")

    if status != "CONFIRMED" or not order_id:
        print(f"[WEBHOOK] Skipping non-CONFIRMED status: {status}")
        return {"statusCode": 200, "headers": CORS, "body": "OK"}

    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"""
        SELECT id, user_id, plan, status FROM {schema}.payments
        WHERE tbank_order_id = %s LIMIT 1
    """, (order_id,))
    payment = cur.fetchone()
    print(f"[WEBHOOK] Payment found: {payment}")

    if not payment:
        # Проверяем mode_subscriptions
        cur.execute(f"""
            SELECT user_id, plan FROM {schema}.mode_subscriptions
            WHERE tbank_order_id=%s AND status='pending' LIMIT 1
        """, (order_id,))
        mode_row = cur.fetchone()
        if mode_row:
            mode_user_id, mode_plan = mode_row
            days = MODE_PLAN_DAYS.get(mode_plan, 7)
            now = datetime.now(timezone.utc)
            expires_at = now + timedelta(days=days)
            cur.execute(f"""
                UPDATE {schema}.mode_subscriptions
                SET status='active', paid_at=NOW(), expires_at=%s, updated_at=NOW()
                WHERE tbank_order_id=%s AND status='pending'
            """, (expires_at, order_id))
            conn.commit()
            print(f"[WEBHOOK] Mode subscriptions activated for user_id={mode_user_id}, order={order_id}")
        else:
            print(f"[WEBHOOK] Nothing found for order_id={order_id}")
        cur.close(); conn.close()
        return {"statusCode": 200, "headers": CORS, "body": "OK"}

    if payment[3] == "paid":
        print(f"[WEBHOOK] Payment already paid, skipping")
        cur.close(); conn.close()
        return {"statusCode": 200, "headers": CORS, "body": "OK"}

    payment_id, user_id, plan, pay_status = payment

    cur.execute(f"""
        UPDATE {schema}.payments
        SET status='paid', tbank_payment_id=%s, updated_at=NOW()
        WHERE id=%s
    """, (tbank_payment_id, payment_id))

    now = datetime.now(timezone.utc)
    days = PLAN_DAYS.get(plan, 30)
    expires_at = now + timedelta(days=days)

    cur.execute(f"""
        SELECT id, expires_at FROM {schema}.subscriptions
        WHERE user_id=%s AND status='active' LIMIT 1
    """, (user_id,))
    existing = cur.fetchone()

    if existing:
        new_expires = max(existing[1].replace(tzinfo=timezone.utc) if existing[1].tzinfo is None else existing[1], now) + timedelta(days=days)
        cur.execute(f"""
            UPDATE {schema}.subscriptions
            SET plan=%s, expires_at=%s, paid_at=NOW(), updated_at=NOW()
            WHERE id=%s
        """, (plan, new_expires, existing[0]))
        sub_id = existing[0]
        print(f"[WEBHOOK] Updated existing subscription id={sub_id}, new_expires={new_expires}")
    else:
        cur.execute(f"""
            INSERT INTO {schema}.subscriptions (user_id, plan, status, paid_at, expires_at)
            VALUES (%s, %s, 'active', NOW(), %s) RETURNING id
        """, (user_id, plan, expires_at))
        sub_id = cur.fetchone()[0]
        print(f"[WEBHOOK] Created new subscription id={sub_id}, expires={expires_at}")

    cur.execute(f"""
        UPDATE {schema}.payments SET subscription_id=%s WHERE id=%s
    """, (sub_id, payment_id))

    conn.commit()
    cur.close()
    conn.close()

    print(f"[WEBHOOK] Done — subscription activated for user_id={user_id}")
    return {"statusCode": 200, "headers": CORS, "body": "OK"}