"""
Управление подпиской BrainBooster через Т-Банк. v2
GET /  — статус подписки пользователя
POST /trial — активировать 7-дневный триал
POST /pay — создать платёж (plan: week|month)
"""
import os
import json
import hashlib
import uuid
import jwt
import psycopg2
import urllib.request
from datetime import datetime, timezone, timedelta

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
}

PLANS = {
    "week":  {"amount": 10000, "label": "Доступ на неделю", "days": 7},
    "month": {"amount": 29900, "label": "Доступ на месяц",  "days": 30},
}

FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://preview--web-app-creation-1.poehali.dev")


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_tbank_token(params: dict, password: str) -> str:
    excluded = ("Token", "DATA", "Receipt", "Items")
    filtered = {k: v for k, v in params.items() if k not in excluded}
    filtered["Password"] = password
    sorted_values = "".join(str(v) for k, v in sorted(filtered.items()))
    print(f"Token input string: {sorted_values}")
    return hashlib.sha256(sorted_values.encode()).hexdigest()


def get_user_from_jwt(token: str, cur, schema):
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET_KEY"], algorithms=["HS256"])
        user_id = payload.get("user_id")
        print(f"JWT payload user_id: {user_id}")
        if not user_id:
            return None
        cur.execute(f"SELECT id, email, first_name FROM {schema}.users WHERE id = %s AND is_active = true LIMIT 1", (user_id,))
        row = cur.fetchone()
        print(f"User found: {row is not None}")
        return row
    except Exception as e:
        print(f"JWT decode error: {e}")
        return None


def handler(event: dict, context) -> dict:
    """Управление подпиской: статус, триал, оплата через Т-Банк. Админ: ?action=admin-grant/admin-revoke."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = event.get("headers", {})
    schema = os.environ.get("DB_SCHEMA", "t_p42562714_web_app_creation_1")
    method = event.get("httpMethod")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    now = datetime.now(timezone.utc)

    # ── Админские действия — без JWT, по X-Admin-Key ────────────────────────
    if action in ("admin-grant", "admin-revoke", "admin-list"):
        admin_key = headers.get("x-admin-key") or headers.get("X-Admin-Key") or ""
        if admin_key != os.environ.get("ADMIN_CLEANUP_KEY", ""):
            return {"statusCode": 403, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"ok": False, "error": "Доступ запрещён"})}

        conn = get_db()
        cur = conn.cursor()

        if action == "admin-list":
            cur.execute(f"""
                SELECT s.user_id, s.plan, s.status, s.expires_at,
                       u.email, u.first_name, u.last_name
                FROM {schema}.subscriptions s
                JOIN {schema}.users u ON u.id = s.user_id
                ORDER BY s.updated_at DESC NULLS LAST LIMIT 200
            """)
            rows = cur.fetchall()
            subs = []
            for r in rows:
                exp = r[3]
                if exp and exp.tzinfo is None:
                    exp = exp.replace(tzinfo=timezone.utc)
                subs.append({
                    "user_id": r[0], "plan": r[1], "status": r[2],
                    "expires_at": exp.isoformat() if exp else None,
                    "is_active": r[2] == "active" and exp and exp > now,
                    "email": r[4],
                    "name": f"{r[6] or ''} {r[5] or ''}".strip()
                })
            cur.close(); conn.close()
            return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"ok": True, "subscriptions": subs})}

        body = json.loads(event.get("body") or "{}")
        user_id = body.get("user_id")
        plan = body.get("plan", "month")
        days = int(body.get("days", {"week": 7, "month": 30, "year": 365}.get(plan, 30)))

        if not user_id:
            cur.close(); conn.close()
            return {"statusCode": 400, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"ok": False, "error": "user_id обязателен"})}

        if action == "admin-grant":
            cur.execute(f"SELECT id, expires_at FROM {schema}.subscriptions WHERE user_id=%s ORDER BY created_at DESC LIMIT 1", (user_id,))
            existing = cur.fetchone()
            if existing:
                exp = existing[1]
                if exp and exp.tzinfo is None:
                    exp = exp.replace(tzinfo=timezone.utc)
                base = max(exp, now) if exp else now
                new_exp = base + timedelta(days=days)
                cur.execute(f"UPDATE {schema}.subscriptions SET plan=%s, status='active', expires_at=%s, updated_at=NOW() WHERE id=%s",
                            (plan, new_exp, existing[0]))
                msg = "Подписка продлена"
            else:
                new_exp = now + timedelta(days=days)
                cur.execute(f"INSERT INTO {schema}.subscriptions (user_id, plan, status, paid_at, expires_at) VALUES (%s,%s,'active',NOW(),%s)",
                            (user_id, plan, new_exp))
                msg = "Подписка выдана"
            conn.commit(); cur.close(); conn.close()
            return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"ok": True, "message": msg, "expires_at": new_exp.isoformat()})}

        if action == "admin-revoke":
            cur.execute(f"UPDATE {schema}.subscriptions SET status='expired', expires_at=NOW(), updated_at=NOW() WHERE user_id=%s AND status='active'", (user_id,))
            conn.commit(); cur.close(); conn.close()
            return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"ok": True, "message": "Подписка отозвана"})}

    # ── Обычные пользовательские запросы — требуют JWT ───────────────────────
    auth = headers.get("x-authorization") or headers.get("authorization") or headers.get("X-Authorization") or headers.get("Authorization") or ""
    if not auth.startswith("Bearer "):
        return {"statusCode": 401, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"ok": False, "error": "Необходима авторизация"})}

    token = auth.replace("Bearer ", "")

    conn = get_db()
    cur = conn.cursor()
    user = get_user_from_jwt(token, cur, schema)

    if not user:
        cur.close(); conn.close()
        return {"statusCode": 401, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"ok": False, "error": "Пользователь не найден"})}

    user_id = user[0]

    # ── GET / — статус подписки ──────────────────────────────────────────────
    if method == "GET":
        cur.execute(f"""
            SELECT plan, status, expires_at FROM {schema}.subscriptions
            WHERE user_id=%s ORDER BY created_at DESC LIMIT 1
        """, (user_id,))
        sub = cur.fetchone()

        if not sub:
            cur.close(); conn.close()
            return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"ok": True, "has_subscription": False, "can_trial": True})}

        plan, status, expires_at = sub
        if expires_at and expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        is_active = status == "active" and expires_at and expires_at > now

        if status == "active" and expires_at and expires_at <= now:
            cur.execute(f"UPDATE {schema}.subscriptions SET status='expired', updated_at=NOW() WHERE user_id=%s AND status='active'", (user_id,))
            conn.commit()
            is_active = False

        cur.close(); conn.close()
        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({
                    "ok": True,
                    "has_subscription": is_active,
                    "plan": plan if is_active else None,
                    "status": status,
                    "expires_at": expires_at.isoformat() if expires_at else None,
                    "can_trial": False,
                })}

    # ── POST ?action=trial — активировать триал ─────────────────────────────
    if method == "POST" and action == "trial":
        cur.execute(f"SELECT id FROM {schema}.subscriptions WHERE user_id=%s LIMIT 1", (user_id,))
        if cur.fetchone():
            cur.close(); conn.close()
            return {"statusCode": 400, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"ok": False, "error": "Триал уже был использован"})}

        trial_ends = now + timedelta(days=7)
        cur.execute(f"""
            INSERT INTO {schema}.subscriptions (user_id, plan, status, trial_started_at, trial_ends_at, expires_at)
            VALUES (%s, 'trial', 'active', %s, %s, %s)
        """, (user_id, now, trial_ends, trial_ends))
        conn.commit()
        cur.close(); conn.close()
        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"ok": True, "plan": "trial", "expires_at": trial_ends.isoformat()})}

    # ── POST ?action=pay — создать платёж ───────────────────────────────────
    if method == "POST" and action == "pay":
        body = json.loads(event.get("body") or "{}")
        plan = body.get("plan")

        if plan not in PLANS:
            cur.close(); conn.close()
            return {"statusCode": 400, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"ok": False, "error": "Неверный тариф"})}

        plan_info = PLANS[plan]
        terminal_key = os.environ["TBANK_TERMINAL_KEY"]
        secret_key = os.environ["TBANK_SECRET_KEY"]
        print(f"RAW terminal_key from env: '{terminal_key}' len={len(terminal_key)}")
        print(f"RAW secret_key from env: len={len(secret_key)}, first3={secret_key[:3]}, last3={secret_key[-3:]}")
        order_id = str(uuid.uuid4())

        cur.execute(f"""
            INSERT INTO {schema}.payments (user_id, plan, amount, status, tbank_order_id)
            VALUES (%s, %s, %s, 'pending', %s) RETURNING id
        """, (user_id, plan, plan_info["amount"], order_id))
        payment_id = cur.fetchone()[0]
        conn.commit()

        frontend = os.environ.get("FRONTEND_URL", "https://erttp.ru")
        params = {
            "TerminalKey": terminal_key,
            "Amount": plan_info["amount"],
            "OrderId": order_id,
            "Description": plan_info["label"],
            "SuccessURL": f"{frontend}/brain-booster?payment=success&plan={plan}",
            "FailURL": f"{frontend}/brain-booster?payment=fail&plan={plan}",
            "NotificationURL": "https://functions.poehali.dev/48623d77-3c76-4711-99a9-3223aae78b96",
        }
        print(f"TBank params: TerminalKey={terminal_key[:10]}, Amount={plan_info['amount']}, OrderId={order_id}")
        params["Token"] = get_tbank_token(params, secret_key)

        req = urllib.request.Request(
            "https://securepay.tinkoff.ru/v2/Init",
            data=json.dumps(params).encode(),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read())

        print(f"TBank response: Success={result.get('Success')}, Message={result.get('Message')}, Details={result.get('Details')}")
        if not result.get("Success"):
            cur.execute(f"UPDATE {schema}.payments SET status='failed' WHERE id=%s", (payment_id,))
            conn.commit()
            cur.close(); conn.close()
            return {"statusCode": 500, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"ok": False, "error": result.get("Message", "Ошибка платежа"), "details": result.get("Details", "")})}

        payment_url = result["PaymentURL"]
        # Получаем QR-код (СБП) сразу
        payment_id_tbank = str(result["PaymentId"])
        qr_data = None
        try:
            qr_params = {
                "TerminalKey": terminal_key,
                "PaymentId": payment_id_tbank,
                "DataType": "PAYLOAD",
            }
            qr_params["Token"] = get_tbank_token(qr_params, secret_key)
            qr_req = urllib.request.Request(
                "https://securepay.tinkoff.ru/v2/GetQr",
                data=json.dumps(qr_params).encode(),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(qr_req, timeout=10) as qr_resp:
                qr_result = json.loads(qr_resp.read())
            print(f"GetQr response: {qr_result}")
            if qr_result.get("Success"):
                qr_data = qr_result.get("Data")
        except Exception as e:
            print(f"GetQr error (non-critical): {e}")

        cur.execute(f"UPDATE {schema}.payments SET tbank_payment_id=%s, payment_url=%s WHERE id=%s",
                    (payment_id_tbank, payment_url, payment_id))
        conn.commit()
        cur.close(); conn.close()

        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"ok": True, "payment_url": payment_url, "order_id": order_id, "qr_payload": qr_data})}

    cur.close(); conn.close()
    return {"statusCode": 404, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"ok": False, "error": "Not found"})}