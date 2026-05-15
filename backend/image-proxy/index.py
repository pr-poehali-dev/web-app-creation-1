'''Прокси для загрузки изображений с CDN — обходит CORS для Web Share API'''

import os
import base64
import urllib.request


def handler(event: dict, context) -> dict:
    '''GET /?url=https://cdn.poehali.dev/... — возвращает изображение в base64 с CORS заголовками'''

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': '',
        }

    params = event.get('queryStringParameters') or {}
    image_url = params.get('url', '')

    # Разрешаем только наш CDN
    if not image_url.startswith('https://cdn.poehali.dev/'):
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': '{"error": "Only cdn.poehali.dev URLs allowed"}',
        }

    req = urllib.request.Request(image_url, headers={'User-Agent': 'ERTTP-ImageProxy/1.0'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = resp.read()
        content_type = resp.headers.get('Content-Type', 'image/jpeg')

    b64 = base64.b64encode(data).decode('ascii')

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': content_type,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600',
        },
        'body': b64,
        'isBase64Encoded': True,
    }
