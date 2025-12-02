'''
Business: Upload verification documents to S3 storage
Args: event - dict with httpMethod, body (base64 encoded file), headers with X-User-Id and Content-Type
      context - object with request_id attribute
Returns: HTTP response dict with file URL
'''

import json
import os
import base64
import uuid
from typing import Dict, Any
import boto3
from botocore.exceptions import ClientError

def get_s3_client():
    return boto3.client(
        's3',
        aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
        region_name=os.environ.get('AWS_REGION', 'eu-central-1')
    )

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
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-File-Type',
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
        if is_base64:
            file_data = base64.b64decode(body)
        else:
            body_json = json.loads(body)
            file_base64 = body_json.get('file', '')
            if not file_base64:
                raise ValueError('File data not found in request body')
            file_data = base64.b64decode(file_base64)
        
        if len(file_data) > 10 * 1024 * 1024:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'File size exceeds 10MB limit'}),
                'isBase64Encoded': False
            }
        
        bucket_name = os.environ.get('AWS_S3_BUCKET')
        if not bucket_name:
            raise ValueError('AWS_S3_BUCKET environment variable not set')
        
        file_extension = get_content_type_extension(content_type)
        file_name = f'verifications/{user_id}/{file_type}-{uuid.uuid4()}{file_extension}'
        
        s3_client = get_s3_client()
        s3_client.put_object(
            Bucket=bucket_name,
            Key=file_name,
            Body=file_data,
            ContentType=content_type,
            ServerSideEncryption='AES256'
        )
        
        file_url = f'https://{bucket_name}.s3.amazonaws.com/{file_name}'
        
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
            'body': json.dumps({'error': f'S3 error: {str(e)}'}),
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
