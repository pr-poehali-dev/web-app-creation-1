"""
GET /?contractId=N — возвращает responseId текущего пользователя для контракта.
Используется для открытия модалки переговоров.
"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL')
HEADERS = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}


def handler(event: dict, context) -> dict:
    """Получить responseId пользователя для контракта."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**HEADERS, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'}, 'body': ''}

    req_headers = event.get('headers', {}) or {}
    user_id_raw = req_headers.get('X-User-Id') or req_headers.get('x-user-id')
    user_id = int(user_id_raw) if user_id_raw and str(user_id_raw).isdigit() else None

    if not user_id:
        return {'statusCode': 401, 'headers': HEADERS, 'body': json.dumps({'error': 'Требуется авторизация'})}

    params = event.get('queryStringParameters', {}) or {}
    contract_id_raw = params.get('contractId')
    if not contract_id_raw:
        return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'contractId обязателен'})}

    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    try:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT id FROM contract_responses WHERE contract_id = %s AND user_id = %s LIMIT 1',
                (int(contract_id_raw), user_id)
            )
            row = cur.fetchone()
            if row:
                return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'responseId': row['id']})}
            return {'statusCode': 404, 'headers': HEADERS, 'body': json.dumps({'responseId': None})}
    finally:
        conn.close()
