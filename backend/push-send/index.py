import json
import os
import psycopg2
from pywebpush import webpush, WebPushException

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
        notification_type = body.get('type')  # 'new_request', 'new_offer', 'new_response'
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
        
        # Получаем активные подписки
        if user_id:
            # Отправка конкретному пользователю
            cur.execute(f'''
                SELECT subscription_data FROM {schema}.push_subscriptions 
                WHERE user_id = %s AND active = true
            ''', (user_id,))
        elif district:
            # Отправка всем пользователям района
            cur.execute(f'''
                SELECT ps.subscription_data 
                FROM {schema}.push_subscriptions ps
                JOIN {schema}.users u ON ps.user_id = u.id
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
        
        if not subscriptions:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'No active subscriptions found', 'sent': 0})
            }
        
        # VAPID ключи (в продакшене должны храниться в secrets)
        vapid_private_key = os.environ.get('VAPID_PRIVATE_KEY', '')
        vapid_claims = {
            "sub": "mailto:noreply@yourapp.com"
        }
        
        notification_payload = json.dumps({
            'title': title,
            'body': message,
            'icon': '/favicon.png',
            'badge': '/favicon.png',
            'data': {
                'url': url,
                'type': notification_type
            },
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
                    vapid_private_key=vapid_private_key,
                    vapid_claims=vapid_claims
                )
                sent_count += 1
            except WebPushException as e:
                failed_count += 1
                print(f'Failed to send push: {e}')
                # TODO: Если подписка истекла (410), деактивировать её в БД
            except Exception as e:
                failed_count += 1
                print(f'Error sending push: {e}')
        
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
