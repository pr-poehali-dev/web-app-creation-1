'''
Business: Handle user verification form submission with document uploads
Args: event - dict with httpMethod, body, headers including X-User-Id
      context - object with request_id attribute
Returns: HTTP response dict with statusCode, headers, body
'''

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
from datetime import datetime, timedelta

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise Exception('DATABASE_URL environment variable is not set')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def check_rate_limit(conn, identifier: str, endpoint: str, max_requests: int = 5, window_minutes: int = 5) -> bool:
    with conn.cursor() as cur:
        window_start = datetime.now() - timedelta(minutes=window_minutes)
        
        cur.execute(
            """SELECT request_count, window_start 
               FROM rate_limits 
               WHERE identifier = %s AND endpoint = %s""",
            (identifier, endpoint)
        )
        result = cur.fetchone()
        
        if result:
            if result['window_start'] > window_start:
                if result['request_count'] >= max_requests:
                    return False
                cur.execute(
                    """UPDATE rate_limits 
                       SET request_count = request_count + 1 
                       WHERE identifier = %s AND endpoint = %s""",
                    (identifier, endpoint)
                )
            else:
                cur.execute(
                    """UPDATE rate_limits 
                       SET request_count = 1, window_start = CURRENT_TIMESTAMP 
                       WHERE identifier = %s AND endpoint = %s""",
                    (identifier, endpoint)
                )
        else:
            cur.execute(
                """INSERT INTO rate_limits (identifier, endpoint, request_count, window_start) 
                   VALUES (%s, %s, 1, CURRENT_TIMESTAMP)""",
                (identifier, endpoint)
            )
        
        conn.commit()
        return True

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
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
    
    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Unauthorized'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    
    if not check_rate_limit(conn, user_id, 'verification_submit', max_requests=3, window_minutes=5):
        conn.close()
        return {
            'statusCode': 429,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Слишком много запросов. Попробуйте через 5 минут.'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    verification_type = body_data.get('verificationType')
    phone = body_data.get('phone')
    
    if not verification_type or not phone:
        conn.close()
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Verification type and phone are required'}),
            'isBase64Encoded': False
        }
    
    cursor = conn.cursor()
    
    if verification_type == 'legal_entity':
        company_name = body_data.get('companyName', '')
        inn = body_data.get('inn', '')
        registration_cert_url = body_data.get('registrationCertUrl')
        agreement_form_url = body_data.get('agreementFormUrl')
        
        cursor.execute('''
            INSERT INTO user_verifications 
            (user_id, verification_type, phone, company_name, inn, registration_cert_url, agreement_form_url, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                verification_type = EXCLUDED.verification_type,
                phone = EXCLUDED.phone,
                company_name = EXCLUDED.company_name,
                inn = EXCLUDED.inn,
                registration_cert_url = EXCLUDED.registration_cert_url,
                agreement_form_url = EXCLUDED.agreement_form_url,
                status = EXCLUDED.status,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id
        ''', (user_id, verification_type, phone, company_name, inn, registration_cert_url, agreement_form_url, 'pending'))
    else:
        registration_address = body_data.get('registrationAddress', '')
        actual_address = body_data.get('actualAddress', '')
        passport_scan_url = body_data.get('passportScanUrl')
        passport_registration_url = body_data.get('passportRegistrationUrl')
        utility_bill_url = body_data.get('utilityBillUrl')
        inn = body_data.get('inn', '')
        ogrnip = body_data.get('ogrnip', '')
        
        cursor.execute('''
            INSERT INTO user_verifications 
            (user_id, verification_type, phone, registration_address, actual_address, passport_scan_url, passport_registration_url, utility_bill_url, inn, ogrnip, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                verification_type = EXCLUDED.verification_type,
                phone = EXCLUDED.phone,
                registration_address = EXCLUDED.registration_address,
                actual_address = EXCLUDED.actual_address,
                passport_scan_url = EXCLUDED.passport_scan_url,
                passport_registration_url = EXCLUDED.passport_registration_url,
                utility_bill_url = EXCLUDED.utility_bill_url,
                inn = EXCLUDED.inn,
                ogrnip = EXCLUDED.ogrnip,
                status = EXCLUDED.status,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id
        ''', (user_id, verification_type, phone, registration_address, actual_address, passport_scan_url, passport_registration_url, utility_bill_url, inn, ogrnip, 'pending'))
    
    cursor.execute('''
        UPDATE users 
        SET verification_status = %s 
        WHERE id = %s
    ''', ('pending', user_id))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'success': True, 'message': 'Verification request submitted'}),
        'isBase64Encoded': False
    }