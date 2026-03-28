'''
Список контрактов пользователя или всех контрактов (с фильтрами).
Если передан user_id — возвращает контракты, где пользователь продавец или покупатель.
POST / — создать отклик на контракт (v2), отправить сообщение в чат, подтверждение/отмена
GET /?responses=true&contractId={id} — список откликов на контракт (только для автора)
GET /?myResponses=true — контракты на которые пользователь откликнулся (без GROUP BY)
GET /?action=chatMessages&responseId={id} — сообщения чата
'''

import json
import os
import base64
import uuid
import mimetypes
from typing import Dict, Any
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3

DATABASE_URL = os.environ.get('DATABASE_URL')

RESP_HEADERS = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}


def decimal_to_float(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_to_float(item) for item in obj]
    return obj

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    raw_method = event.get('httpMethod') or event.get('requestContext', {}).get('httpMethod') or ''
    method: str = raw_method.upper() if raw_method else 'GET'
    
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

    # ── POST — чат и подтверждение ─────────────────────────────────────────────
    if method == 'POST':
        if not user_id:
            return {'statusCode': 401, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Требуется авторизация'}), 'isBase64Encoded': False}
        action = params.get('action')
        body = json.loads(event.get('body') or '{}')
        response_id_raw = body.get('responseId') or params.get('responseId')
        if not response_id_raw:
            return {'statusCode': 400, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'responseId обязателен'}), 'isBase64Encoded': False}
        response_id = int(response_id_raw)

        conn = get_db_connection()
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

                # Отправить сообщение в чат (с возможным вложением)
                text = (body.get('text') or '').strip()
                file_data = body.get('fileData')
                file_name = body.get('fileName')
                file_type = body.get('fileType', '')
                attachments = []

                if file_data:
                    try:
                        s3 = boto3.client(
                            's3',
                            endpoint_url='https://bucket.poehali.dev',
                            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
                        )
                        ext = (file_name or '').rsplit('.', 1)[-1].lower() if file_name and '.' in file_name else ''
                        if not ext and file_type:
                            ext = mimetypes.guess_extension(file_type, strict=False) or ''
                            ext = ext.lstrip('.')
                        unique_name = f"contract-chat/{resp['c_id']}/{uuid.uuid4()}.{ext}" if ext else f"contract-chat/{resp['c_id']}/{uuid.uuid4()}"
                        raw = base64.b64decode(file_data)
                        s3.put_object(Bucket='files', Key=unique_name, Body=raw, ContentType=file_type or 'application/octet-stream')
                        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{unique_name}"
                        attachments.append({'url': cdn_url, 'name': file_name or 'file', 'type': file_type})
                    except Exception as e:
                        return {'statusCode': 500, 'headers': RESP_HEADERS, 'body': json.dumps({'error': f'Ошибка загрузки файла: {str(e)}'}), 'isBase64Encoded': False}

                if not text and not attachments:
                    return {'statusCode': 400, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Текст или файл обязателен'}), 'isBase64Encoded': False}

                from psycopg2.extras import Json as PgJson
                cur.execute('INSERT INTO contract_messages (contract_id, response_id, sender_id, text, attachments, created_at) VALUES (%s, %s, %s, %s, %s, NOW()) RETURNING id, created_at',
                            (resp['c_id'], response_id, user_id, text, PgJson(attachments)))
                row = cur.fetchone()
                conn.commit()
                return {'statusCode': 200, 'headers': RESP_HEADERS, 'body': json.dumps({'id': row['id'], 'createdAt': str(row['created_at'])}), 'isBase64Encoded': False}
        finally:
            conn.close()

    if method != 'GET':
        return {'statusCode': 405, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Method not allowed'}), 'isBase64Encoded': False}


    # ── GET ?action=respond — создать отклик на контракт ─────────────────────
    if params.get('action') == 'respond':
        if not user_id:
            return {'statusCode': 401, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Требуется авторизация'}), 'isBase64Encoded': False}

        contract_id_raw = params.get('contractId')
        if not contract_id_raw:
            return {'statusCode': 400, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'contractId обязателен'}), 'isBase64Encoded': False}

        contract_id = int(contract_id_raw)
        comment = (params.get('comment') or '').strip()
        price_per_unit_raw = params.get('pricePerUnit')
        total_amount_raw = params.get('totalAmount')

        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute('SELECT id, seller_id, status, quantity, price_per_unit FROM contracts WHERE id = %s', (contract_id,))
                contract = cur.fetchone()
                if not contract:
                    return {'statusCode': 404, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Контракт не найден'}), 'isBase64Encoded': False}
                if contract['status'] != 'open':
                    return {'statusCode': 400, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Контракт недоступен для отклика'}), 'isBase64Encoded': False}
                if contract['seller_id'] == user_id:
                    return {'statusCode': 400, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Нельзя откликнуться на собственный контракт'}), 'isBase64Encoded': False}

                cur.execute('SELECT id FROM contract_responses WHERE contract_id = %s AND user_id = %s', (contract_id, user_id))
                if cur.fetchone():
                    return {'statusCode': 409, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Вы уже откликнулись на этот контракт'}), 'isBase64Encoded': False}

                price_per_unit = float(price_per_unit_raw) if price_per_unit_raw else float(contract['price_per_unit'] or 0)
                total_amount = float(total_amount_raw) if total_amount_raw else price_per_unit * float(contract['quantity'] or 1)

                cur.execute(
                    'INSERT INTO contract_responses (contract_id, user_id, price_per_unit, total_amount, comment, status) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id',
                    (contract_id, user_id, price_per_unit, total_amount, comment, 'pending')
                )
                new_id = cur.fetchone()['id']
                conn.commit()

                return {'statusCode': 200, 'headers': RESP_HEADERS, 'body': json.dumps({'id': new_id, 'message': 'Отклик успешно отправлен'}), 'isBase64Encoded': False}
        finally:
            conn.close()

    # GET ?responses=true&contractId={id} — список откликов (только для автора)
    if params.get('responses') == 'true':
        if not user_id:
            return {'statusCode': 401, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Требуется авторизация'}), 'isBase64Encoded': False}

        contract_id_raw = params.get('contractId')
        if not contract_id_raw:
            return {'statusCode': 400, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'contractId обязателен'}), 'isBase64Encoded': False}

        contract_id = int(contract_id_raw)
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute('SELECT seller_id FROM contracts WHERE id = %s', (contract_id,))
                contract = cur.fetchone()
                if not contract:
                    return {'statusCode': 404, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Контракт не найден'}), 'isBase64Encoded': False}
                if contract['seller_id'] != user_id:
                    return {'statusCode': 403, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Нет доступа'}), 'isBase64Encoded': False}

                cur.execute('''
                    SELECT cr.*, u.first_name, u.last_name, u.phone, u.email
                    FROM contract_responses cr
                    JOIN users u ON cr.user_id = u.id
                    WHERE cr.contract_id = %s
                    ORDER BY cr.created_at DESC
                ''', (contract_id,))
                rows = cur.fetchall()
                responses = []
                for r in rows:
                    d = decimal_to_float(dict(r))
                    d['firstName'] = d.pop('first_name')
                    d['lastName'] = d.pop('last_name')
                    d['pricePerUnit'] = d.pop('price_per_unit')
                    d['totalAmount'] = d.pop('total_amount')
                    d['contractId'] = d.pop('contract_id')
                    d['userId'] = d.pop('user_id')
                    d['createdAt'] = str(d.pop('created_at'))
                    d['updatedAt'] = str(d.pop('updated_at'))
                    responses.append(d)

                return {'statusCode': 200, 'headers': RESP_HEADERS, 'body': json.dumps({'responses': responses, 'total': len(responses)}), 'isBase64Encoded': False}
        finally:
            conn.close()

    # GET ?myResponses=true — контракты на которые пользователь откликнулся
    if params.get('myResponses') == 'true':
        if not user_id:
            return {'statusCode': 401, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Требуется авторизация'}), 'isBase64Encoded': False}

        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute('''
                    SELECT c.*, cr.id as response_id, cr.price_per_unit as my_price, cr.total_amount as my_total, cr.comment as my_comment, cr.status as my_response_status,
                        cr.seller_confirmed, cr.buyer_confirmed, cr.confirmed_at, cr.created_at as cr_created_at,
                        s.first_name as seller_first_name, s.last_name as seller_last_name, s.company_name as seller_company_name,
                        me.first_name as my_first_name, me.last_name as my_last_name,
                        COALESCE((SELECT AVG(rating) FROM reviews WHERE reviewed_user_id = c.seller_id), 0) as seller_rating
                    FROM contract_responses cr
                    JOIN contracts c ON cr.contract_id = c.id
                    LEFT JOIN users s ON c.seller_id = s.id
                    LEFT JOIN users me ON cr.user_id = me.id
                    WHERE cr.user_id = %s
                    ORDER BY cr_created_at DESC
                ''', (user_id,))
                rows = cur.fetchall()
                contracts_list = []
                for row in rows:
                    d = decimal_to_float(dict(row))
                    d['sellerFirstName'] = d.pop('seller_first_name', '')
                    d['sellerLastName'] = d.pop('seller_last_name', '')
                    d['sellerCompanyName'] = d.pop('seller_company_name', None)
                    d['sellerRating'] = d.pop('seller_rating', 0)
                    d['contractType'] = d.pop('contract_type', '')
                    d['productName'] = d.pop('product_name', '')
                    d['productSpecs'] = d.pop('product_specs', None)
                    d['pricePerUnit'] = d.pop('price_per_unit', 0)
                    d['totalAmount'] = d.pop('total_amount', 0)
                    d['myPrice'] = d.pop('my_price', 0)
                    d['myTotal'] = d.pop('my_total', 0)
                    d['myComment'] = d.pop('my_comment', '')
                    d['myResponseStatus'] = d.pop('my_response_status', 'pending')
                    d['responseId'] = d.pop('response_id', None)
                    d['sellerConfirmed'] = d.pop('seller_confirmed', False)
                    d['buyerConfirmed'] = d.pop('buyer_confirmed', False)
                    _confirmed_at = d.pop('confirmed_at', None)
                    d['confirmedAt'] = str(_confirmed_at) if _confirmed_at else None
                    d['respondentFirstName'] = d.pop('my_first_name', '')
                    d['respondentLastName'] = d.pop('my_last_name', '')
                    d['deliveryDate'] = str(d.pop('delivery_date', ''))
                    d['contractStartDate'] = str(d.pop('contract_start_date', ''))
                    d['contractEndDate'] = str(d.pop('contract_end_date', ''))
                    d['sellerId'] = d.pop('seller_id', None)
                    d['buyerId'] = d.pop('buyer_id', None)
                    d['deliveryAddress'] = d.pop('delivery_address', '')
                    d['deliveryMethod'] = d.pop('delivery_method', '')
                    d['logisticsPartnerId'] = d.pop('logistics_partner_id', None)
                    d['prepaymentPercent'] = d.pop('prepayment_percent', 0) or 0
                    d['prepaymentAmount'] = d.pop('prepayment_amount', 0) or 0
                    d['financingAvailable'] = d.pop('financing_available', False)
                    d['termsConditions'] = d.pop('terms_conditions', '')
                    d['minPurchaseQuantity'] = d.pop('min_purchase_quantity', 0) or 0
                    d['discountPercent'] = d.pop('discount_percent', 0) or 0
                    d['viewsCount'] = d.pop('views_count', 0)
                    d['createdAt'] = str(d.pop('created_at', ''))
                    d['updatedAt'] = str(d.pop('updated_at', ''))
                    d['productImages'] = d.pop('product_images', None)
                    d['productVideoUrl'] = d.pop('product_video_url', None)
                    d['buyerFirstName'] = d.pop('buyer_first_name', None)
                    d['buyerLastName'] = d.pop('buyer_last_name', None)
                    d.pop('cr_created_at', None)
                    contracts_list.append(d)
                return {'statusCode': 200, 'headers': RESP_HEADERS, 'body': json.dumps({'contracts': contracts_list, 'total': len(contracts_list)}), 'isBase64Encoded': False}
        finally:
            conn.close()

    # GET ?action=chatStatus&responseId=N — статус отклика для чата
    if params.get('action') == 'chatStatus':
        if not user_id:
            return {'statusCode': 401, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Требуется авторизация'}), 'isBase64Encoded': False}
        response_id_raw = params.get('responseId')
        if not response_id_raw:
            return {'statusCode': 400, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'responseId обязателен'}), 'isBase64Encoded': False}
        response_id = int(response_id_raw)
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute('''
                    SELECT cr.*, c.seller_id, u.first_name, u.last_name,
                           s.first_name as s_first, s.last_name as s_last,
                           c.title, c.product_name, c.total_amount, c.currency,
                           c.contract_type, c.quantity, c.unit, c.price_per_unit,
                           c.delivery_date, c.contract_start_date, c.contract_end_date,
                           c.delivery_address, c.terms_conditions
                    FROM contract_responses cr
                    JOIN contracts c ON cr.contract_id = c.id
                    JOIN users u ON cr.user_id = u.id
                    JOIN users s ON c.seller_id = s.id
                    WHERE cr.id = %s
                ''', (response_id,))
                row = cur.fetchone()
                if not row:
                    return {'statusCode': 404, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Отклик не найден'}), 'isBase64Encoded': False}
                d = decimal_to_float(dict(row))
                if d['seller_id'] != user_id and d['user_id'] != user_id:
                    return {'statusCode': 403, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Нет доступа'}), 'isBase64Encoded': False}
                result = {
                    'id': d['id'], 'contractId': d['contract_id'], 'status': d['status'],
                    'sellerConfirmed': d.get('seller_confirmed', False),
                    'buyerConfirmed': d.get('buyer_confirmed', False),
                    'confirmedAt': str(d['confirmed_at']) if d.get('confirmed_at') else None,
                    'pricePerUnit': d.get('price_per_unit', 0),
                    'totalAmount': d.get('total_amount', 0),
                    'comment': d.get('comment', ''),
                    'respondentFirstName': d.get('first_name', ''),
                    'respondentLastName': d.get('last_name', ''),
                    'sellerFirstName': d.get('s_first', ''),
                    'sellerLastName': d.get('s_last', ''),
                    'sellerId': d['seller_id'], 'respondentId': d['user_id'],
                    'contract': {
                        'title': d.get('title', ''), 'productName': d.get('product_name', ''),
                        'totalAmount': d.get('total_amount', 0), 'currency': d.get('currency', 'RUB'),
                        'contractType': d.get('contract_type', ''), 'quantity': d.get('quantity', 0),
                        'unit': d.get('unit', ''), 'pricePerUnit': d.get('price_per_unit', 0),
                        'deliveryDate': str(d.get('delivery_date', '')),
                        'contractStartDate': str(d.get('contract_start_date', '')),
                        'contractEndDate': str(d.get('contract_end_date', '')),
                        'deliveryAddress': d.get('delivery_address', ''),
                        'termsConditions': d.get('terms_conditions', ''),
                    }
                }
                return {'statusCode': 200, 'headers': RESP_HEADERS, 'body': json.dumps(result), 'isBase64Encoded': False}
        finally:
            conn.close()

    # GET ?action=chatMessages&responseId=N — сообщения чата
    if params.get('action') == 'chatMessages':
        if not user_id:
            return {'statusCode': 401, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Требуется авторизация'}), 'isBase64Encoded': False}
        response_id_raw = params.get('responseId')
        if not response_id_raw:
            return {'statusCode': 400, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'responseId обязателен'}), 'isBase64Encoded': False}
        response_id = int(response_id_raw)
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute('SELECT cr.user_id, c.seller_id FROM contract_responses cr JOIN contracts c ON cr.contract_id = c.id WHERE cr.id = %s', (response_id,))
                resp = cur.fetchone()
                if not resp:
                    return {'statusCode': 404, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Отклик не найден'}), 'isBase64Encoded': False}
                if resp['seller_id'] != user_id and resp['user_id'] != user_id:
                    return {'statusCode': 403, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Нет доступа'}), 'isBase64Encoded': False}
                cur.execute('''
                    SELECT cm.id, cm.sender_id, cm.text, cm.attachments, cm.created_at,
                           u.first_name, u.last_name
                    FROM contract_messages cm
                    JOIN users u ON cm.sender_id = u.id
                    WHERE cm.response_id = %s ORDER BY cm.created_at ASC
                ''', (response_id,))
                rows = cur.fetchall()
                messages = [{'id': str(r['id']), 'senderId': str(r['sender_id']),
                             'senderName': f"{r['first_name']} {r['last_name']}".strip(),
                             'text': r['text'] or '', 'attachments': r['attachments'] or [],
                             'timestamp': str(r['created_at'])} for r in rows]
                return {'statusCode': 200, 'headers': RESP_HEADERS, 'body': json.dumps({'messages': messages}), 'isBase64Encoded': False}
        finally:
            conn.close()

    # GET — список контрактов (существующая логика, не изменена)
    status = params.get('status')
    category = params.get('category')
    contract_type = params.get('type')
    limit = min(int(params.get('limit', '50')), 200)
    offset = int(params.get('offset', '0'))

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            conditions = []
            query_params = []

            explicit_user_filter = params.get('user_id') and user_id
            if explicit_user_filter:
                conditions.append("(c.seller_id = %s OR c.buyer_id = %s)")
                query_params.extend([user_id, user_id])

            if status:
                conditions.append("c.status = %s")
                query_params.append(status)

            if category:
                conditions.append("c.category = %s")
                query_params.append(category)

            if contract_type:
                conditions.append("c.contract_type = %s")
                query_params.append(contract_type)

            where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""

            query = f"""
                SELECT
                    c.*,
                    s.first_name   as seller_first_name,
                    s.last_name    as seller_last_name,
                    s.company_name as seller_company_name,
                    b.first_name   as buyer_first_name,
                    b.last_name    as buyer_last_name,
                    COALESCE(AVG(r.rating), 0) as seller_rating,
                    (
                        SELECT CASE
                            WHEN COUNT(*) FILTER (WHERE status IN ('completed','cancelled')) = 0 THEN NULL
                            ELSE ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'completed') / COUNT(*) FILTER (WHERE status IN ('completed','cancelled')))
                        END
                        FROM contracts sc WHERE sc.seller_id = c.seller_id
                    ) as reliability_score,
                    COUNT(DISTINCT cr.id) FILTER (WHERE cr.status NOT IN ('cancelled','rejected')) as responses_count,
                    (
                        SELECT json_agg(json_build_object(
                            'id', cr2.id,
                            'firstName', u2.first_name,
                            'lastName', u2.last_name,
                            'status', cr2.status,
                            'createdAt', cr2.created_at
                        ) ORDER BY cr2.created_at DESC)
                        FROM contract_responses cr2
                        JOIN users u2 ON cr2.user_id = u2.id
                        WHERE cr2.contract_id = c.id AND cr2.status NOT IN ('cancelled','rejected')
                    ) as recent_respondents
                FROM contracts c
                LEFT JOIN users s ON c.seller_id = s.id
                LEFT JOIN users b ON c.buyer_id  = b.id
                LEFT JOIN reviews r ON r.reviewed_user_id = c.seller_id
                LEFT JOIN contract_responses cr ON cr.contract_id = c.id
                {where_clause}
                GROUP BY c.id, s.first_name, s.last_name, s.company_name, b.first_name, b.last_name
                ORDER BY c.created_at DESC
                LIMIT %s OFFSET %s
            """
            query_params.extend([limit, offset])
            cur.execute(query, tuple(query_params))
            contracts = cur.fetchall()

            count_query = f"SELECT COUNT(*) as total FROM contracts c {where_clause}"
            cur.execute(count_query, tuple(query_params[:-2]))
            total = cur.fetchone()['total']

            contracts_list = []
            for contract in contracts:
                d = decimal_to_float(dict(contract))
                d['sellerFirstName']    = d.pop('seller_first_name')
                d['sellerLastName']     = d.pop('seller_last_name')
                d['sellerCompanyName']  = d.pop('seller_company_name', None)
                d['buyerFirstName']     = d.pop('buyer_first_name')
                d['buyerLastName']      = d.pop('buyer_last_name')
                d['sellerRating']       = d.pop('seller_rating')
                d['contractType']       = d.pop('contract_type')
                d['productName']        = d.pop('product_name')
                d['productSpecs']       = d.pop('product_specs')
                d['pricePerUnit']       = d.pop('price_per_unit')
                d['totalAmount']        = d.pop('total_amount')
                d['deliveryDate']       = str(d.pop('delivery_date'))
                d['contractStartDate']  = str(d.pop('contract_start_date'))
                d['contractEndDate']    = str(d.pop('contract_end_date'))
                d['sellerId']           = d.pop('seller_id')
                d['buyerId']            = d.pop('buyer_id')
                d['deliveryAddress']    = d.pop('delivery_address')
                d['deliveryMethod']     = d.pop('delivery_method')
                d['logisticsPartnerId'] = d.pop('logistics_partner_id')
                d['prepaymentPercent']  = d.pop('prepayment_percent') or 0
                d['prepaymentAmount']   = d.pop('prepayment_amount') or 0
                d['financingAvailable'] = d.pop('financing_available')
                d['termsConditions']    = d.pop('terms_conditions')
                d['minPurchaseQuantity']= d.pop('min_purchase_quantity') or 0
                d['discountPercent']    = d.pop('discount_percent') or 0
                d['viewsCount']         = d.pop('views_count')
                d['createdAt']          = str(d.pop('created_at'))
                d['updatedAt']          = str(d.pop('updated_at'))
                d['productImages']      = d.pop('product_images')
                d['productVideoUrl']    = d.pop('product_video_url')
                d['responsesCount']     = d.pop('responses_count', 0) or 0
                d['recentRespondents']  = d.pop('recent_respondents', None) or []
                d['reliabilityScore']   = d.pop('reliability_score', None)
                contracts_list.append(d)

            return {
                'statusCode': 200,
                'headers': RESP_HEADERS,
                'body': json.dumps({'contracts': contracts_list, 'total': total, 'limit': limit, 'offset': offset}),
                'isBase64Encoded': False
            }
    finally:
        conn.close()