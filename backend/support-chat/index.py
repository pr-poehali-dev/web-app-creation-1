"""
Чат поддержки: пользователи пишут обращения, админы отвечают.
"""
import json
import os
import http.client
import threading
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

SCHEMA = 't_p42562714_web_app_creation_1'
PUSH_URL = '/a1c8fafd-b64f-45e5-b9b9-0a050cca4f7a'

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Admin-Id',
}


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)


def send_push(user_id, title, message, url='/support'):
    try:
        payload = json.dumps({'userId': user_id, 'type': 'support_reply',
                              'title': title, 'message': message, 'url': url})
        conn = http.client.HTTPSConnection('functions.poehali.dev', timeout=8)
        conn.request('POST', PUSH_URL, payload, {'Content-Type': 'application/json'})
        conn.getresponse().read()
        conn.close()
    except Exception as e:
        print(f'[SUPPORT_PUSH] error: {e}')


def handler(event: dict, context) -> dict:
    """Чат поддержки — создание тикетов, отправка и получение сообщений"""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    headers = {**CORS_HEADERS, 'Content-Type': 'application/json'}
    req_headers = event.get('headers', {})
    user_id = req_headers.get('X-User-Id') or req_headers.get('x-user-id')
    admin_id = req_headers.get('X-Admin-Id') or req_headers.get('x-admin-id')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    db = get_db()
    cur = db.cursor()

    try:
        # ── GET /tickets — список тикетов пользователя ─────────────────────
        if method == 'GET' and action == 'tickets':
            if not user_id:
                return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Unauthorized'})}
            cur.execute(f"""
                SELECT t.id, t.subject, t.status, t.created_at, t.updated_at,
                    (SELECT COUNT(*) FROM {SCHEMA}.support_messages m
                     WHERE m.ticket_id = t.id AND m.is_admin = TRUE
                       AND m.created_at > COALESCE(
                           (SELECT MAX(m2.created_at) FROM {SCHEMA}.support_messages m2
                            WHERE m2.ticket_id = t.id AND m2.is_admin = FALSE), t.created_at)) AS unread_admin
                FROM {SCHEMA}.support_tickets t
                WHERE t.user_id = %s
                ORDER BY t.updated_at DESC
            """, (int(user_id),))
            tickets = [dict(r) for r in cur.fetchall()]
            for t in tickets:
                t['created_at'] = t['created_at'].isoformat() if t['created_at'] else None
                t['updated_at'] = t['updated_at'].isoformat() if t['updated_at'] else None
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'tickets': tickets})}

        # ── GET /messages?ticketId=X — сообщения тикета ────────────────────
        if method == 'GET' and action == 'messages':
            ticket_id = params.get('ticketId')
            if not ticket_id:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'ticketId required'})}

            # Проверяем доступ: владелец или админ
            cur.execute(f"SELECT user_id FROM {SCHEMA}.support_tickets WHERE id = %s", (int(ticket_id),))
            row = cur.fetchone()
            if not row:
                return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Ticket not found'})}
            if not admin_id and (not user_id or int(user_id) != row['user_id']):
                return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Forbidden'})}

            cur.execute(f"""
                SELECT m.id, m.ticket_id, m.user_id, m.is_admin, m.message, m.created_at,
                    CASE WHEN m.is_admin THEN 'Поддержка'
                         ELSE COALESCE(u.first_name || ' ' || u.last_name, 'Пользователь') END AS author_name
                FROM {SCHEMA}.support_messages m
                LEFT JOIN {SCHEMA}.users u ON u.id = m.user_id AND NOT m.is_admin
                WHERE m.ticket_id = %s
                ORDER BY m.created_at ASC
            """, (int(ticket_id),))
            messages = [dict(r) for r in cur.fetchall()]
            for m in messages:
                m['created_at'] = m['created_at'].isoformat() if m['created_at'] else None
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'messages': messages})}

        # ── GET /unread — кол-во непрочитанных ответов для пользователя ────
        if method == 'GET' and action == 'unread':
            if not user_id:
                return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Unauthorized'})}
            cur.execute(f"""
                SELECT COUNT(*) AS cnt FROM {SCHEMA}.support_messages m
                JOIN {SCHEMA}.support_tickets t ON t.id = m.ticket_id
                WHERE t.user_id = %s AND m.is_admin = TRUE
                  AND m.created_at > COALESCE(
                      (SELECT MAX(m2.created_at) FROM {SCHEMA}.support_messages m2
                       WHERE m2.ticket_id = m.ticket_id AND m2.is_admin = FALSE), t.created_at)
            """, (int(user_id),))
            cnt = cur.fetchone()['cnt']
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'unread_count': int(cnt)})}

        # ── GET /admin/tickets — все тикеты для админа ─────────────────────
        if method == 'GET' and action == 'admin_tickets':
            if not admin_id:
                return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Unauthorized'})}
            status_filter = params.get('status', '')
            where = f"WHERE t.status = '{status_filter}'" if status_filter in ('open', 'closed') else ''
            cur.execute(f"""
                SELECT t.id, t.user_id, t.subject, t.status, t.created_at, t.updated_at,
                    COALESCE(u.first_name || ' ' || u.last_name, 'Пользователь ' || t.user_id) AS user_name,
                    u.phone,
                    (SELECT COUNT(*) FROM {SCHEMA}.support_messages m WHERE m.ticket_id = t.id) AS msg_count,
                    (SELECT m.message FROM {SCHEMA}.support_messages m
                     WHERE m.ticket_id = t.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
                    (SELECT COUNT(*) FROM {SCHEMA}.support_messages m
                     WHERE m.ticket_id = t.id AND m.is_admin = FALSE
                       AND m.created_at > COALESCE(
                           (SELECT MAX(m2.created_at) FROM {SCHEMA}.support_messages m2
                            WHERE m2.ticket_id = t.id AND m2.is_admin = TRUE), t.created_at)) AS unread_user
                FROM {SCHEMA}.support_tickets t
                LEFT JOIN {SCHEMA}.users u ON u.id = t.user_id
                {where}
                ORDER BY t.updated_at DESC
            """)
            tickets = [dict(r) for r in cur.fetchall()]
            for t in tickets:
                t['created_at'] = t['created_at'].isoformat() if t['created_at'] else None
                t['updated_at'] = t['updated_at'].isoformat() if t['updated_at'] else None
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'tickets': tickets})}

        # ── POST /send — отправить сообщение ───────────────────────────────
        if method == 'POST' and action == 'send':
            body = json.loads(event.get('body', '{}'))
            message_text = (body.get('message') or '').strip()
            ticket_id = body.get('ticketId')
            subject = (body.get('subject') or 'Обращение в поддержку').strip()

            if not message_text:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Сообщение не может быть пустым'})}

            is_admin = bool(admin_id)
            sender_id = int(admin_id) if is_admin else (int(user_id) if user_id else None)
            if not sender_id:
                return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Unauthorized'})}

            # Создаём тикет если не указан
            if not ticket_id:
                if is_admin:
                    return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'ticketId required for admin'})}
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.support_tickets (user_id, subject, status)
                    VALUES (%s, %s, 'open') RETURNING id
                """, (sender_id, subject[:200]))
                ticket_id = cur.fetchone()['id']
            else:
                ticket_id = int(ticket_id)
                # Проверяем доступ
                cur.execute(f"SELECT user_id FROM {SCHEMA}.support_tickets WHERE id = %s", (ticket_id,))
                row = cur.fetchone()
                if not row:
                    db.rollback()
                    return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Ticket not found'})}
                if not is_admin and int(user_id) != row['user_id']:
                    db.rollback()
                    return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Forbidden'})}
                ticket_owner_id = row['user_id']

            # Сохраняем сообщение
            cur.execute(f"""
                INSERT INTO {SCHEMA}.support_messages (ticket_id, user_id, is_admin, message)
                VALUES (%s, %s, %s, %s) RETURNING id, created_at
            """, (ticket_id, sender_id, is_admin, message_text))
            msg = cur.fetchone()

            # Обновляем updated_at тикета
            cur.execute(f"UPDATE {SCHEMA}.support_tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = %s", (ticket_id,))
            db.commit()

            # Push уведомление — пользователю при ответе админа
            if is_admin:
                cur.execute(f"SELECT user_id FROM {SCHEMA}.support_tickets WHERE id = %s", (ticket_id,))
                owner = cur.fetchone()
                if owner:
                    threading.Thread(
                        target=send_push,
                        args=(owner['user_id'], 'Ответ от поддержки',
                              message_text[:80] + ('...' if len(message_text) > 80 else ''), '/support'),
                        daemon=True
                    ).start()

            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
                'success': True,
                'ticketId': ticket_id,
                'messageId': msg['id'],
                'createdAt': msg['created_at'].isoformat()
            })}

        # ── POST /close — закрыть тикет ────────────────────────────────────
        if method == 'POST' and action == 'close':
            body = json.loads(event.get('body', '{}'))
            ticket_id = body.get('ticketId')
            if not ticket_id:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'ticketId required'})}
            cur.execute(f"SELECT user_id FROM {SCHEMA}.support_tickets WHERE id = %s", (int(ticket_id),))
            row = cur.fetchone()
            if not row:
                return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Not found'})}
            if not admin_id and (not user_id or int(user_id) != row['user_id']):
                return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Forbidden'})}
            cur.execute(f"UPDATE {SCHEMA}.support_tickets SET status = 'closed', updated_at = CURRENT_TIMESTAMP WHERE id = %s", (int(ticket_id),))
            db.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True})}

        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Unknown action'})}

    except Exception as e:
        db.rollback()
        print(f'[SUPPORT_CHAT] error: {e}')
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': str(e)})}
    finally:
        cur.close()
        db.close()
