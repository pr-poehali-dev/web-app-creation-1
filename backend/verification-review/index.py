'''
Business: Approve or reject verification request by moderator
Args: event - dict with httpMethod, body containing verificationId, action, rejectionReason
      context - object with request_id attribute
Returns: HTTP response dict with updated verification status
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
    
    headers = event.get('headers', {})
    moderator_id = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not moderator_id:
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
    
    cursor.execute('SELECT role FROM users WHERE id = %s', (moderator_id,))
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
    
    body_data = json.loads(event.get('body', '{}'))
    verification_id = body_data.get('verificationId')
    action = body_data.get('action')
    rejection_reason = body_data.get('rejectionReason', '')
    
    if not verification_id or not action or action not in ('approve', 'reject'):
        cursor.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid request. verificationId and action required.'}),
            'isBase64Encoded': False
        }
    
    new_status = 'approved' if action == 'approve' else 'rejected'
    user_verification_status = 'verified' if action == 'approve' else 'rejected'
    
    cursor.execute('''
        UPDATE user_verifications 
        SET status = %s, 
            rejection_reason = %s,
            reviewed_by = %s,
            reviewed_at = CURRENT_TIMESTAMP,
            verified_at = CASE WHEN %s = 'approved' THEN CURRENT_TIMESTAMP ELSE NULL END
        WHERE id = %s
        RETURNING user_id
    ''', (new_status, rejection_reason, moderator_id, new_status, verification_id))
    
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
            'body': json.dumps({'error': 'Verification request not found'}),
            'isBase64Encoded': False
        }
    
    user_id = result[0]
    
    cursor.execute('''
        UPDATE users 
        SET verification_status = %s
        WHERE id = %s
    ''', (user_verification_status, user_id))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'success': True,
            'message': f'Verification request {action}d successfully',
            'status': new_status
        }),
        'isBase64Encoded': False
    }
