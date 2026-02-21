import json
import os
import psycopg2
import urllib.request
import urllib.parse

def handler(event: dict, context) -> dict:
    '''API для отправки уведомлений через Telegram Bot'''
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
        title = body.get('title')
        message = body.get('message')
        url = body.get('url', '')
        
        if not user_id or not title or not message:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'userId, title and message are required'})
            }
        
        db_url = os.environ.get('DATABASE_URL')
        schema = os.environ.get('DB_SCHEMA', 'public')
        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
        frontend_url = os.environ.get('FRONTEND_URL', 'https://preview--web-app-creation-1.poehali.dev').rstrip('/')
        
        if not bot_token:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Telegram bot token not configured'})
            }
        
        # Получаем Telegram chat_id пользователя из БД
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        user_id_int = int(user_id)
        cur.execute(f'''
            SELECT telegram_chat_id FROM {schema}.users 
            WHERE id = {user_id_int} AND telegram_chat_id IS NOT NULL
        ''')
        
        result = cur.fetchone()
        cur.close()
        conn.close()
        
        if not result or not result[0]:
            print(f'[TELEGRAM] User {user_id} has no telegram_chat_id in DB')
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': False,
                    'message': 'User has not connected Telegram'
                })
            }
        
        chat_id = result[0]
        
        # Формируем сообщение для Telegram
        full_message = f"🔔 *{title}*\n\n{message}"
        if url:
            full_message += f"\n\n[Перейти →]({frontend_url}{url})"
        
        # Отправляем через Telegram Bot API
        telegram_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        data = {
            'chat_id': chat_id,
            'text': full_message,
            'parse_mode': 'Markdown'
        }
        
        req = urllib.request.Request(
            telegram_url,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(req) as response:
            response_data = json.loads(response.read().decode('utf-8'))
            
            if response_data.get('ok'):
                print(f'[TELEGRAM] Successfully sent to user {user_id} (chat_id={chat_id}): {title}')
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message': 'Notification sent via Telegram'
                    })
                }
            else:
                err = response_data.get('description', 'Failed to send')
                print(f'[TELEGRAM] Error for user {user_id}: {err}')
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': False,
                        'error': err
                    })
                }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }