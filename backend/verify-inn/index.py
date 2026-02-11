import json
import os
import requests
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''Проверка ИНН через DaData API и создание заявки на верификацию'''
    
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
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
        inn = body.get('inn', '').strip()
        user_type = body.get('userType', '')
        user_id = body.get('userId')
        company_name = body.get('companyName', '').strip()
        ogrnip = body.get('ogrnip', '').strip()
        
        if not inn:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'ИНН обязателен'}),
                'isBase64Encoded': False
            }
        
        dadata_key = os.environ.get('DADATA_API_KEY')
        if not dadata_key:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'DaData API key не настроен'}),
                'isBase64Encoded': False
            }
        
        # Проверка ИНН через DaData
        dadata_url = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party'
        headers = {
            'Authorization': f'Token {dadata_key}',
            'Content-Type': 'application/json'
        }
        
        response = requests.post(
            dadata_url,
            headers=headers,
            json={'query': inn},
            timeout=10
        )
        
        if response.status_code != 200:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Не удалось проверить ИНН'}),
                'isBase64Encoded': False
            }
        
        data = response.json()
        suggestions = data.get('suggestions', [])
        
        if not suggestions:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'ИНН не найден в базе ФНС'}),
                'isBase64Encoded': False
            }
        
        org_data = suggestions[0].get('data', {})
        
        # Debug: выводим структуру данных для анализа
        print(f"DEBUG: org_data keys: {list(org_data.keys())}")
        print(f"DEBUG: state field: {org_data.get('state')}")
        
        org_name = org_data.get('name', {}).get('full_with_opf', '') if org_data.get('name') else ''
        org_inn = org_data.get('inn', '')
        org_ogrn = org_data.get('ogrn', '')
        org_ogrnip = org_data.get('ogrnip', '')
        state_data = org_data.get('state')
        org_status = state_data.get('status', '') if isinstance(state_data, dict) and state_data else ''
        org_address = org_data.get('address', {}).get('value', '') if org_data.get('address') else ''
        
        print(f"DEBUG: org_status = '{org_status}', user_type = '{user_type}'")
        
        # Для юрлиц проверяем статус организации
        # Для ИП и самозанятых НЕ проверяем статус (ИНН физлица остается после ликвидации ИП)
        if user_type == 'legal-entity' and org_status and org_status != 'ACTIVE':
            status_messages = {
                'LIQUIDATED': 'ИНН принадлежит ликвидированной организации',
                'LIQUIDATING': 'Организация находится в процессе ликвидации',
                'BANKRUPT': 'Организация признана банкротом',
                'REORGANIZING': 'Организация находится в процессе реорганизации'
            }
            error_message = status_messages.get(org_status, f'Организация не активна (статус: {org_status})')
            
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'error': error_message,
                    'status': org_status
                }),
                'isBase64Encoded': False
            }
        
        # Проверка соответствия ФИО для ИП и самозанятых
        if user_type in ['entrepreneur', 'self-employed']:
            # Получаем ФИО владельца ИНН из ФНС
            fio_data = org_data.get('fio', {})
            fns_surname = fio_data.get('surname', '').strip().lower() if isinstance(fio_data, dict) else ''
            fns_name = fio_data.get('name', '').strip().lower() if isinstance(fio_data, dict) else ''
            fns_patronymic = fio_data.get('patronymic', '').strip().lower() if isinstance(fio_data, dict) else ''
            
            # Получаем данные пользователя из БД
            import psycopg2
            from psycopg2.extras import RealDictCursor
            db_url = os.environ.get('DATABASE_URL')
            conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
            cur = conn.cursor()
            
            cur.execute(
                "SELECT first_name, last_name, middle_name FROM users WHERE id = %s",
                (user_id,)
            )
            user_data = cur.fetchone()
            
            if not user_data:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пользователь не найден'}),
                    'isBase64Encoded': False
                }
            
            user_surname = user_data['last_name'].strip().lower() if user_data['last_name'] else ''
            user_name = user_data['first_name'].strip().lower() if user_data['first_name'] else ''
            user_patronymic = user_data['middle_name'].strip().lower() if user_data['middle_name'] else ''
            
            # Сравниваем ФИО (фамилия и имя обязательны, отчество опционально)
            name_match = (
                fns_surname == user_surname and 
                fns_name == user_name and 
                (not fns_patronymic or not user_patronymic or fns_patronymic == user_patronymic)
            )
            
            if not name_match:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'error': 'ИНН не совпадает с именем пользователя',
                        'details': {
                            'profile_fio': f"{user_data['last_name']} {user_data['first_name']} {user_data['middle_name'] or ''}".strip(),
                            'inn_fio': f"{fio_data.get('surname', '')} {fio_data.get('name', '')} {fio_data.get('patronymic', '') or ''}".strip() if isinstance(fio_data, dict) else org_name
                        }
                    }),
                    'isBase64Encoded': False
                }
            
            cur.close()
            conn.close()
        
        # Сохранение заявки на верификацию в БД (повторное подключение для юрлиц или после проверки ФИО)
        import psycopg2
        db_url = os.environ.get('DATABASE_URL')
        
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Создаём заявку на верификацию
        cur.execute("""
            INSERT INTO verification_requests 
            (user_id, user_type, inn, company_name, ogrnip, ogrn, 
             verified_name, verified_address, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            user_id,
            user_type,
            org_inn,
            company_name if user_type == 'legal-entity' else None,
            ogrnip if user_type == 'entrepreneur' else org_ogrnip,
            org_ogrn if user_type == 'legal-entity' else None,
            org_name,
            org_address,
            'pending',
            datetime.now()
        ))
        
        request_id = cur.fetchone()[0]
        conn.commit()
        
        cur.close()
        conn.close()
        
        # Отправка email администратору
        send_admin_notification(user_id, user_type, org_name, org_inn, request_id)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'requestId': request_id,
                'verified': {
                    'name': org_name,
                    'inn': org_inn,
                    'ogrn': org_ogrn or org_ogrnip,
                    'address': org_address,
                    'status': org_status
                }
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


def send_admin_notification(user_id: int, user_type: str, org_name: str, inn: str, request_id: int):
    '''Отправка email уведомления администратору'''
    
    smtp_user = os.environ.get('SMTP_USER')
    smtp_pass = os.environ.get('SMTP_PASS')
    frontend_url = os.environ.get('FRONTEND_URL', 'https://preview.poehali.dev')
    
    if not smtp_user or not smtp_pass:
        return
    
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    
    user_type_labels = {
        'self-employed': 'Самозанятый',
        'entrepreneur': 'Индивидуальный предприниматель',
        'legal-entity': 'Юридическое лицо'
    }
    
    subject = f'Новая заявка на верификацию #{request_id}'
    
    html = f'''
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #4F46E5;">Новая заявка на верификацию</h2>
            <p><strong>ID заявки:</strong> {request_id}</p>
            <p><strong>ID пользователя:</strong> {user_id}</p>
            <p><strong>Тип:</strong> {user_type_labels.get(user_type, user_type)}</p>
            <p><strong>Организация:</strong> {org_name}</p>
            <p><strong>ИНН:</strong> {inn}</p>
            <hr style="border: 1px solid #E5E7EB; margin: 20px 0;">
            <p>
                <a href="{frontend_url}/admin/verifications" 
                   style="background-color: #4F46E5; color: white; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                    Перейти в админ-панель
                </a>
            </p>
        </body>
    </html>
    '''
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = smtp_user
    msg['To'] = smtp_user
    
    msg.attach(MIMEText(html, 'html'))
    
    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
    except Exception as e:
        print(f'Failed to send email: {e}')