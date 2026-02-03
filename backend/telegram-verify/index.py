'''
Telegram бот для отправки ссылок верификации телефона и восстановления пароля
'''

import json
import os
import secrets
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
import urllib.request
import urllib.parse

DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def get_bot_token():
    '''Получить токен Telegram бота из переменных окружения'''
    return os.environ.get('TELEGRAM_BOT_TOKEN')

def send_telegram_message(bot_token: str, chat_id: str, text: str, parse_mode: str = 'HTML') -> bool:
    '''Отправить сообщение через Telegram Bot API'''
    try:
        url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
        data = {
            'chat_id': chat_id,
            'text': text,
            'parse_mode': parse_mode,
            'disable_web_page_preview': True
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result.get('ok', False)
    except Exception as e:
        print(f'[TELEGRAM_VERIFY] Error sending message: {str(e)}')
        return False

def handler(event: dict, context) -> dict:
    '''
    Отправка ссылок верификации и восстановления пароля через Telegram
    
    POST /verify-phone - отправить ссылку верификации телефона
    POST /reset-password - отправить ссылку восстановления пароля
    '''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        action = body.get('action')
        phone = body.get('phone', '').strip()
        
        if not phone:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Phone is required'}),
                'isBase64Encoded': False
            }
        
        bot_token = get_bot_token()
        if not bot_token:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Telegram bot not configured'}),
                'isBase64Encoded': False
            }
        
        conn = get_db_connection()
        
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, first_name, last_name, phone, telegram_chat_id FROM t_p42562714_web_app_creation_1.users WHERE phone = %s",
                (phone,)
            )
            user = cur.fetchone()
            
            if not user:
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User not found'}),
                    'isBase64Encoded': False
                }
            
            if not user['telegram_chat_id']:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Telegram not connected. Please connect Telegram first.'}),
                    'isBase64Encoded': False
                }
            
            if action == 'verify-phone':
                token = secrets.token_urlsafe(32)
                expires = datetime.now() + timedelta(hours=24)
                
                cur.execute(
                    """UPDATE t_p42562714_web_app_creation_1.users 
                       SET phone_verification_token = %s, phone_verification_expires = %s
                       WHERE id = %s""",
                    (token, expires, user['id'])
                )
                conn.commit()
                
                verify_link = f"https://erttp.ru/verify-phone?token={token}"
                
                message = f"""
🔐 <b>Подтверждение номера телефона</b>

Здравствуйте, {user['first_name']} {user['last_name']}!

Для подтверждения вашего номера телефона перейдите по ссылке:

{verify_link}

Ссылка действительна 24 часа.

Если вы не регистрировались на erttp.ru, проигнорируйте это сообщение.
"""
                
                success = send_telegram_message(bot_token, str(user['telegram_chat_id']), message)
                
                conn.close()
                
                if success:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'message': 'Verification link sent to Telegram',
                            'expires_at': expires.isoformat()
                        }),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Failed to send Telegram message'}),
                        'isBase64Encoded': False
                    }
            
            elif action == 'reset-password':
                token = secrets.token_urlsafe(32)
                expires = datetime.now() + timedelta(hours=1)
                
                cur.execute(
                    """UPDATE t_p42562714_web_app_creation_1.users 
                       SET password_reset_token = %s, password_reset_expires = %s
                       WHERE id = %s""",
                    (token, expires, user['id'])
                )
                conn.commit()
                
                frontend_url = os.environ.get('FRONTEND_URL', 'https://preview--web-app-creation-1.poehali.dev')
                reset_link = f"{frontend_url}/reset-password?token={token}"
                
                message = f"""
🔑 <b>Восстановление пароля</b>

Здравствуйте, {user['first_name']} {user['last_name']}!

Для восстановления пароля перейдите по ссылке:

{reset_link}

Ссылка действительна 1 час.

Если вы не запрашивали восстановление пароля, проигнорируйте это сообщение.
"""
                
                success = send_telegram_message(bot_token, str(user['telegram_chat_id']), message)
                
                conn.close()
                
                if success:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'message': 'Password reset link sent to Telegram',
                            'expires_at': expires.isoformat()
                        }),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Failed to send Telegram message'}),
                        'isBase64Encoded': False
                    }
            
            else:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid action'}),
                    'isBase64Encoded': False
                }
    
    except Exception as e:
        print(f'[TELEGRAM_VERIFY] Error: {str(e)}')
        import traceback
        print(f'[TELEGRAM_VERIFY] Traceback: {traceback.format_exc()}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }