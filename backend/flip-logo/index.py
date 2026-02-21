import boto3
import requests
import os
from PIL import Image
from io import BytesIO

def handler(event: dict, context) -> dict:
    """Скачивает оригинальный логотип, зеркалит по горизонтали и загружает в S3"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}, 'body': ''}

    original_url = "https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/bucket/4bbf8889-8425-4a91-bebb-1e4aaa060042.png"
    
    response = requests.get(original_url)
    img = Image.open(BytesIO(response.content))
    
    flipped = img.transpose(Image.FLIP_LEFT_RIGHT)
    
    output = BytesIO()
    flipped.save(output, format='PNG')
    output.seek(0)
    
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )
    
    key = 'logo-flipped.png'
    s3.put_object(Bucket='files', Key=key, Body=output.read(), ContentType='image/png')
    
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/files/{key}"
    
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': f'{{"url": "{cdn_url}"}}'
    }
