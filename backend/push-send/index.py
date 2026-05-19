import json
import os
import base64
import psycopg2
from cryptography.hazmat.primitives.serialization import load_pem_private_key, Encoding, PrivateFormat, NoEncryption
from pywebpush import webpush, WebPushException


def load_vapid_key_b64() -> str:
    """
    Загружает VAPID приватный ключ из секрета.
    Поддерживает форматы:
    1. PEM (-----BEGIN EC PRIVATE KEY-----)  → конвертируем в DER base64
    2. Чистый base64/base64url              → возвращаем как есть
    pywebpush ожидает DER в base64 (не raw EC bytes).
    """
    raw = os.environ.get('VAPID_PRIVATE_KEY', '').strip()

    if raw.startswith('-----'):
        # PEM-формат: конвертируем в DER base64 (именно это ожидает py_vapid)
        pem = raw.replace('\\n', '\n').strip() + '\n'
        private_key = load_pem_private_key(pem.encode(), password=None)
        der_bytes = private_key.private_bytes(Encoding.DER, PrivateFormat.PKCS8, NoEncryption())
        return base64.urlsafe_b64encode(der_bytes).rstrip(b'=').decode('ascii')
    else:
        # Уже в формате base64/base64url DER — возвращаем как есть
        return raw


def send_web_push(subscription_info: dict, payload: str, vapid_key_b64: str, vapid_claims: dict) -> tuple:
    """Отправляет Web Push через pywebpush"""
    try:
        webpush(
            subscription_info=subscription_info,
            data=payload,
            vapid_private_key=vapid_key_b64,
            vapid_claims=vapid_claims,
        )
        return 201, 'ok'
    except WebPushException as e:
        status = e.response.status_code if e.response is not None else 500
        body = e.response.text[:200] if e.response is not None else str(e)
        return status, body


def handler(event: dict, context) -> dict:
    '''API для отправки push-уведомлений пользователям'''
    method = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }

    try:
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('userId')
        district = body.get('district')
        notification_type = body.get('type')
        title = body.get('title')
        message = body.get('message')
        url = body.get('url', '/')

        if not title or not message:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'title and message are required'})
            }

        db_url = os.environ.get('DATABASE_URL')
        schema = os.environ.get('DB_SCHEMA', 'public')

        conn = psycopg2.connect(db_url)
        cur = conn.cursor()

        if user_id:
            # Если передан не числовой ID — ищем пользователя по телефону/email
            resolved_id = str(user_id)
            if not str(user_id).lstrip('-').isdigit():
                # Нормализуем номер телефона: убираем всё кроме цифр и +
                import re
                normalized = re.sub(r'[\s\-\(\)]', '', str(user_id))
                # Ищем пользователя у которого есть активная подписка (приоритет)
                cur.execute(f'''
                    SELECT u.id FROM {schema}.users u
                    JOIN {schema}.push_subscriptions ps ON ps.user_id = u.id::text AND ps.active = true
                    WHERE u.phone = %s OR u.phone = %s OR u.email = %s
                    LIMIT 1
                ''', (str(user_id), normalized, str(user_id)))
                found = cur.fetchone()
                if not found:
                    # Если подписки нет — просто находим первого пользователя
                    cur.execute(f'''
                        SELECT id FROM {schema}.users
                        WHERE phone = %s OR phone = %s OR email = %s
                        LIMIT 1
                    ''', (str(user_id), normalized, str(user_id)))
                    found = cur.fetchone()
                if found:
                    resolved_id = str(found[0])
                    print(f'[PUSH] resolved phone/email {user_id} (normalized={normalized}) → user_id={resolved_id}')
            cur.execute(f'''
                SELECT subscription_data FROM {schema}.push_subscriptions
                WHERE user_id = %s AND active = true
            ''', (resolved_id,))
        elif district:
            cur.execute(f'''
                SELECT ps.subscription_data FROM {schema}.push_subscriptions ps
                WHERE ps.active = true
            ''')
        else:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'userId or district is required'})
            }

        subscriptions = cur.fetchall()
        print(f'[PUSH] user_id={user_id} (resolved={resolved_id if user_id else "n/a"}) found {len(subscriptions)} subscriptions')
        cur.close()
        conn.close()

        if not subscriptions:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'No active subscriptions found', 'sent': 0})
            }

        # Загружаем VAPID ключ
        try:
            raw_key = os.environ.get('VAPID_PRIVATE_KEY', '')
            print(f'[PUSH] VAPID raw key starts with: {repr(raw_key[:30])}')
            vapid_key_b64 = load_vapid_key_b64()
            print(f'[PUSH] VAPID key loaded OK, len={len(vapid_key_b64)}')
        except Exception as e:
            print(f'[PUSH] VAPID key error: {e}')
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Invalid VAPID key: {e}'})
            }

        vapid_claims = {'sub': 'mailto:noreply@erttp.ru'}

        notification_payload = json.dumps({
            'title': title,
            'body': message,
            'icon': '/favicon.png',
            'badge': '/favicon.png',
            'data': {'url': url, 'type': notification_type},
            'tag': notification_type,
            'requireInteraction': False
        })

        sent_count = 0
        failed_count = 0

        for sub_data in subscriptions:
            try:
                subscription_info = json.loads(sub_data[0])
                # aud должен быть origin URL подписки (требуется Firefox)
                endpoint = subscription_info.get('endpoint', '')
                from urllib.parse import urlparse
                parsed = urlparse(endpoint)
                aud = f'{parsed.scheme}://{parsed.netloc}'
                per_sub_claims = {**vapid_claims, 'aud': aud}
                status_code, resp_text = send_web_push(
                    subscription_info, notification_payload,
                    vapid_key_b64, per_sub_claims
                )
                if status_code in (200, 201, 202):
                    sent_count += 1
                    print(f'[PUSH] Sent OK status={status_code}')
                else:
                    failed_count += 1
                    print(f'[PUSH] Failed status={status_code} body={resp_text}')
                    # Если подписка истекла — деактивируем
                    if status_code in (404, 410):
                        try:
                            conn2 = psycopg2.connect(db_url)
                            cur2 = conn2.cursor()
                            cur2.execute(
                                f"UPDATE {schema}.push_subscriptions SET active=false WHERE subscription_data=%s",
                                (sub_data[0],)
                            )
                            conn2.commit()
                            cur2.close()
                            conn2.close()
                        except Exception:
                            pass
            except Exception as e:
                failed_count += 1
                print(f'[PUSH] Error: {e}')

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'sent': sent_count,
                'failed': failed_count,
                'total': len(subscriptions)
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }