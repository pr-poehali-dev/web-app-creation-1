import json
import os
import base64
import uuid
from typing import Dict, Any
import boto3


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    API для загрузки видео файлов
    POST / - загрузить видео и получить URL
    """
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
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    try:
        if method == 'POST':
            return upload_video(event, headers)
        else:
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f'ERROR in upload-video handler: {str(e)}')
        print(f'Traceback: {error_trace}')
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }


def upload_video(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Загрузить видео на S3"""
    body = json.loads(event.get('body', '{}'))
    
    if not body.get('video'):
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Video data required'}),
            'isBase64Encoded': False
        }
    
    video_data_url = body['video']
    
    # Проверяем что это base64 видео
    if not video_data_url.startswith('data:video'):
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Invalid video format'}),
            'isBase64Encoded': False
        }
    
    try:
        # Декодируем base64
        header, base64_data = video_data_url.split(',', 1)
        video_data = base64.b64decode(base64_data)
        
        # Определяем MIME-тип и расширение
        content_type = 'video/mp4'
        extension = 'mp4'
        if 'video/quicktime' in header or 'video/mov' in header:
            content_type = 'video/quicktime'
            extension = 'mov'
        elif 'video/webm' in header:
            content_type = 'video/webm'
            extension = 'webm'
        
        # Проверка размера (макс 10 МБ)
        max_size = 10 * 1024 * 1024
        if len(video_data) > max_size:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Video too large',
                    'maxSize': '10 MB',
                    'actualSize': f'{len(video_data) / 1024 / 1024:.1f} MB'
                }),
                'isBase64Encoded': False
            }
        
        # Загружаем на S3
        s3 = boto3.client('s3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        )
        
        file_id = str(uuid.uuid4())
        s3_key = f"offer-videos/{file_id}.{extension}"
        
        s3.put_object(Bucket='files', Key=s3_key, Body=video_data, ContentType=content_type)
        
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{s3_key}"
        
        print(f"Video uploaded: {cdn_url}, size: {len(video_data) / 1024 / 1024:.2f} MB")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'url': cdn_url,
                'size': len(video_data),
                'message': 'Video uploaded successfully'
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        import traceback
        print(f'ERROR uploading video: {str(e)}')
        print(traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Failed to upload video: {str(e)}'}),
            'isBase64Encoded': False
        }
