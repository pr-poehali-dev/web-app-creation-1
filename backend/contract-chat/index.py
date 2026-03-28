'''
Чат переговоров по контракту.
POST / — отправить сообщение (action не задан), подтвердить (action=confirm), отменить (action=cancel)
GET /?action=messages&responseId={id} — получить сообщения чата
GET /?action=status&responseId={id} — получить статус отклика
'''

import json
import os
import base64
import uuid
import mimetypes
from typing import Dict, Any
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor, Json as PgJson
import boto3

DATABASE_URL = os.environ.get('DATABASE_URL')
RESP_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
}


def decimal_to_float(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_to_float(item) for item in obj]
    return obj


def get_db():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''Чат переговоров: отправка сообщений, подтверждение и отмена контракта'''
    method = (event.get('httpMethod') or '').upper()

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    req_headers = event.get('headers', {}) or {}
    user_id_raw = req_headers.get('X-User-Id') or req_headers.get('x-user-id')
    user_id = int(user_id_raw) if user_id_raw and str(user_id_raw).isdigit() else None
    params = event.get('queryStringParameters', {}) or {}
    action = params.get('action', '')

    # ── GET — сообщения или статус ─────────────────────────────────────────────
    if method == 'GET':
        if not user_id:
            return {'statusCode': 401, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Требуется авторизация'}), 'isBase64Encoded': False}

        response_id_raw = params.get('responseId')
        if not response_id_raw:
            return {'statusCode': 400, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'responseId обязателен'}), 'isBase64Encoded': False}
        response_id = int(response_id_raw)

        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute('SELECT cr.*, c.seller_id, c.id as c_id, c.title FROM contract_responses cr JOIN contracts c ON cr.contract_id = c.id WHERE cr.id = %s', (response_id,))
                resp = cur.fetchone()
                if not resp:
                    return {'statusCode': 404, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Отклик не найден'}), 'isBase64Encoded': False}
                resp = dict(resp)
                is_seller = resp['seller_id'] == user_id
                is_buyer = resp['user_id'] == user_id
                if not is_seller and not is_buyer:
                    return {'statusCode': 403, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Нет доступа'}), 'isBase64Encoded': False}

                if action == 'status':
                    cur.execute('SELECT u.first_name, u.last_name, u.company_name FROM users u WHERE u.id = %s', (resp['user_id'],))
                    buyer = cur.fetchone() or {}
                    cur.execute('SELECT u.first_name, u.last_name, u.company_name FROM users u WHERE u.id = %s', (resp['seller_id'],))
                    seller = cur.fetchone() or {}
                    result = {
                        'status': resp['status'],
                        'sellerConfirmed': resp.get('seller_confirmed', False),
                        'buyerConfirmed': resp.get('buyer_confirmed', False),
                        'isSeller': is_seller,
                        'pricePerUnit': float(resp.get('price_per_unit') or 0),
                        'totalAmount': float(resp.get('total_amount') or 0),
                        'contractTitle': resp.get('title', ''),
                        'buyerName': f"{buyer.get('first_name', '')} {buyer.get('last_name', '')}".strip() or buyer.get('company_name', ''),
                        'sellerName': f"{seller.get('first_name', '')} {seller.get('last_name', '')}".strip() or seller.get('company_name', ''),
                    }
                    return {'statusCode': 200, 'headers': RESP_HEADERS, 'body': json.dumps(result), 'isBase64Encoded': False}

                # action == 'messages' или не задан
                cur.execute('''
                    SELECT cm.id, cm.sender_id, cm.text, cm.attachments, cm.created_at,
                           u.first_name, u.last_name, u.company_name
                    FROM contract_messages cm
                    JOIN users u ON u.id = cm.sender_id
                    WHERE cm.response_id = %s
                    ORDER BY cm.created_at ASC
                ''', (response_id,))
                rows = cur.fetchall()
                messages = []
                for r in rows:
                    r = dict(r)
                    name = f"{r.get('first_name', '')} {r.get('last_name', '')}".strip() or r.get('company_name', '')
                    messages.append({
                        'id': r['id'],
                        'senderId': str(r['sender_id']),
                        'senderName': name,
                        'text': r['text'] or '',
                        'attachments': r['attachments'] or [],
                        'timestamp': str(r['created_at']),
                    })
                return {'statusCode': 200, 'headers': RESP_HEADERS, 'body': json.dumps({'messages': messages}), 'isBase64Encoded': False}
        finally:
            conn.close()

    # ── POST — отправить, подтвердить, отменить ────────────────────────────────
    if method == 'POST':
        if not user_id:
            return {'statusCode': 401, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Требуется авторизация'}), 'isBase64Encoded': False}

        body = json.loads(event.get('body') or '{}')
        response_id_raw = body.get('responseId') or params.get('responseId')
        if not response_id_raw:
            return {'statusCode': 400, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'responseId обязателен'}), 'isBase64Encoded': False}
        response_id = int(response_id_raw)

        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute('SELECT cr.*, c.seller_id, c.id as c_id FROM contract_responses cr JOIN contracts c ON cr.contract_id = c.id WHERE cr.id = %s', (response_id,))
                resp = cur.fetchone()
                if not resp:
                    return {'statusCode': 404, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Отклик не найден'}), 'isBase64Encoded': False}
                resp = dict(resp)
                is_seller = resp['seller_id'] == user_id
                is_buyer = resp['user_id'] == user_id
                if not is_seller and not is_buyer:
                    return {'statusCode': 403, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Нет доступа'}), 'isBase64Encoded': False}

                if action == 'confirm':
                    if resp['status'] == 'confirmed':
                        return {'statusCode': 400, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Контракт уже подтверждён'}), 'isBase64Encoded': False}
                    if is_seller:
                        cur.execute('UPDATE contract_responses SET seller_confirmed = TRUE, updated_at = NOW() WHERE id = %s', (response_id,))
                    else:
                        cur.execute('UPDATE contract_responses SET buyer_confirmed = TRUE, updated_at = NOW() WHERE id = %s', (response_id,))
                    cur.execute('SELECT seller_confirmed, buyer_confirmed FROM contract_responses WHERE id = %s', (response_id,))
                    updated = cur.fetchone()
                    both = updated['seller_confirmed'] and updated['buyer_confirmed']
                    if both:
                        cur.execute("UPDATE contract_responses SET status = 'confirmed', confirmed_at = NOW() WHERE id = %s", (response_id,))
                        cur.execute("UPDATE contracts SET status = 'signed', buyer_id = %s WHERE id = %s", (resp['user_id'], resp['c_id']))
                    conn.commit()
                    return {'statusCode': 200, 'headers': RESP_HEADERS, 'body': json.dumps({'success': True, 'bothConfirmed': both}), 'isBase64Encoded': False}

                if action == 'cancel':
                    cur.execute("UPDATE contract_responses SET status = 'cancelled', updated_at = NOW() WHERE id = %s", (response_id,))
                    conn.commit()
                    return {'statusCode': 200, 'headers': RESP_HEADERS, 'body': json.dumps({'success': True}), 'isBase64Encoded': False}

                # Отправить сообщение
                text = (body.get('text') or '').strip()
                file_data = body.get('fileData')
                file_name = body.get('fileName')
                file_type = body.get('fileType', '')
                attachments = []

                if file_data:
                    s3 = boto3.client(
                        's3',
                        endpoint_url='https://bucket.poehali.dev',
                        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
                    )
                    ext = (file_name or '').rsplit('.', 1)[-1].lower() if file_name and '.' in file_name else ''
                    if not ext and file_type:
                        ext = (mimetypes.guess_extension(file_type, strict=False) or '').lstrip('.')
                    key = f"contract-chat/{resp['c_id']}/{uuid.uuid4()}.{ext}" if ext else f"contract-chat/{resp['c_id']}/{uuid.uuid4()}"
                    raw = base64.b64decode(file_data)
                    s3.put_object(Bucket='files', Key=key, Body=raw, ContentType=file_type or 'application/octet-stream')
                    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
                    attachments.append({'url': cdn_url, 'name': file_name or 'file', 'type': file_type})

                if not text and not attachments:
                    return {'statusCode': 400, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Текст или файл обязателен'}), 'isBase64Encoded': False}

                cur.execute(
                    'INSERT INTO contract_messages (contract_id, response_id, sender_id, text, attachments, created_at) VALUES (%s, %s, %s, %s, %s, NOW()) RETURNING id, created_at',
                    (resp['c_id'], response_id, user_id, text, PgJson(attachments))
                )
                row = cur.fetchone()
                conn.commit()
                return {'statusCode': 200, 'headers': RESP_HEADERS, 'body': json.dumps({'id': row['id'], 'createdAt': str(row['created_at'])}), 'isBase64Encoded': False}
        finally:
            conn.close()

    return {'statusCode': 405, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Method not allowed'}), 'isBase64Encoded': False}
