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


def verify_token(params: dict, password: str) -> bool:
    received_token = params.get("Token", "")
    filtered = {k: v for k, v in params.items() if k not in ("Token", "DATA", "Receipt", "Items")}
    filtered["Password"] = password
    sorted_values = "".join(str(v) for k, v in sorted(filtered.items()))
    expected = hashlib.sha256(sorted_values.encode()).hexdigest()
    return received_token == expected


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """Обрабатывает webhook от Т-Банка, активирует подписку при успешной оплате."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    secret_key = os.environ["TBANK_SECRET_KEY"]
    schema = os.environ.get("DB_SCHEMA", "t_p42562714_web_app_creation_1")

    if not verify_token(body, secret_key):
        return {"statusCode": 200, "headers": CORS, "body": "FAIL"}

    status = body.get("Status")
    order_id = body.get("OrderId")
    tbank_payment_id = str(body.get("PaymentId", ""))

    if status != "CONFIRMED" or not order_id:
        return {"statusCode": 200, "headers": CORS, "body": "OK"}

    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"""
        SELECT id, user_id, plan, status FROM {schema}.payments
        WHERE tbank_order_id = %s LIMIT 1
    """, (order_id,))
    payment = cur.fetchone()

    if not payment or payment[2] == "paid":
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
        new_expires = max(existing[1], now) + timedelta(days=days)
        cur.execute(f"""
            UPDATE {schema}.subscriptions
            SET plan=%s, expires_at=%s, paid_at=NOW(), updated_at=NOW()
            WHERE id=%s
        """, (plan, new_expires, existing[0]))
        sub_id = existing[0]
    else:
        cur.execute(f"""
            INSERT INTO {schema}.subscriptions (user_id, plan, status, paid_at, expires_at)
            VALUES (%s, %s, 'active', NOW(), %s) RETURNING id
        """, (user_id, plan, expires_at))
        sub_id = cur.fetchone()[0]

    cur.execute(f"""
        UPDATE {schema}.payments SET subscription_id=%s WHERE id=%s
    """, (sub_id, payment_id))

    conn.commit()
    cur.close()
    conn.close()

    return {"statusCode": 200, "headers": CORS, "body": "OK"}
