import json
import os
import base64
import psycopg2
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from pywebpush import webpush, WebPushException


def get_vapid_private_key_pem() -> str:
    """
    Читает приватный VAPID ключ из env VAPID_PRIVATE_KEY.
    Поддерживает PEM-формат (с \\n экранированием).
    """
    raw = os.environ.get('VAPID_PRIVATE_KEY', '').strip()
    if not raw:
        raise ValueError('VAPID_PRIVATE_KEY is not set')
    pem = raw.replace('\\n', '\n')
    load_pem_private_key(pem.encode(), password=None)
    print('[PUSH] VAPID key from env OK')
    return pem


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

    if not user_id and not district:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'userId or district is required'})
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
    else:
        cur.execute(f'SELECT subscription_data FROM {schema}.push_subscriptions WHERE active = true')
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

    try:
        vapid_pem = get_vapid_private_key_pem()
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
        subscription_info = None
        try:
            subscription_info = json.loads(sub_data[0])
            webpush(
                subscription_info=subscription_info,
                data=notification_payload,
                vapid_private_key=vapid_pem,
                vapid_claims=vapid_claims
            )
            sent_count += 1
            print(f'[PUSH] Sent OK to endpoint: {subscription_info.get("endpoint", "")[:60]}')
        except WebPushException as e:
            failed_count += 1
            status = e.response.status_code if e.response else 'no-response'
            resp_text = e.response.text[:300] if e.response else ''
            print(f'[PUSH] WebPushException status={status} body={resp_text}')
            if e.response and e.response.status_code in (404, 410) and subscription_info:
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
                    print(f'[PUSH] Deactivated expired subscription for endpoint: {endpoint[:60]}')
                except Exception as ex:
                    print(f'[PUSH] Failed to deactivate: {ex}')
        except Exception as e:
            failed_count += 1
            print(f'[PUSH] Unexpected error: {e}')

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