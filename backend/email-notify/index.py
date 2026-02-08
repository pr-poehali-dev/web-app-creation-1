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
        
        # Формируем красивое HTML письмо
        html_body = f"""
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{title}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                            <!-- Header with logo -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center;">
                                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                        🚀 ЕРТТП
                                    </h1>
                                    <p style="margin: 8px 0 0 0; color: #dbeafe; font-size: 14px;">Единый Реестр Транспортно-Технологического Присоединения</p>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                                        <h2 style="margin: 0 0 12px 0; color: #1e40af; font-size: 22px; font-weight: 600;">
                                            {title}
                                        </h2>
                                        <p style="margin: 0; color: #1e3a8a; font-size: 16px; line-height: 1.6;">
                                            {message}
                                        </p>
                                    </div>
                                    
                                    {f'''
                                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                                        <tr>
                                            <td align="center">
                                                <a href="https://your-domain.com{url}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3); transition: all 0.3s;">
                                                    📦 Перейти к заказу
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                    ''' if url else ''}
                                    
                                    <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
                                        <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                                            <strong>Что делать дальше?</strong>
                                        </p>
                                        <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
                                            <li>Проверьте детали заказа в личном кабинете</li>
                                            <li>Свяжитесь с покупателем для уточнения деталей</li>
                                            <li>Подготовьте товар к отгрузке</li>
                                        </ul>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">
                                        Это автоматическое уведомление от платформы ЕРТТП
                                    </p>
                                    <p style="margin: 0 0 16px 0; color: #9ca3af; font-size: 12px;">
                                        Вы можете отключить email-уведомления в <a href="https://your-domain.com/profile" style="color: #2563eb; text-decoration: none;">настройках профиля</a>
                                    </p>
                                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                                        <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                                            © 2026 ЕРТТП. Все права защищены.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        </table>
                        
                        <!-- Support info -->
                        <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                            <tr>
                                <td align="center">
                                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                        Если у вас возникли вопросы, напишите нам на 
                                        <a href="mailto:support@erttp.ru" style="color: #2563eb; text-decoration: none;">support@erttp.ru</a>
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
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