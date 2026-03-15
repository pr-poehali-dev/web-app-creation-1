"""Генерация аудиофайлов через gTTS и загрузка в S3 для голосовых уведомлений Exolve"""
import json
import os
import boto3
from io import BytesIO
from gtts import gTTS


def handler(event: dict, context) -> dict:
    """Генерирует MP3-файлы с голосовыми уведомлениями и загружает их в S3"""
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

    texts = {
        'new_order': 'Вам поступил новый заказ на ваше предложение. Зайдите на сайт ЕРТТП, чтобы посмотреть детали.',
        'new_response': 'Вам поступил новый отклик на ваш запрос. Зайдите на сайт ЕРТТП, чтобы посмотреть детали.',
    }

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )

    results = {}
    access_key = os.environ['AWS_ACCESS_KEY_ID']

    for key, text in texts.items():
        tts = gTTS(text=text, lang='ru')
        buf = BytesIO()
        tts.write_to_fp(buf)
        buf.seek(0)

        s3_key = f'audio/{key}.mp3'
        s3.put_object(
            Bucket='files',
            Key=s3_key,
            Body=buf.read(),
            ContentType='audio/mpeg'
        )

        cdn_url = f'https://cdn.poehali.dev/projects/{access_key}/bucket/{s3_key}'
        results[key] = cdn_url
        print(f'[AUDIO] Generated and uploaded: {cdn_url}')

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True, 'files': results})
    }
