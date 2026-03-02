import json
import os
import string
import random
import psycopg2

SCHEMA = 't_p42562714_web_app_creation_1'
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def gen_code(length=7):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=length))

def handler(event: dict, context) -> dict:
    """Создание и разрешение коротких ссылок для шаринга офферов и заявок."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}

    # GET /short-url?code=abc123 — редирект / разрешение
    if method == 'GET':
        code = params.get('code')
        if not code:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'code required'})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT original_url FROM {SCHEMA}.short_urls WHERE code = '{code}'")
        row = cur.fetchone()
        if row:
            cur.execute(f"UPDATE {SCHEMA}.short_urls SET hits = hits + 1 WHERE code = '{code}'")
            conn.commit()
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'url': row[0]})}
        cur.close()
        conn.close()
        return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'not found'})}

    # POST — создать короткую ссылку
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        original_url = body.get('url', '').strip()
        if not original_url or len(original_url) > 2000:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'invalid url'})}

        conn = get_conn()
        cur = conn.cursor()
        # Проверяем, нет ли уже короткой ссылки для этого URL
        safe_url = original_url.replace("'", "''")
        cur.execute(f"SELECT code FROM {SCHEMA}.short_urls WHERE original_url = '{safe_url}'")
        existing = cur.fetchone()
        if existing:
            code = existing[0]
        else:
            for _ in range(5):
                code = gen_code()
                cur.execute(f"SELECT 1 FROM {SCHEMA}.short_urls WHERE code = '{code}'")
                if not cur.fetchone():
                    break
            cur.execute(f"INSERT INTO {SCHEMA}.short_urls (code, original_url) VALUES ('{code}', '{safe_url}')")
            conn.commit()
        cur.close()
        conn.close()

        base = os.environ.get('SITE_URL', 'https://erttp.ru')
        short_url = f"{base}/s/{code}"
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'short_url': short_url, 'code': code})}

    return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'method not allowed'})}
