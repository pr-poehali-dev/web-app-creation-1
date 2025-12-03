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
    
    cursor.execute('''
        SELECT verification_status, user_type, phone, company_name, inn, ogrnip
        FROM users 
        WHERE id = %s
    ''', (user_id,))
    
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not result:
        return {
            'statusCode': 404,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'User not found'}),
            'isBase64Encoded': False
        }
    
    verification_status = result[0] if result[0] else 'not_verified'
    user_type = result[1] if len(result) > 1 else None
    phone = result[2] if len(result) > 2 else None
    company_name = result[3] if len(result) > 3 else None
    inn = result[4] if len(result) > 4 else None
    ogrnip = result[5] if len(result) > 5 else None
    
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
            'ogrnip': ogrnip
        }),
        'isBase64Encoded': False
    }