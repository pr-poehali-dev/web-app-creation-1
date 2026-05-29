import json
import os
import psycopg2
import requests
from datetime import datetime, timezone


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
}


def ok(data):
    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', **CORS_HEADERS}, 'body': json.dumps(data)}


def err(code, msg):
    return {'statusCode': code, 'headers': {'Content-Type': 'application/json', **CORS_HEADERS}, 'body': json.dumps({'error': msg})}


def get_db():
    schema = os.environ.get('DB_SCHEMA', 'public')
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    return conn, conn.cursor(), schema


PUSH_SEND_URL = 'https://functions.poehali.dev/a1c8fafd-b64f-45e5-b9b9-0a050cca4f7a'


def send_push(user_id, title, message, url='/my-orders', extra_data=None):
    payload = {'userId': str(user_id), 'title': title, 'message': message, 'url': url}
    if extra_data:
        payload.update(extra_data)
    try:
        requests.post(PUSH_SEND_URL, json=payload, timeout=5)
    except Exception:
        pass


def get_user_name(cur, schema, user_id):
    cur.execute(
        f"SELECT first_name, last_name, company_name FROM {schema}.users WHERE id = %s",
        (int(user_id),)
    )
    row = cur.fetchone()
    if not row:
        return 'Пользователь'
    first, last, company = row
    if company:
        return company
    parts = [p for p in [first, last] if p]
    return ' '.join(parts) if parts else 'Пользователь'


def handler(event: dict, context) -> dict:
    """Система онлайн-приглашений: отправить, ответить, проверить статус, присутствие"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    # ── GET ?action=poll&userId=123 ────────────────────────────────────────────
    if method == 'GET' and action == 'poll':
        user_id = params.get('userId')
        if not user_id:
            return err(400, 'userId required')

        conn, cur, schema = get_db()
        try:
            # Обновляем время присутствия пользователя
            cur.execute(f'''
                INSERT INTO {schema}.online_presence (user_id, last_seen_at)
                VALUES (%s, NOW())
                ON CONFLICT (user_id) DO UPDATE SET last_seen_at = NOW()
            ''', (int(user_id),))
            conn.commit()

            cur.execute(f'''
                SELECT i.id, i.order_id, i.sender_id, i.status
                FROM {schema}.online_invitations i
                WHERE i.recipient_id = %s
                  AND i.status = 'pending'
                  AND i.expires_at > NOW()
                ORDER BY i.created_at DESC
                LIMIT 1
            ''', (int(user_id),))
            row = cur.fetchone()
            if not row:
                return ok({'invitation': None})

            inv_id, order_id, sender_id, status = row
            sender_name = get_user_name(cur, schema, sender_id)
            return ok({'invitation': {
                'id': inv_id,
                'orderId': str(order_id),
                'senderId': sender_id,
                'senderName': sender_name,
                'offerTitle': '',
                'status': status,
            }})
        finally:
            cur.close()
            conn.close()

    # ── GET ?action=status&invitationId=5&senderId=123 ─────────────────────────
    if method == 'GET' and action == 'status':
        inv_id = params.get('invitationId')
        sender_id = params.get('senderId')
        if not inv_id or not sender_id:
            return err(400, 'invitationId and senderId required')

        conn, cur, schema = get_db()
        try:
            cur.execute(f'''
                SELECT status, recipient_id, order_id
                FROM {schema}.online_invitations
                WHERE id = %s AND sender_id = %s
            ''', (int(inv_id), int(sender_id)))
            row = cur.fetchone()
            if not row:
                return ok({'status': 'not_found'})
            status, recipient_id, order_id = row
            recipient_name = get_user_name(cur, schema, recipient_id)
            return ok({'status': status, 'recipientName': recipient_name, 'orderId': str(order_id)})
        finally:
            cur.close()
            conn.close()

    # ── GET ?action=check-online&userId=123 ────────────────────────────────────
    # Проверить онлайн ли пользователь (был в приложении последние 30 секунд)
    if method == 'GET' and action == 'check-online':
        user_id = params.get('userId')
        if not user_id:
            return err(400, 'userId required')

        conn, cur, schema = get_db()
        try:
            cur.execute(f'''
                SELECT last_seen_at FROM {schema}.online_presence
                WHERE user_id = %s
                  AND last_seen_at > NOW() - INTERVAL '60 seconds'
            ''', (int(user_id),))
            row = cur.fetchone()
            return ok({'online': row is not None})
        finally:
            cur.close()
            conn.close()

    # ── POST action=send ───────────────────────────────────────────────────────
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        post_action = body.get('action', '')

        if post_action == 'send':
            sender_id = body.get('senderId')
            recipient_id = body.get('recipientId')
            order_id = body.get('orderId')
            if not sender_id or not recipient_id or not order_id:
                return err(400, 'senderId, recipientId, orderId required')

            conn, cur, schema = get_db()
            try:
                cur.execute(f'''
                    UPDATE {schema}.online_invitations
                    SET status = 'expired'
                    WHERE sender_id = %s AND recipient_id = %s AND status = 'pending'
                ''', (int(sender_id), int(recipient_id)))

                cur.execute(f'''
                    INSERT INTO {schema}.online_invitations
                        (order_id, sender_id, recipient_id, status, expires_at)
                    VALUES (%s, %s, %s, 'pending', NOW() + INTERVAL '2 minutes')
                    RETURNING id
                ''', (str(order_id), int(sender_id), int(recipient_id)))
                inv_id = cur.fetchone()[0]
                conn.commit()

                sender_name = get_user_name(cur, schema, sender_id)
                send_push(
                    recipient_id,
                    'Приглашение к онлайн-общению',
                    f'{sender_name} приглашает вас обсудить условия сделки онлайн',
                    f'/my-orders?orderId={str(order_id)}',
                    {'type': 'online_invite', 'invitationId': inv_id, 'orderId': str(order_id)}
                )

                return ok({'invitationId': inv_id, 'status': 'pending'})
            finally:
                cur.close()
                conn.close()

        elif post_action == 'respond':
            inv_id = body.get('invitationId')
            recipient_id = body.get('recipientId')
            response = body.get('response')
            if not inv_id or not recipient_id or response not in ('accepted', 'declined'):
                return err(400, 'invitationId, recipientId, response required')

            conn, cur, schema = get_db()
            try:
                cur.execute(f'''
                    UPDATE {schema}.online_invitations
                    SET status = %s, responded_at = NOW()
                    WHERE id = %s AND recipient_id = %s AND status = 'pending'
                    RETURNING sender_id, order_id
                ''', (response, int(inv_id), int(recipient_id)))
                row = cur.fetchone()
                if not row:
                    return err(404, 'Invitation not found or already responded')
                sender_id, order_id = row
                conn.commit()

                recipient_name = get_user_name(cur, schema, recipient_id)

                if response == 'accepted':
                    send_push(
                        sender_id,
                        'Приглашение принято!',
                        f'{recipient_name} принял приглашение — начните общение',
                        f'/my-orders?orderId={str(order_id)}',
                        {'type': 'invite_accepted', 'orderId': str(order_id)}
                    )
                else:
                    send_push(
                        sender_id,
                        'Не в сети',
                        f'{recipient_name} сейчас не в сети. Предложите цену и условия — ответит позже',
                        f'/my-orders?orderId={str(order_id)}',
                        {'type': 'invite_declined', 'orderId': str(order_id)}
                    )

                return ok({'status': response, 'orderId': str(order_id)})
            finally:
                cur.close()
                conn.close()

    return err(400, 'Unknown action')