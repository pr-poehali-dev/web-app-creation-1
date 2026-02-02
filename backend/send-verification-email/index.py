'''
Отправляет email с документами верификации администратору через Mail.ru
Args: event - dict с httpMethod, body с данными верификации
      context - объект с атрибутом request_id
Returns: HTTP response dict
'''

import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid JSON'}),
            'isBase64Encoded': False
        }
    
    smtp_user = os.environ.get('SMTP_USER')
    smtp_pass = os.environ.get('SMTP_PASS')
    admin_email = 'doydum-invest@mail.ru'
    
    if not smtp_user or not smtp_pass:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'SMTP credentials not configured'}),
            'isBase64Encoded': False
        }
    
    user_name = body_data.get('userName', 'Не указано')
    user_email = body_data.get('userEmail', 'Не указан')
    verification_type = body_data.get('verificationType', '')
    phone = body_data.get('phone', 'Не указан')
    company_name = body_data.get('companyName', '')
    inn = body_data.get('inn', '')
    registration_address = body_data.get('registrationAddress', '')
    actual_address = body_data.get('actualAddress', '')
    
    passport_scan_url = body_data.get('passportScanUrl', '')
    passport_registration_url = body_data.get('passportRegistrationUrl', '')
    utility_bill_url = body_data.get('utilityBillUrl', '')
    registration_cert_url = body_data.get('registrationCertUrl', '')
    agreement_form_url = body_data.get('agreementFormUrl', '')
    
    verification_type_labels = {
        'individual': 'Физическое лицо',
        'self-employed': 'Самозанятый',
        'entrepreneur': 'Индивидуальный предприниматель',
        'legal_entity': 'Юридическое лицо'
    }
    
    type_label = verification_type_labels.get(verification_type, verification_type)
    
    html_body = f'''
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
            .content {{ background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }}
            .info-row {{ margin-bottom: 15px; }}
            .label {{ font-weight: bold; color: #4b5563; }}
            .value {{ color: #1f2937; }}
            .documents {{ margin-top: 20px; }}
            .doc-link {{ display: block; margin: 10px 0; padding: 10px; background-color: white; border: 1px solid #d1d5db; border-radius: 5px; text-decoration: none; color: #2563eb; }}
            .doc-link:hover {{ background-color: #eff6ff; }}
            .footer {{ margin-top: 20px; padding: 15px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #6b7280; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>📋 Новая заявка на верификацию</h2>
            </div>
            <div class="content">
                <div class="info-row">
                    <span class="label">👤 Пользователь:</span>
                    <span class="value">{user_name}</span>
                </div>
                <div class="info-row">
                    <span class="label">📧 Email:</span>
                    <span class="value">{user_email}</span>
                </div>
                <div class="info-row">
                    <span class="label">📱 Телефон:</span>
                    <span class="value">{phone}</span>
                </div>
                <div class="info-row">
                    <span class="label">🏷️ Тип верификации:</span>
                    <span class="value">{type_label}</span>
                </div>
    '''
    
    if verification_type == 'legal_entity':
        html_body += f'''
                <div class="info-row">
                    <span class="label">🏢 Компания:</span>
                    <span class="value">{company_name}</span>
                </div>
                <div class="info-row">
                    <span class="label">🔢 ИНН:</span>
                    <span class="value">{inn}</span>
                </div>
        '''
    else:
        if registration_address:
            html_body += f'''
                <div class="info-row">
                    <span class="label">📍 Адрес регистрации:</span>
                    <span class="value">{registration_address}</span>
                </div>
            '''
        if actual_address:
            html_body += f'''
                <div class="info-row">
                    <span class="label">🏠 Фактический адрес:</span>
                    <span class="value">{actual_address}</span>
                </div>
            '''
        if inn:
            html_body += f'''
                <div class="info-row">
                    <span class="label">🔢 ИНН:</span>
                    <span class="value">{inn}</span>
                </div>
            '''
    
    html_body += '<div class="documents"><h3>📎 Загруженные документы:</h3>'
    html_body += '<p style="color: #6b7280; font-size: 13px; margin-bottom: 10px;">Нажмите на ссылку, чтобы открыть документ в браузере. Все документы хранятся в защищенном облачном хранилище.</p>'
    
    if passport_scan_url:
        html_body += f'<a href="{passport_scan_url}" class="doc-link" target="_blank">📄 Скан паспорта</a>'
    if passport_registration_url:
        html_body += f'<a href="{passport_registration_url}" class="doc-link" target="_blank">📄 Страница паспорта с регистрацией</a>'
    if utility_bill_url:
        html_body += f'<a href="{utility_bill_url}" class="doc-link" target="_blank">📄 Коммунальный платеж</a>'
    if registration_cert_url:
        html_body += f'<a href="{registration_cert_url}" class="doc-link" target="_blank">📄 Свидетельство о регистрации / Выписка ЕГРЮЛ</a>'
    if agreement_form_url:
        html_body += f'<a href="{agreement_form_url}" class="doc-link" target="_blank">📄 Форма согласия</a>'
    
    html_body += '''
                </div>
            </div>
            <div class="footer">
                <p>Это автоматическое уведомление от системы верификации</p>
                <p>Для проверки документов перейдите в админ-панель</p>
            </div>
        </div>
    </body>
    </html>
    '''
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'Новая заявка на верификацию: {user_name}'
        msg['From'] = smtp_user
        msg['To'] = admin_email
        
        html_part = MIMEText(html_body, 'html', 'utf-8')
        msg.attach(html_part)
        
        with smtplib.SMTP('smtp.mail.ru', 587) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': True, 'message': 'Email sent successfully'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Failed to send email: {str(e)}'}),
            'isBase64Encoded': False
        }