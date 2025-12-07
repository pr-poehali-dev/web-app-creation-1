'''
Business: Upload verification documents to Yandex Object Storage
Args: event - dict with httpMethod, body (base64 encoded file), headers with X-User-Id and Content-Type
      context - object with request_id attribute
Returns: HTTP response dict with file URL
'''

import json
import os
import base64
import uuid
from typing import Dict, Any, Tuple
from datetime import datetime, timedelta
import boto3
from botocore.exceptions import ClientError
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise Exception('DATABASE_URL environment variable is not set')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def check_rate_limit(conn, identifier: str, endpoint: str, max_requests: int = 10, window_minutes: int = 1) -> bool:
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

def get_s3_client():
    endpoint_url = 'https://bucket.poehali.dev'
    
    return boto3.client(
        's3',
        endpoint_url=endpoint_url,
        aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID', ''),
        aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY', '')
    )

def detect_file_type(file_data: bytes) -> Tuple[str, str]:
    if len(file_data) < 12:
        return 'application/octet-stream', '.bin'
    
    magic_bytes = file_data[:12]
    print(f"First 12 bytes (hex): {magic_bytes.hex()}")
    
    if file_data.startswith(b'\xFF\xD8\xFF'):
        print("Detected: JPEG")
        return 'image/jpeg', '.jpg'
    elif file_data.startswith(b'\x89PNG\r\n\x1a\n'):
        print("Detected: PNG")
        return 'image/png', '.png'
    elif file_data.startswith(b'GIF87a') or file_data.startswith(b'GIF89a'):
        print("Detected: GIF")
        return 'image/gif', '.gif'
    elif file_data.startswith(b'RIFF') and len(file_data) >= 12 and file_data[8:12] == b'WEBP':
        print("Detected: WebP")
        return 'image/webp', '.webp'
    elif file_data.startswith(b'%PDF'):
        print("Detected: PDF")
        return 'application/pdf', '.pdf'
    else:
        print(f"Unknown file type, magic bytes: {magic_bytes.hex()}")
        return 'application/octet-stream', '.bin'

def get_content_type_extension(content_type: str) -> str:
    extensions = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'application/pdf': '.pdf',
    }
    return extensions.get(content_type.lower(), '.bin')

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-File-Type, X-Original-File-Type',
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
    file_type = headers.get('X-File-Type') or headers.get('x-file-type', 'document')
    original_file_type = headers.get('X-Original-File-Type') or headers.get('x-original-file-type', '')
    content_type = headers.get('Content-Type') or headers.get('content-type', 'application/octet-stream')
    
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
    if not check_rate_limit(conn, user_id, 'upload_document', max_requests=10, window_minutes=1):
        conn.close()
        return {
            'statusCode': 429,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Слишком много запросов. Попробуйте через минуту.'}),
            'isBase64Encoded': False
        }
    conn.close()
    
    body = event.get('body', '')
    is_base64 = event.get('isBase64Encoded', False)
    
    if not body:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'No file data provided'}),
            'isBase64Encoded': False
        }
    
    try:
        print(f"Content-Type: {content_type}, isBase64Encoded: {is_base64}")
        print(f"Body length: {len(body)}, first 100 chars: {body[:100]}")
        
        if content_type == 'application/json' or body.strip().startswith('{'):
            print("Parsing as JSON body")
            body_json = json.loads(body)
            file_base64 = body_json.get('file', '')
            if not file_base64:
                raise ValueError('File data not found in request body')
            print(f"Base64 string length: {len(file_base64)}, first 50 chars: {file_base64[:50]}")
            file_data = base64.b64decode(file_base64)
            print(f"Decoded file data length: {len(file_data)}, first 12 bytes hex: {file_data[:12].hex()}")
        else:
            print("Decoding from base64 body")
            file_data = base64.b64decode(body)
        
        if len(file_data) > 5 * 1024 * 1024:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Размер файла не должен превышать 5 МБ'}),
                'isBase64Encoded': False
            }
        
        bucket_name = 'files'
        
        detected_content_type, file_extension = detect_file_type(file_data)
        print(f"File size: {len(file_data)} bytes, detected type: {detected_content_type}, extension: {file_extension}")
        file_name = f'verifications/{user_id}/{file_type}-{uuid.uuid4()}{file_extension}'
        
        try:
            s3_client = get_s3_client()
            s3_client.put_object(
                Bucket=bucket_name,
                Key=file_name,
                Body=file_data,
                ContentType=detected_content_type,
                ACL='public-read'
            )
            
            file_url = f"https://cdn.poehali.dev/projects/{os.environ.get('AWS_ACCESS_KEY_ID')}/bucket/{file_name}"
        except Exception as s3_error:
            print(f"S3 upload failed: {str(s3_error)}")
            print(f"Error type: {type(s3_error).__name__}")
            print(f"Bucket: {bucket_name}, Key: {file_name}")
            print(f"Endpoint: https://bucket.poehali.dev")
            print(f"AWS_ACCESS_KEY_ID present: {bool(os.environ.get('AWS_ACCESS_KEY_ID'))}")
            print(f"AWS_SECRET_ACCESS_KEY present: {bool(os.environ.get('AWS_SECRET_ACCESS_KEY'))}")
            
            if len(file_data) <= 500 * 1024:
                file_url = f'data:{detected_content_type};base64,{base64.b64encode(file_data).decode()}'
            else:
                return {
                    'statusCode': 500,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Ошибка загрузки файла в хранилище. Попробуйте файл меньшего размера (до 500 КБ) или обратитесь к администратору'}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'url': file_url,
                'fileName': file_name
            }),
            'isBase64Encoded': False
        }
        
    except ClientError as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Storage error: {str(e)}'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Upload failed: {str(e)}'}),
            'isBase64Encoded': False
        }