import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
from pywebpush import webpush, WebPushException

def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    '''API для управления push-уведомлениями и подписками'''
    
    method = event.get('httpMethod', 'GET')
    
    # CORS
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Authorization'
    }
    
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}
    
    try:
        # Получаем user_id из заголовка
        user_id = event.get('headers', {}).get('X-User-Id') or event.get('headers', {}).get('x-user-id')
        
        if not user_id:
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'Unauthorized'})
            }
        
        # Подключение к БД
        dsn = os.environ.get('DATABASE_URL')
        schema = os.environ.get('DB_SCHEMA', 'public')
        
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        body = json.loads(event.get('body', '{}')) if event.get('body') else {}
        action = body.get('action', 'subscribe')  # subscribe, unsubscribe, send
        
        # POST - сохранить подписку
        if method == 'POST' and action == 'subscribe':
            subscription = body.get('subscription')
            
            if not subscription:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Subscription required'})
                }
            
            # Сохраняем подписку
            cursor.execute(f'''
                INSERT INTO {schema}.push_subscriptions (user_id, subscription_data)
                VALUES (%s, %s)
                ON CONFLICT (user_id, subscription_data)
                DO UPDATE SET updated_at = NOW()
            ''', (user_id, json.dumps(subscription)))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'success': True})
            }
        
        # POST - удалить подписку
        elif method == 'POST' and action == 'unsubscribe':
            subscription = body.get('subscription')
            
            if subscription:
                cursor.execute(f'''
                    DELETE FROM {schema}.push_subscriptions
                    WHERE user_id = %s AND subscription_data = %s
                ''', (user_id, json.dumps(subscription)))
            else:
                # Удаляем все подписки пользователя
                cursor.execute(f'''
                    DELETE FROM {schema}.push_subscriptions
                    WHERE user_id = %s
                ''', (user_id,))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'success': True})
            }
        
        # POST - отправить push-уведомление
        elif method == 'POST' and action == 'send':
            target_user_id = body.get('userId')
            notification_data = body.get('notification')
            
            if not target_user_id or not notification_data:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'userId and notification required'})
                }
            
            # Получаем подписки пользователя
            cursor.execute(f'''
                SELECT subscription_data FROM {schema}.push_subscriptions
                WHERE user_id = %s AND active = true
            ''', (target_user_id,))
            
            subscriptions = cursor.fetchall()
            
            if not subscriptions:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'sent': 0, 'message': 'No active subscriptions'})
                }
            
            # VAPID ключи из переменных окружения
            vapid_private_key = os.environ.get('VAPID_PRIVATE_KEY')
            vapid_public_key = os.environ.get('VAPID_PUBLIC_KEY')
            vapid_email = os.environ.get('VAPID_EMAIL', 'mailto:support@erttp.ru')
            
            if not vapid_private_key or not vapid_public_key:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 500,
                    'headers': headers,
                    'body': json.dumps({'error': 'VAPID keys not configured'})
                }
            
            sent_count = 0
            failed_subscriptions = []
            
            # Отправляем push каждой подписке
            for sub_row in subscriptions:
                try:
                    subscription_info = json.loads(sub_row['subscription_data'])
                    
                    webpush(
                        subscription_info=subscription_info,
                        data=json.dumps(notification_data),
                        vapid_private_key=vapid_private_key,
                        vapid_claims={
                            "sub": vapid_email,
                            "aud": subscription_info['endpoint']
                        }
                    )
                    sent_count += 1
                    
                except WebPushException as e:
                    print(f'WebPush failed: {e}')
                    # Если подписка недействительна (410, 404) - помечаем на удаление
                    if e.response and e.response.status_code in [410, 404]:
                        failed_subscriptions.append(sub_row['subscription_data'])
                except Exception as e:
                    print(f'Push send error: {e}')
            
            # Удаляем недействительные подписки
            if failed_subscriptions:
                for sub_data in failed_subscriptions:
                    cursor.execute(f'''
                        DELETE FROM {schema}.push_subscriptions
                        WHERE user_id = %s AND subscription_data = %s
                    ''', (target_user_id, sub_data))
                conn.commit()
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'sent': sent_count,
                    'failed': len(failed_subscriptions)
                })
            }
        
        # Метод не поддерживается
        else:
            cursor.close()
            conn.close()
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'})
            }
            
    except Exception as e:
        print(f'Error: {e}')
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }