'''
Восстановление пароля: запрос токена и установка нового пароля через email
'''

import json
import os
import secrets
from datetime import datetime, timedelta
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import bcrypt
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def send_reset_email(email: str, reset_link: str):
    smtp_user = os.environ.get('SMTP_USER')
    smtp_pass = os.environ.get('SMTP_PASS')
    smtp_host = os.environ.get('SMTP_HOST', 'smtp.mail.ru')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    
    if not smtp_user or not smtp_pass:
        raise ValueError("SMTP credentials not configured")
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'Восстановление пароля'
    msg['From'] = smtp_user
    msg['To'] = email
    
    html = f"""
    <html>
      <body>
        <h2>Восстановление пароля</h2>
        <p>Вы запросили восстановление пароля. Перейдите по ссылке ниже, чтобы создать новый пароль:</p>
        <p><a href="{reset_link}">Восстановить пароль</a></p>
        <p>Ссылка действительна в течение 1 часа.</p>
        <p>Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.</p>
      </body>
    </html>
    """
    
    msg.attach(MIMEText(html, 'html'))
    
    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action', 'request')
        
        if action == 'request':
            email = body_data.get('email', '').strip()
            
            if not email:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email обязателен'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id FROM users WHERE email = %s AND removed_at IS NULL",
                    (email,)
                )
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'success': True,
                            'message': 'Если пользователь существует, письмо будет отправлено'
                        }),
                        'isBase64Encoded': False
                    }
                
                reset_token = secrets.token_urlsafe(32)
                reset_expires = datetime.now() + timedelta(hours=1)
                
                cur.execute(
                    """UPDATE users 
                       SET password_reset_token = %s, 
                           password_reset_expires = %s 
                       WHERE id = %s""",
                    (reset_token, reset_expires, user['id'])
                )
                conn.commit()
                
                try:
                    frontend_url = os.environ.get('FRONTEND_URL', 'https://rynok.poehali.app')
                    reset_link = f"{frontend_url}/new-password?token={reset_token}"
                    send_reset_email(email, reset_link)
                    print(f"Reset password email sent to {email}")
                except Exception as e:
                    print(f"Failed to send reset password email to {email}: {str(e)}")
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'Письмо с инструкциями отправлено на email'
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'reset':
            token = body_data.get('token', '').strip()
            new_password = body_data.get('password', '')
            
            if not token or not new_password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Токен и новый пароль обязательны'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT id, password_reset_expires 
                       FROM users 
                       WHERE password_reset_token = %s AND removed_at IS NULL""",
                    (token,)
                )
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверный токен восстановления'}),
                        'isBase64Encoded': False
                    }
                
                if datetime.now() > user['password_reset_expires']:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Срок действия токена истёк'}),
                        'isBase64Encoded': False
                    }
                
                password_hash = hash_password(new_password)
                
                cur.execute(
                    """UPDATE users 
                       SET password_hash = %s, 
                           password_reset_token = NULL, 
                           password_reset_expires = NULL,
                           failed_login_attempts = 0,
                           locked_until = NULL
                       WHERE id = %s""",
                    (password_hash, user['id'])
                )
                conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'Пароль успешно изменён'
                }),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неизвестное действие'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'}),
            'isBase64Encoded': False
        }
    finally:
        conn.close()