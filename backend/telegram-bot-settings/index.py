'''
Управление настройками Telegram бота для отправки уведомлений
'''

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from jwt_middleware import get_user_from_request

DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def handler(event: dict, context) -> dict:
    '''
    API для управления настройками Telegram бота
    
    GET / - получить текущие настройки
    POST / - обновить настройки (только для root admin)
    '''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = get_db_connection()
        
        if method == 'GET':
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT bot_token, is_active FROM t_p42562714_web_app_creation_1.telegram_bot_settings ORDER BY id DESC LIMIT 1"
                )
                settings = cur.fetchone()
                
                if settings:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'bot_token_exists': bool(settings['bot_token']),
                            'is_active': settings['is_active']
                        }),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'bot_token_exists': False,
                            'is_active': False
                        }),
                        'isBase64Encoded': False
                    }
        
        elif method == 'POST':
            user = get_user_from_request(event)
            if not user or not user.get('is_root_admin'):
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Access denied'}),
                    'isBase64Encoded': False
                }
            
            body = json.loads(event.get('body', '{}'))
            bot_token = body.get('bot_token', '').strip()
            is_active = body.get('is_active', True)
            
            if not bot_token:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Bot token is required'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO t_p42562714_web_app_creation_1.telegram_bot_settings (bot_token, is_active, updated_at)
                       VALUES (%s, %s, CURRENT_TIMESTAMP)
                       ON CONFLICT (id) DO UPDATE 
                       SET bot_token = EXCLUDED.bot_token, 
                           is_active = EXCLUDED.is_active, 
                           updated_at = CURRENT_TIMESTAMP
                       RETURNING id""",
                    (bot_token, is_active)
                )
                conn.commit()
            
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'Telegram bot settings updated'
                }),
                'isBase64Encoded': False
            }
        
        conn.close()
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        print(f'[TELEGRAM_BOT_SETTINGS] Error: {str(e)}')
        import traceback
        print(f'[TELEGRAM_BOT_SETTINGS] Traceback: {traceback.format_exc()}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
