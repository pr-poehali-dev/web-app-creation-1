'''
Business: Secure authentication API with password hashing and brute-force protection
Args: event - dict with httpMethod, body, queryStringParameters
      context - object with attributes: request_id, function_name
Returns: HTTP response dict with statusCode, headers, body
'''

import json
import os
import secrets
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
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

def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def check_account_locked(conn, email: str) -> Optional[str]:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT locked_until FROM users WHERE email = %s",
            (email,)
        )
        result = cur.fetchone()
        if result and result['locked_until']:
            locked_until = result['locked_until']
            if datetime.now() < locked_until:
                return locked_until.isoformat()
    return None

def increment_failed_attempts(conn, email: str):
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE email = %s",
            (email,)
        )
        cur.execute(
            "SELECT failed_login_attempts FROM users WHERE email = %s",
            (email,)
        )
        result = cur.fetchone()
        if result and result['failed_login_attempts'] >= 5:
            locked_until = datetime.now() + timedelta(minutes=15)
            cur.execute(
                "UPDATE users SET locked_until = %s WHERE email = %s",
                (locked_until, email)
            )
        conn.commit()

def reset_failed_attempts(conn, email: str):
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE email = %s",
            (email,)
        )
        conn.commit()

def send_reset_email(email: str, reset_link: str):
    smtp_user = os.environ.get('SMTP_USER')
    smtp_pass = os.environ.get('SMTP_PASS')
    smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    use_ssl = os.environ.get('SMTP_USE_SSL', 'false').lower() == 'true'
    
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
    
    if use_ssl:
        import ssl
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context) as server:
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
    else:
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
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    
    try:
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'register':
                email = body_data.get('email', '').strip()
                password = body_data.get('password', '')
                first_name = body_data.get('firstName', '').strip()
                last_name = body_data.get('lastName', '').strip()
                middle_name = body_data.get('middleName', '').strip()
                user_type = body_data.get('userType', '')
                phone = body_data.get('phone', '').strip()
                
                if not all([email, password, first_name, last_name, user_type, phone]):
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заполните все обязательные поля'}),
                        'isBase64Encoded': False
                    }
                
                with conn.cursor() as cur:
                    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
                    if cur.fetchone():
                        return {
                            'statusCode': 409,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Пользователь с таким email уже существует'}),
                            'isBase64Encoded': False
                        }
                    
                    password_hash = hash_password(password)
                    cur.execute(
                        """INSERT INTO users (email, password_hash, first_name, last_name, middle_name, 
                           user_type, phone, company_name, inn, ogrnip, ogrn, position, director_name, legal_address)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                           RETURNING id, email, first_name, last_name, middle_name, user_type, phone, 
                                     company_name, inn, ogrnip, ogrn, position, director_name, legal_address, created_at""",
                        (email, password_hash, first_name, last_name, middle_name or None, user_type, phone,
                         body_data.get('companyName'), body_data.get('inn'), body_data.get('ogrnip'),
                         body_data.get('ogrnLegal'), body_data.get('position'), body_data.get('directorName'),
                         body_data.get('legalAddress'))
                    )
                    user = cur.fetchone()
                    conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'user': dict(user)
                    }, default=str),
                    'isBase64Encoded': False
                }
            
            elif action == 'check_email':
                email = body_data.get('email', '').strip()
                
                if not email:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Email обязателен'}),
                        'isBase64Encoded': False
                    }
                
                with conn.cursor() as cur:
                    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
                    user = cur.fetchone()
                
                if user:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True, 'exists': True}),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': False, 'exists': False}),
                        'isBase64Encoded': False
                    }
            
            elif action == 'update_profile':
                email = body_data.get('email', '').strip()
                first_name = body_data.get('firstName', '').strip()
                last_name = body_data.get('lastName', '').strip()
                middle_name = body_data.get('middleName', '').strip()
                phone = body_data.get('phone', '').strip()
                
                if not email:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Email обязателен'}),
                        'isBase64Encoded': False
                    }
                
                with conn.cursor() as cur:
                    cur.execute(
                        """UPDATE users 
                           SET first_name = %s, last_name = %s, middle_name = %s, phone = %s 
                           WHERE email = %s
                           RETURNING id, email, first_name, last_name, middle_name, user_type, phone, 
                                     company_name, inn, ogrnip, ogrn, position, director_name, legal_address, created_at""",
                        (first_name, last_name, middle_name or None, phone, email)
                    )
                    user = cur.fetchone()
                    
                    if not user:
                        return {
                            'statusCode': 404,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Пользователь не найден'}),
                            'isBase64Encoded': False
                        }
                    
                    conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'user': dict(user)
                    }, default=str),
                    'isBase64Encoded': False
                }
            
            elif action == 'login':
                email = body_data.get('email', '').strip()
                password = body_data.get('password', '')
                
                if not email or not password:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Email и пароль обязательны'}),
                        'isBase64Encoded': False
                    }
                
                locked_until = check_account_locked(conn, email)
                if locked_until:
                    return {
                        'statusCode': 423,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'error': 'Аккаунт временно заблокирован из-за множественных неудачных попыток входа',
                            'locked_until': locked_until
                        }),
                        'isBase64Encoded': False
                    }
                
                with conn.cursor() as cur:
                    cur.execute(
                        """SELECT id, email, password_hash, first_name, last_name, middle_name, 
                           user_type, phone, is_active, company_name, inn, ogrnip, ogrn, 
                           position, director_name, legal_address, created_at, role 
                           FROM users WHERE email = %s""",
                        (email,)
                    )
                    user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверный email или пароль'}),
                        'isBase64Encoded': False
                    }
                
                if not user['is_active']:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Аккаунт деактивирован'}),
                        'isBase64Encoded': False
                    }
                
                if not verify_password(password, user['password_hash']):
                    increment_failed_attempts(conn, email)
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверный email или пароль'}),
                        'isBase64Encoded': False
                    }
                
                reset_failed_attempts(conn, email)
                
                user_data = dict(user)
                user_data.pop('password_hash')
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'user': user_data
                    }, default=str),
                    'isBase64Encoded': False
                }
            
            elif action == 'forgot_password':
                email = body_data.get('email', '').strip()
                
                if not email:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Email обязателен'}),
                        'isBase64Encoded': False
                    }
                
                with conn.cursor() as cur:
                    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
                    user = cur.fetchone()
                    
                    if user:
                        token = secrets.token_urlsafe(32)
                        expires_at = datetime.now() + timedelta(hours=1)
                        
                        cur.execute(
                            """INSERT INTO password_reset_tokens (user_id, token, expires_at) 
                               VALUES (%s, %s, %s)""",
                            (user['id'], token, expires_at)
                        )
                        conn.commit()
                        
                        frontend_url = os.environ.get('FRONTEND_URL', 'https://preview--web-app-creation-1.poehali.dev')
                        reset_link = f"{frontend_url}/new-password?token={token}"
                        
                        try:
                            send_reset_email(email, reset_link)
                        except Exception as e:
                            print(f"Email send error: {e}")
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Если пользователь существует, письмо отправлено'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'reset_password':
                token = body_data.get('token', '').strip()
                new_password = body_data.get('newPassword', '')
                
                if not token or not new_password:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Токен и новый пароль обязательны'}),
                        'isBase64Encoded': False
                    }
                
                with conn.cursor() as cur:
                    cur.execute(
                        """SELECT user_id, expires_at, used 
                           FROM password_reset_tokens 
                           WHERE token = %s""",
                        (token,)
                    )
                    reset_token = cur.fetchone()
                    
                    if not reset_token:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Неверный токен'}),
                            'isBase64Encoded': False
                        }
                    
                    if reset_token['used']:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Токен уже использован'}),
                            'isBase64Encoded': False
                        }
                    
                    if datetime.now() > reset_token['expires_at']:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Срок действия токена истек'}),
                            'isBase64Encoded': False
                        }
                    
                    password_hash = hash_password(new_password)
                    cur.execute(
                        "UPDATE users SET password_hash = %s, failed_login_attempts = 0, locked_until = NULL WHERE id = %s",
                        (password_hash, reset_token['user_id'])
                    )
                    cur.execute(
                        "UPDATE password_reset_tokens SET used = TRUE WHERE token = %s",
                        (token,)
                    )
                    conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Пароль успешно изменен'}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
    
    finally:
        conn.close()