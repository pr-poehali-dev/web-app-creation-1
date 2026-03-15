"""Загрузка аудиофайлов для голосовых уведомлений Exolve в S3"""
import json
import os
import base64
import boto3


def handler(event: dict, context) -> dict:
    """Принимает base64-аудиофайл и загружает его в S3 как new_order.mp3 или new_response.mp3"""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    try:
        body = json.loads(event.get('body', '{}'))
    except Exception:
        body = {}

    audio_type = body.get('type')
    file_data = body.get('file')

    if audio_type not in ('order', 'response'):
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'type must be "order" or "response"'})
        }

    if not file_data:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'file is required (base64)'})
        }

    if ',' in file_data:
        file_data = file_data.split(',', 1)[1]

    file_bytes = base64.b64decode(file_data)

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )

    s3_key = f'audio/new_{audio_type}.mp3'
    s3.put_object(
        Bucket='files',
        Key=s3_key,
        Body=file_bytes,
        ContentType='audio/mpeg'
    )

    access_key = os.environ['AWS_ACCESS_KEY_ID']
    cdn_url = f'https://cdn.poehali.dev/projects/{access_key}/bucket/{s3_key}'
    print(f'[UPLOAD_AUDIO] Uploaded {s3_key}: {cdn_url}')

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True, 'url': cdn_url})
    }
