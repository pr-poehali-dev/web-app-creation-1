import json
import os
import psycopg2
from pywebpush import webpush, WebPushException
from cryptography.hazmat.primitives.serialization import load_pem_private_key

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
        print(f'[PUSH] user_id={user_id} found {len(subscriptions)} subscriptions')
        cur.close()
        conn.close()
        
        if not subscriptions:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'No active subscriptions found', 'sent': 0})
            }
        
        # Загружаем VAPID ключ напрямую из строки — без временного файла
        vapid_pem_raw = os.environ.get('VAPID_PRIVATE_KEY', '')
        # Нормализуем переносы строк (секрет может хранить \n как литерал)
        vapid_pem = vapid_pem_raw.replace('\\n', '\n').strip()
        if not vapid_pem.endswith('\n'):
            vapid_pem += '\n'
        
        # Проверяем что ключ читается
        try:
            load_pem_private_key(vapid_pem.encode('utf-8'), password=None)
            print(f'[PUSH] VAPID key loaded OK, length={len(vapid_pem)}')
        except Exception as key_err:
            print(f'[PUSH] VAPID key error: {key_err}')
            print(f'[PUSH] Key preview: {repr(vapid_pem[:80])}')
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Invalid VAPID key: {key_err}'})
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
                    vapid_private_key=vapid_pem,
                    vapid_claims=vapid_claims
                )
                sent_count += 1
                print(f'[PUSH] Sent successfully')
            except WebPushException as e:
                failed_count += 1
                resp_info = ''
                if hasattr(e, 'response') and e.response is not None:
                    resp_info = f' status={e.response.status_code} body={e.response.text[:300]}'
                print(f'[PUSH] WebPushException:{resp_info} {e}')
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
