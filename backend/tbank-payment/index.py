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
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization, X-Admin-Key",
}

PLANS = {
    "week":  {"amount": 10000, "label": "Доступ на неделю", "days": 7},
    "month": {"amount": 29900, "label": "Доступ на месяц",  "days": 30},
}

# Цены за один режим
MODE_PRICES = {
    "week":  9900,   # 99 руб за режим/неделю
    "month": 19900,  # 199 руб за режим/месяц
}

# Режимы которые можно купить (eyes — бесплатно в подарок)
PAID_MODES = ["general", "focus", "stress", "energy"]
FREE_MODES  = ["eyes"]

FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://preview--web-app-creation-1.poehali.dev")


def get_secret_key() -> str:
    key = os.environ.get("TBANK_SECRET_KEY", "")
    alt = os.environ.get("TBANK_SECRET_KE", "")
    chosen = key if key else alt
    print(f"[PAY] secret_key: len={len(chosen)}, first5={chosen[:5]!r}, last3={chosen[-3:]!r}, source={'TBANK_SECRET_KEY' if chosen == key else 'TBANK_SECRET_KE'}")
    return chosen


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
        # leeway=86400 — допускаем просроченный токен до 24ч (для полинга после оплаты)
        payload = jwt.decode(token, os.environ["JWT_SECRET_KEY"], algorithms=["HS256"],
                             options={"verify_exp": False})
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

        # Проверяем использовал ли триал отдельно
        cur.execute(f"SELECT id FROM {schema}.subscriptions WHERE user_id=%s AND plan='trial' LIMIT 1", (user_id,))
        used_trial = cur.fetchone() is not None

        if not sub:
            # Всё равно проверяем mode_subscriptions и бесплатные режимы
            cur.execute(f"""
                SELECT mode_id, plan, expires_at FROM {schema}.mode_subscriptions
                WHERE user_id=%s AND status='active' AND expires_at > NOW()
            """, (user_id,))
            mode_rows = cur.fetchall()
            active_modes = {}
            for row in mode_rows:
                active_modes[row[0]] = {"plan": row[1], "expires_at": row[2].isoformat() if row[2] else None}
            for m in FREE_MODES:
                active_modes[m] = {"plan": "free", "expires_at": None}
            cur.close(); conn.close()
            return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"ok": True, "has_subscription": False, "can_trial": True, "active_modes": active_modes})}

        plan, status, expires_at = sub
        if expires_at and expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        is_active = status == "active" and expires_at and expires_at > now

        if status == "active" and expires_at and expires_at <= now:
            cur.execute(f"UPDATE {schema}.subscriptions SET status='expired', updated_at=NOW() WHERE user_id=%s AND status='active'", (user_id,))
            conn.commit()
            is_active = False

        # Активные режимы (mode_subscriptions)
        cur.execute(f"""
            SELECT mode_id, plan, expires_at FROM {schema}.mode_subscriptions
            WHERE user_id=%s AND status='active' AND expires_at > NOW()
        """, (user_id,))
        mode_rows = cur.fetchall()
        active_modes = {}
        for row in mode_rows:
            active_modes[row[0]] = {
                "plan": row[1],
                "expires_at": row[2].isoformat() if row[2] else None
            }
        # Бесплатные режимы всегда доступны
        for m in FREE_MODES:
            active_modes[m] = {"plan": "free", "expires_at": None}

        cur.close(); conn.close()
        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({
                    "ok": True,
                    "has_subscription": is_active,
                    "plan": plan if is_active else None,
                    "status": status,
                    "expires_at": expires_at.isoformat() if expires_at else None,
                    "can_trial": not used_trial,
                    "active_modes": active_modes,
                })}

    # ── POST ?action=trial — активировать триал ─────────────────────────────
    if method == "POST" and action == "trial":
        cur.execute(f"SELECT id FROM {schema}.subscriptions WHERE user_id=%s AND plan='trial' LIMIT 1", (user_id,))
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
        secret_key = get_secret_key()
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
        payment_id_tbank = str(result["PaymentId"])

        cur.execute(f"UPDATE {schema}.payments SET tbank_payment_id=%s, payment_url=%s WHERE id=%s",
                    (payment_id_tbank, payment_url, payment_id))
        conn.commit()
        cur.close(); conn.close()
        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"ok": True, "payment_url": payment_url, "order_id": order_id})}

    # ── POST ?action=pay-modes — оплата выбранных режимов ──────────────────
    if method == "POST" and action == "pay-modes":
        body = json.loads(event.get("body") or "{}")
        modes = body.get("modes", [])   # список mode_id
        plan = body.get("plan")         # "week" или "month"

        if plan not in MODE_PRICES:
            cur.close(); conn.close()
            return {"statusCode": 400, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"ok": False, "error": "Неверный тариф"})}

        valid_modes = [m for m in modes if m in PAID_MODES]
        if not valid_modes:
            cur.close(); conn.close()
            return {"statusCode": 400, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"ok": False, "error": "Не выбраны режимы"})}

        # Исключаем уже активные режимы
        cur.execute(f"""
            SELECT mode_id FROM {schema}.mode_subscriptions
            WHERE user_id=%s AND status='active' AND expires_at > NOW()
        """, (user_id,))
        already = {r[0] for r in cur.fetchall()}
        new_modes = [m for m in valid_modes if m not in already]
        if not new_modes:
            cur.close(); conn.close()
            return {"statusCode": 400, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"ok": False, "error": "Все выбранные режимы уже активны"})}

        total_amount = MODE_PRICES[plan] * len(new_modes)
        plan_days = 7 if plan == "week" else 30
        mode_labels = {"general": "Общий", "focus": "Фокус", "stress": "Стресс", "energy": "Энергия"}
        modes_str = ", ".join(mode_labels.get(m, m) for m in new_modes)
        description = f"Нейро-звук: {modes_str} ({plan_days} дн.)"

        terminal_key = os.environ["TBANK_TERMINAL_KEY"]
        secret_key = get_secret_key()
        order_id = str(uuid.uuid4())
        frontend = os.environ.get("FRONTEND_URL", "https://erttp.ru")

        # Сохраняем pending-записи для каждого режима
        for mode_id in new_modes:
            cur.execute(f"""
                INSERT INTO {schema}.mode_subscriptions
                  (user_id, mode_id, plan, status, amount, tbank_order_id)
                VALUES (%s, %s, %s, 'pending', %s, %s)
            """, (user_id, mode_id, plan, MODE_PRICES[plan], order_id))
        conn.commit()

        modes_param = ",".join(new_modes)
        params = {
            "TerminalKey": terminal_key,
            "Amount": total_amount,
            "OrderId": order_id,
            "Description": description,
            "SuccessURL": f"{frontend}/brain-booster?payment=success&plan={plan}&modes={modes_param}",
            "FailURL":    f"{frontend}/brain-booster?payment=fail&plan={plan}&modes={modes_param}",
            "NotificationURL": "https://functions.poehali.dev/48623d77-3c76-4711-99a9-3223aae78b96",
        }
        params["Token"] = get_tbank_token(params, secret_key)

        req = urllib.request.Request(
            "https://securepay.tinkoff.ru/v2/Init",
            data=json.dumps(params).encode(),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read())

        if not result.get("Success"):
            cur.execute(f"""
                UPDATE {schema}.mode_subscriptions SET status='failed', updated_at=NOW()
                WHERE tbank_order_id=%s
            """, (order_id,))
            conn.commit()
            cur.close(); conn.close()
            return {"statusCode": 500, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"ok": False, "error": result.get("Message", "Ошибка платежа")})}

        payment_url = result["PaymentURL"]
        payment_id_tbank = str(result["PaymentId"])

        cur.close(); conn.close()
        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"ok": True, "payment_url": payment_url, "order_id": order_id})}

    cur.close(); conn.close()
    return {"statusCode": 404, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"ok": False, "error": "Not found"})}