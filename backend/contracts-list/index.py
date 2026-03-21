'''
Список контрактов пользователя или всех контрактов (с фильтрами).
Если передан user_id — возвращает контракты, где пользователь продавец или покупатель.
POST / — создать отклик на контракт (v2)
GET /?responses=true&contractId={id} — список откликов на контракт (только для автора)
'''

import json
import os
from typing import Dict, Any
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor

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
    method: str = event.get('httpMethod', 'GET')
    
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

    if method not in ('GET', 'OPTIONS'):
        return {'statusCode': 405, 'headers': RESP_HEADERS, 'body': json.dumps({'error': 'Method not allowed'}), 'isBase64Encoded': False}

    params = event.get('queryStringParameters', {}) or {}

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
                    s.first_name as seller_first_name,
                    s.last_name  as seller_last_name,
                    b.first_name as buyer_first_name,
                    b.last_name  as buyer_last_name,
                    COALESCE(AVG(r.rating), 0) as seller_rating
                FROM contracts c
                LEFT JOIN users s ON c.seller_id = s.id
                LEFT JOIN users b ON c.buyer_id  = b.id
                LEFT JOIN reviews r ON r.reviewed_user_id = c.seller_id
                {where_clause}
                GROUP BY c.id, s.first_name, s.last_name, b.first_name, b.last_name
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
                contracts_list.append(d)

            return {
                'statusCode': 200,
                'headers': RESP_HEADERS,
                'body': json.dumps({'contracts': contracts_list, 'total': total, 'limit': limit, 'offset': offset}),
                'isBase64Encoded': False
            }
    finally:
        conn.close()