'''
Business: Get user verification status
Args: event - dict with httpMethod, headers including X-User-Id
      context - object with request_id attribute
Returns: HTTP response dict with verification status
'''

import json
import os
import psycopg2
from typing import Dict, Any

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise Exception('DATABASE_URL environment variable is not set')
    return psycopg2.connect(dsn)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
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
    cursor = conn.cursor()
    
    cursor.execute(f'''
        SELECT verification_status, user_type, phone, company_name, inn, ogrnip
        FROM users 
        WHERE id = {user_id}
    ''')
    
    result = cursor.fetchone()
    
    if not result:
        cursor.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'User not found'}),
            'isBase64Encoded': False
        }
    
    user_verification_status = result[0] if result[0] else 'not_verified'
    user_type = result[1] if len(result) > 1 else None
    phone = result[2] if len(result) > 2 else None
    company_name = result[3] if len(result) > 3 else None
    inn = result[4] if len(result) > 4 else None
    ogrnip = result[5] if len(result) > 5 else None
    
    cursor.execute(f'''
        SELECT id, status, rejection_reason, verification_type, admin_message,
               passport_scan_url, passport_registration_url, utility_bill_url,
               registration_cert_url, agreement_form_url, created_at, updated_at
        FROM user_verifications
        WHERE user_id = {user_id}
        ORDER BY created_at DESC
        LIMIT 1
    ''')
    
    verification_data = cursor.fetchone()
    verification_record = None
    rejection_reason = None
    verification_type = None
    existing_docs = {}
    verification_status = user_verification_status
    
    if verification_data:
        verification_type = verification_data[3]
        # ВАЖНО: используем статус из user_verifications, а не из users
        # Конвертируем 'approved' в 'verified' для фронтенда
        db_status = verification_data[1] if verification_data[1] else user_verification_status
        verification_status = 'verified' if db_status == 'approved' else db_status
        if verification_data[1] == 'rejected':
            rejection_reason = verification_data[2]
        
        verification_record = {
            'id': verification_data[0],
            'status': verification_data[1],
            'rejectionReason': verification_data[2],
            'verificationType': verification_data[3],
            'adminMessage': verification_data[4],
            'createdAt': verification_data[10].isoformat() if verification_data[10] else None,
            'updatedAt': verification_data[11].isoformat() if verification_data[11] else None
        }
        
        existing_docs = {
            'passportScanUrl': verification_data[5],
            'passportRegistrationUrl': verification_data[6],
            'utilityBillUrl': verification_data[7],
            'registrationCertUrl': verification_data[8],
            'agreementFormUrl': verification_data[9]
        }
    
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'verificationStatus': verification_status,
            'isVerified': verification_status == 'verified',
            'userType': user_type,
            'phone': phone,
            'companyName': company_name,
            'inn': inn,
            'ogrnip': ogrnip,
            'rejectionReason': rejection_reason,
            'verificationType': verification_type,
            'existingDocuments': existing_docs,
            'verification': verification_record
        }),
        'isBase64Encoded': False
    }