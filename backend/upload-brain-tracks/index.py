"""
Скачивает royalty-free MP3 треки с incompetech.com и загружает в S3 CDN.
Вызывать один раз вручную через тест.
"""
import os
import boto3
import urllib.request

CDN_PREFIX = 'brain-sounds'

TRACKS = [
    # (имя файла в CDN, URL источника)
    ('focus2.mp3',  'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Meditation%20Impromptu%2003.mp3'),
    ('focus3.mp3',  'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Gymnopedie%20No%203.mp3'),
    ('focus4.mp3',  'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Open%20Those%20Bright%20Eyes.mp3'),
    ('stress2.mp3', 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Comfortable%20Mystery.mp3'),
    ('stress3.mp3', 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Relaxing%20Piano%20Music.mp3'),
    ('energy2.mp3', 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Intended%20Force.mp3'),
    ('energy3.mp3', 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Flutey%20Funk.mp3'),
    ('all2.mp3',    'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Relaxing%20Piano%20Music.mp3'),
    ('all3.mp3',    'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Gymnopedie%20No%203.mp3'),
    ('eyes2.mp3',   'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Open%20Those%20Bright%20Eyes.mp3'),
    ('eyes3.mp3',   'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Comfortable%20Mystery.mp3'),
]

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}, 'body': ''}

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )

    results = []
    headers_req = {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://incompetech.com/',
    }

    for filename, url in TRACKS:
        key = f'{CDN_PREFIX}/{filename}'
        try:
            req = urllib.request.Request(url, headers=headers_req)
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = resp.read()

            s3.put_object(
                Bucket='files',
                Key=key,
                Body=data,
                ContentType='audio/mpeg',
            )
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
            results.append({'file': filename, 'status': 'ok', 'url': cdn_url})
        except Exception as e:
            results.append({'file': filename, 'status': 'error', 'error': str(e)})

    ok = sum(1 for r in results if r['status'] == 'ok')
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': f'{{"uploaded": {ok}, "total": {len(TRACKS)}, "results": {str(results)}}}'
    }
