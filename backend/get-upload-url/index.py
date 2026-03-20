import json
import os
import uuid
import boto3
from typing import Dict, Any


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Генерирует presigned URL для прямой загрузки видео/файла в S3 из браузера.
    POST / — тело: { "filename": "video.mp4", "contentType": "video/mp4", "folder": "offer-videos" }
    Возвращает: { "uploadUrl": "...", "fileUrl": "...", "key": "..." }
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }

    body = json.loads(event.get('body', '{}'))
    filename = body.get('filename', 'file')
    content_type = body.get('contentType', 'video/mp4')
    folder = body.get('folder', 'offer-videos')

    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'mp4'
    key = f"{folder}/{uuid.uuid4()}.{ext}"

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )

    upload_url = s3.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': 'files',
            'Key': key,
            'ContentType': content_type,
        },
        ExpiresIn=3600
    )

    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'uploadUrl': upload_url,
            'fileUrl': cdn_url,
            'key': key
        }),
        'isBase64Encoded': False
    }
