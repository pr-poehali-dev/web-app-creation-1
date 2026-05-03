import json
import os
import psycopg2
from pywebpush import webpush, WebPushException


def load_vapid_pem() -> str:
    """Загружает VAPID приватный ключ из секрета в виде PEM-строки"""
    raw = os.environ.get('VAPID_PRIVATE_KEY', '')
    return raw.replace('\\n', '\n').strip() + '\n'


def send_web_push(subscription_info: dict, payload: str, vapid_pem: str, vapid_claims: dict) -> tuple:
    """Отправляет Web Push через pywebpush"""
    try:
        webpush(
            subscription_info=subscription_info,
            data=payload,
            vapid_private_key=vapid_pem,
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
            cur.execute(f'''
                SELECT subscription_data FROM {schema}.push_subscriptions
                WHERE user_id = %s AND active = true
            ''', (str(user_id),))
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
        print(f'[PUSH] user_id={user_id} found {len(subscriptions)} subscriptions')
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
            vapid_pem = load_vapid_pem()
            print(f'[PUSH] VAPID key loaded OK')
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
                status_code, resp_text = send_web_push(
                    subscription_info, notification_payload,
                    vapid_pem, vapid_claims
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