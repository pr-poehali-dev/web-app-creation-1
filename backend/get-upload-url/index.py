import json
import os
import uuid
import base64
import boto3
from typing import Dict, Any


CHUNK_SIZE = 4 * 1024 * 1024  # 4 MB — минимальный размер части для S3 multipart


def get_s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Multipart S3 upload для больших видео файлов через чанки по 4 МБ.
    POST /?action=init       — инициализировать загрузку, получить upload_id и key
    POST /?action=part       — загрузить очередной чанк (base64), получить ETag
    POST /?action=complete   — завершить загрузку, получить финальный URL
    POST /?action=abort      — отменить загрузку
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

    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'init')

    body_raw = event.get('body', '{}') or '{}'
    if event.get('isBase64Encoded'):
        body_raw = base64.b64decode(body_raw).decode('utf-8')
    body = json.loads(body_raw)

    s3 = get_s3()

    if action == 'init':
        filename = body.get('filename', 'video.mp4')
        content_type = body.get('contentType', 'video/mp4')
        folder = body.get('folder', 'offer-videos')
        ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'mp4'
        key = f"{folder}/{uuid.uuid4()}.{ext}"

        resp = s3.create_multipart_upload(
            Bucket='files',
            Key=key,
            ContentType=content_type
        )
        upload_id = resp['UploadId']
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'uploadId': upload_id, 'key': key, 'fileUrl': cdn_url}),
            'isBase64Encoded': False
        }

    elif action == 'part':
        key = body.get('key')
        upload_id = body.get('uploadId')
        part_number = int(body.get('partNumber', 1))
        chunk_b64 = body.get('chunk')

        if not all([key, upload_id, chunk_b64]):
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Missing key/uploadId/chunk'}), 'isBase64Encoded': False}

        chunk_data = base64.b64decode(chunk_b64)
        resp = s3.upload_part(
            Bucket='files',
            Key=key,
            UploadId=upload_id,
            PartNumber=part_number,
            Body=chunk_data
        )
        etag = resp['ETag']

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'partNumber': part_number, 'etag': etag}),
            'isBase64Encoded': False
        }

    elif action == 'complete':
        key = body.get('key')
        upload_id = body.get('uploadId')
        parts = body.get('parts', [])
        file_url = body.get('fileUrl', '')

        if not all([key, upload_id, parts]):
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Missing key/uploadId/parts'}), 'isBase64Encoded': False}

        s3.complete_multipart_upload(
            Bucket='files',
            Key=key,
            UploadId=upload_id,
            MultipartUpload={'Parts': [{'PartNumber': p['partNumber'], 'ETag': p['etag']} for p in parts]}
        )

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'url': file_url, 'message': 'Video uploaded successfully'}),
            'isBase64Encoded': False
        }

    elif action == 'abort':
        key = body.get('key')
        upload_id = body.get('uploadId')
        if key and upload_id:
            s3.abort_multipart_upload(Bucket='files', Key=key, UploadId=upload_id)
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True}), 'isBase64Encoded': False}

    return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Unknown action'}), 'isBase64Encoded': False}
