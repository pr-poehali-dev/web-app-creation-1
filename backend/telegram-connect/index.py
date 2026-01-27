import json
import os
import psycopg2
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''API для привязки Telegram аккаунта к пользователю'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': ''
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User not authenticated'})
        }
    
    db_url = os.environ.get('DATABASE_URL')
    schema = os.environ.get('DB_SCHEMA', 'public')
    
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        if method == 'GET':
            # Проверяем, привязан ли Telegram
            cur.execute(f'''
                SELECT telegram_chat_id FROM {schema}.users 
                WHERE id = %s
            ''', (user_id,))
            
            result = cur.fetchone()
            cur.close()
            conn.close()
            
            if result and result[0]:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'connected': True,
                        'chat_id': str(result[0])
                    })
                }
            else:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'connected': False
                    })
                }
        
        elif method == 'POST':
            # Привязываем Telegram chat_id
            body = json.loads(event.get('body', '{}'))
            telegram_chat_id = body.get('telegram_chat_id')
            
            if not telegram_chat_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'telegram_chat_id is required'})
                }
            
            cur.execute(f'''
                UPDATE {schema}.users 
                SET telegram_chat_id = %s
                WHERE id = %s
            ''', (telegram_chat_id, user_id))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'Telegram connected successfully'
                })
            }
        
        elif method == 'DELETE':
            # Отвязываем Telegram
            cur.execute(f'''
                UPDATE {schema}.users 
                SET telegram_chat_id = NULL
                WHERE id = %s
            ''', (user_id,))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'Telegram disconnected successfully'
                })
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
