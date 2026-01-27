import json
import os
import psycopg2
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def handler(event: dict, context) -> dict:
    '''API для отправки уведомлений через Email'''
    method = event.get('httpMethod', 'POST')
    
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
        user_id = body.get('userId')
        title = body.get('title')
        message = body.get('message')
        url = body.get('url', '')
        
        if not user_id or not title or not message:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'userId, title and message are required'}),
                'isBase64Encoded': False
            }
        
        db_url = os.environ.get('DATABASE_URL')
        schema = os.environ.get('DB_SCHEMA', 'public')
        smtp_user = os.environ.get('SMTP_USER')
        smtp_pass = os.environ.get('SMTP_PASS')
        
        if not smtp_user or not smtp_pass:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'SMTP credentials not configured'}),
                'isBase64Encoded': False
            }
        
        # Получаем email пользователя и настройки уведомлений из БД
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        cur.execute(f'''
            SELECT email, email_notifications FROM {schema}.users 
            WHERE id = %s
        ''', (user_id,))
        
        result = cur.fetchone()
        cur.close()
        conn.close()
        
        if not result or not result[0]:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': False,
                    'message': 'User email not found'
                }),
                'isBase64Encoded': False
            }
        
        user_email = result[0]
        email_enabled = result[1] if len(result) > 1 else True
        
        if not email_enabled:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': False,
                    'message': 'User has disabled email notifications'
                }),
                'isBase64Encoded': False
            }
        
        # Формируем HTML письмо
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb;">{title}</h2>
                    <p style="font-size: 16px;">{message}</p>
                    {f'<p style="margin-top: 20px;"><a href="https://your-domain.com{url}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Перейти к заказу</a></p>' if url else ''}
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <p style="font-size: 12px; color: #6b7280;">Это автоматическое уведомление от ЕРТТП. Вы можете отключить email-уведомления в настройках профиля.</p>
                </div>
            </body>
        </html>
        """
        
        # Отправляем email через SMTP
        msg = MIMEMultipart('alternative')
        msg['Subject'] = title
        msg['From'] = smtp_user
        msg['To'] = user_email
        
        html_part = MIMEText(html_body, 'html')
        msg.attach(html_part)
        
        # Определяем SMTP сервер по email
        if 'gmail.com' in smtp_user:
            smtp_server = 'smtp.gmail.com'
            smtp_port = 587
        elif 'yandex' in smtp_user:
            smtp_server = 'smtp.yandex.ru'
            smtp_port = 587
        elif 'mail.ru' in smtp_user:
            smtp_server = 'smtp.mail.ru'
            smtp_port = 587
        else:
            smtp_server = 'smtp.gmail.com'
            smtp_port = 587
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'message': 'Email notification sent successfully'
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
