'''
Business: Get list of verification requests for moderators
Args: event - dict with httpMethod, queryStringParameters for filtering, headers with X-User-Id
      context - object with request_id attribute
Returns: HTTP response dict with list of verification requests
'''

import json
import os
import psycopg2
from typing import Dict, Any, List

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
    
    cursor.execute('SELECT role FROM users WHERE id = %s', (user_id,))
    user_role = cursor.fetchone()
    
    if not user_role or user_role[0] not in ('moderator', 'admin'):
        cursor.close()
        conn.close()
        return {
            'statusCode': 403,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Access denied. Moderator or admin role required.'}),
            'isBase64Encoded': False
        }
    
    query_params = event.get('queryStringParameters') or {}
    status_filter = query_params.get('status', 'pending')
    
    query = '''
        SELECT 
            uv.id, uv.user_id, uv.verification_type, uv.status,
            uv.phone, uv.phone_verified,
            uv.registration_address, uv.actual_address,
            uv.passport_scan_url, uv.utility_bill_url,
            uv.registration_cert_url, uv.agreement_form_url,
            uv.company_name, uv.inn,
            uv.rejection_reason, uv.created_at, uv.updated_at,
            u.email, u.first_name, u.last_name
        FROM user_verifications uv
        JOIN users u ON uv.user_id = u.id
        WHERE uv.status = %s
        ORDER BY uv.created_at DESC
    '''
    
    cursor.execute(query, (status_filter,))
    rows = cursor.fetchall()
    
    verifications: List[Dict[str, Any]] = []
    for row in rows:
        verifications.append({
            'id': row[0],
            'userId': row[1],
            'verificationType': row[2],
            'status': row[3],
            'phone': row[4],
            'phoneVerified': row[5],
            'registrationAddress': row[6],
            'actualAddress': row[7],
            'passportScanUrl': row[8],
            'utilityBillUrl': row[9],
            'registrationCertUrl': row[10],
            'agreementFormUrl': row[11],
            'companyName': row[12],
            'inn': row[13],
            'rejectionReason': row[14],
            'createdAt': row[15].isoformat() if row[15] else None,
            'updatedAt': row[16].isoformat() if row[16] else None,
            'userEmail': row[17],
            'userFirstName': row[18],
            'userLastName': row[19]
        })
    
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'verifications': verifications,
            'total': len(verifications)
        }),
        'isBase64Encoded': False
    }
