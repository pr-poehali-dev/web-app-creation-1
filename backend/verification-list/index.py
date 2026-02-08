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
    try:
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
        
        conn = None
        cursor = None
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            query_params = event.get('queryStringParameters') or {}
            status_filter = query_params.get('status', 'pending')
            
            query = f'''
                SELECT 
                    uv.id, uv.user_id, uv.verification_type, uv.status,
                    uv.phone, uv.phone_verified,
                    uv.registration_address, uv.actual_address,
                    uv.passport_scan_url, uv.passport_registration_url, uv.utility_bill_url,
                    uv.registration_cert_url, uv.agreement_form_url,
                    uv.company_name, uv.inn,
                    uv.rejection_reason, uv.created_at, uv.updated_at,
                    u.email, u.first_name, u.last_name,
                    uv.is_resubmitted, uv.admin_message
                FROM user_verifications uv
                JOIN users u ON uv.user_id = u.id
                WHERE uv.status = '{status_filter}'
                ORDER BY uv.is_resubmitted DESC, uv.created_at DESC
            '''
            
            cursor.execute(query)
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
                    'passportRegistrationUrl': row[9],
                    'utilityBillUrl': row[10],
                    'registrationCertUrl': row[11],
                    'agreementFormUrl': row[12],
                    'companyName': row[13],
                    'inn': row[14],
                    'rejectionReason': row[15],
                    'createdAt': row[16].isoformat() if row[16] else None,
                    'updatedAt': row[17].isoformat() if row[17] else None,
                    'userEmail': row[18],
                    'userFirstName': row[19],
                    'userLastName': row[20],
                    'isResubmitted': row[21] if len(row) > 21 else False,
                    'adminMessage': row[22] if len(row) > 22 else None
                })
            
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
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Internal server error: {str(e)}'}),
            'isBase64Encoded': False
        }