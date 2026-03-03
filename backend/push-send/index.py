import json
import os
import base64
import psycopg2
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, NoEncryption
from pywebpush import webpush, WebPushException


def get_vapid_key_b64() -> str:
    """
    Загружает VAPID приватный ключ из env.
    Поддерживает два формата:
      1. base64url-encoded DER (предпочтительный, ~44 символа)
      2. PEM (-----BEGIN EC PRIVATE KEY-----)
    Возвращает base64url-encoded DER строку для pywebpush.
    """
    raw = os.environ.get('VAPID_PRIVATE_KEY', '').strip()
    if not raw:
        raise ValueError('VAPID_PRIVATE_KEY не задан')

    # Формат 1: уже base64url DER (нет заголовка PEM)
    if '-----' not in raw:
        return raw

    # Формат 2: PEM — извлекаем DER и конвертируем в base64url
    # Нормализуем переносы строк (секрет может хранить \n как литерал)
    pem = raw.replace('\\n', '\n')
    # Если всё ещё нет переносов — добавим их по позициям PEM
    if '\n' not in pem:
        # Вставляем перенос после заголовка и перед footer
        pem = (
            '-----BEGIN EC PRIVATE KEY-----\n'
            + pem.replace('-----BEGIN EC PRIVATE KEY-----', '')
                 .replace('-----END EC PRIVATE KEY-----', '')
                 .strip()
            + '\n-----END EC PRIVATE KEY-----\n'
        )

    from cryptography.hazmat.primitives.serialization import load_pem_private_key
    private_key = load_pem_private_key(pem.encode(), password=None)
    der = private_key.private_bytes(
        encoding=Encoding.DER,
        format=PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=NoEncryption()
    )
    return base64.urlsafe_b64encode(der).decode('utf-8')


def handler(event: dict, context) -> dict:
    """API для отправки push-уведомлений пользователям"""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }

    if event.get('httpMethod') != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }

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
        cur.execute(f'''
            SELECT subscription_data FROM {schema}.push_subscriptions
            WHERE user_id = %s AND active = true
        ''', (str(user_id),))
    elif district:
        cur.execute(f'''
            SELECT ps.subscription_data
            FROM {schema}.push_subscriptions ps
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
    cur.close()
    conn.close()

    print(f'[PUSH] user_id={user_id} found {len(subscriptions)} subscriptions')

    if not subscriptions:
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'message': 'No active subscriptions found', 'sent': 0})
        }

    # Загружаем ключ
    try:
        vapid_key = get_vapid_key_b64()
        print(f'[PUSH] VAPID key loaded, length={len(vapid_key)}')
    except Exception as e:
        print(f'[PUSH] VAPID key error: {e}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'VAPID key error: {str(e)}'})
        }

    vapid_claims = {"sub": "mailto:noreply@erttp.ru"}

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
            webpush(
                subscription_info=subscription_info,
                data=notification_payload,
                vapid_private_key=vapid_key,
                vapid_claims=vapid_claims
            )
            sent_count += 1
            print(f'[PUSH] Sent OK to endpoint: {subscription_info.get("endpoint", "")[:60]}')
        except WebPushException as e:
            failed_count += 1
            status = e.response.status_code if e.response else 'no-response'
            print(f'[PUSH] WebPushException status={status}: {e}')
            # Деактивируем протухшую подписку (410 Gone)
            if e.response and e.response.status_code in (404, 410):
                try:
                    endpoint = subscription_info.get('endpoint', '')
                    conn2 = psycopg2.connect(db_url)
                    cur2 = conn2.cursor()
                    cur2.execute(f'''
                        UPDATE {schema}.push_subscriptions SET active = false
                        WHERE subscription_data::json->>'endpoint' = %s
                    ''', (endpoint,))
                    conn2.commit()
                    cur2.close()
                    conn2.close()
                    print(f'[PUSH] Deactivated expired subscription')
                except Exception as ex:
                    print(f'[PUSH] Failed to deactivate: {ex}')
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
