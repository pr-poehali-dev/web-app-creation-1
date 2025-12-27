import json
import os
import base64
import uuid
from typing import Dict, Any
import boto3


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    API для загрузки видео и изображений
    POST / - загрузить медиа и получить URL
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
    """Загрузить видео или изображение на S3"""
    body = json.loads(event.get('body', '{}'))
    
    if not body.get('video'):
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Video/Image data required'}),
            'isBase64Encoded': False
        }
    
    media_data_url = body['video']
    
    # Проверяем что это base64 медиа (видео или изображение)
    is_video = media_data_url.startswith('data:video')
    is_image = media_data_url.startswith('data:image')
    
    if not is_video and not is_image:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Invalid media format. Must be video or image'}),
            'isBase64Encoded': False
        }
    
    try:
        # Декодируем base64
        header, base64_data = media_data_url.split(',', 1)
        media_data = base64.b64decode(base64_data)
        
        # Определяем MIME-тип и расширение
        if is_video:
            content_type = 'video/mp4'
            extension = 'mp4'
            folder = 'offer-videos'
            if 'video/quicktime' in header or 'video/mov' in header:
                content_type = 'video/quicktime'
                extension = 'mov'
            elif 'video/webm' in header:
                content_type = 'video/webm'
                extension = 'webm'
        else:
            # Изображение
            content_type = 'image/jpeg'
            extension = 'jpg'
            folder = 'offer-images'
            if 'image/png' in header:
                content_type = 'image/png'
                extension = 'png'
            elif 'image/webp' in header:
                content_type = 'image/webp'
                extension = 'webp'
            elif 'image/gif' in header:
                content_type = 'image/gif'
                extension = 'gif'
        
        # Проверка размера (макс 10 МБ для видео, 5 МБ для изображений)
        max_size = 10 * 1024 * 1024 if is_video else 5 * 1024 * 1024
        if len(media_data) > max_size:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'error': f'{"Video" if is_video else "Image"} too large',
                    'maxSize': f'{"10" if is_video else "5"} MB',
                    'actualSize': f'{len(media_data) / 1024 / 1024:.1f} MB'
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
        s3_key = f"{folder}/{file_id}.{extension}"
        
        s3.put_object(Bucket='files', Key=s3_key, Body=media_data, ContentType=content_type)
        
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{s3_key}"
        
        media_type = "Video" if is_video else "Image"
        print(f"{media_type} uploaded: {cdn_url}, size: {len(media_data) / 1024 / 1024:.2f} MB")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'url': cdn_url,
                'size': len(media_data),
                'message': f'{media_type} uploaded successfully'
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        import traceback
        print(f'ERROR uploading media: {str(e)}')
        print(traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Failed to upload media: {str(e)}'}),
            'isBase64Encoded': False
        }