import json
import os
import psycopg2
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''API для управления push-подписками пользователей'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': ''
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('userId')
        subscription = body.get('subscription')
        
        if not user_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'userId is required'})
            }
        
        db_url = os.environ.get('DATABASE_URL')
        schema = os.environ.get('DB_SCHEMA', 'public')
        
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        if method == 'POST':
            if not subscription:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'subscription is required'})
                }
            
            subscription_str = json.dumps(subscription)
            
            # Проверяем, есть ли уже подписка для этого пользователя
            cur.execute(f'''
                SELECT id FROM {schema}.push_subscriptions 
                WHERE user_id = %s AND active = true
            ''', (user_id,))
            
            existing = cur.fetchone()
            
            if existing:
                # Обновляем существующую подписку
                cur.execute(f'''
                    UPDATE {schema}.push_subscriptions 
                    SET subscription_data = %s, updated_at = %s
                    WHERE user_id = %s AND active = true
                ''', (subscription_str, datetime.now(), user_id))
            else:
                # Создаем новую подписку
                cur.execute(f'''
                    INSERT INTO {schema}.push_subscriptions 
                    (user_id, subscription_data, active, created_at, updated_at)
                    VALUES (%s, %s, true, %s, %s)
                ''', (user_id, subscription_str, datetime.now(), datetime.now()))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Subscription saved'})
            }
        
        elif method == 'DELETE':
            # Деактивируем подписку
            cur.execute(f'''
                UPDATE {schema}.push_subscriptions 
                SET active = false, updated_at = %s
                WHERE user_id = %s
            ''', (datetime.now(), user_id))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Subscription removed'})
            }
        
        else:
            cur.close()
            conn.close()
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'})
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
