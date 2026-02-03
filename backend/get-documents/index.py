'''
Business: Get list of uploaded verification documents for a user
Args: event - dict with httpMethod, headers with X-User-Id
      context - object with request_id attribute
Returns: HTTP response dict with list of documents
'''

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise Exception('DATABASE_URL environment variable is not set')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

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
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'documents': []}),
            'isBase64Encoded': False
        }
    
    try:
        conn = get_db_connection()
        
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, user_id, file_type, file_url, file_name, file_size, 
                          uploaded_at, status
                   FROM verification_documents 
                   WHERE user_id = %s 
                   ORDER BY uploaded_at DESC""",
                (user_id,)
            )
            documents = cur.fetchall()
        
        conn.close()
        
        documents_list = []
        for doc in documents:
            documents_list.append({
                'id': doc['id'],
                'userId': doc['user_id'],
                'fileType': doc['file_type'],
                'fileUrl': doc['file_url'],
                'fileName': doc['file_name'],
                'fileSize': doc['file_size'],
                'uploadedAt': doc['uploaded_at'].isoformat() if doc['uploaded_at'] else None,
                'status': doc['status']
            })
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'documents': documents_list}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        print(f"Error getting documents: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Failed to get documents: {str(e)}'}),
            'isBase64Encoded': False
        }