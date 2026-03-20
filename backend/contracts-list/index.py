'''
Список контрактов пользователя или всех контрактов (с фильтрами).
Если передан user_id — возвращает контракты, где пользователь продавец или покупатель.
'''

import json
import os
from typing import Dict, Any
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL')


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
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    params = event.get('queryStringParameters', {}) or {}
    headers = event.get('headers', {}) or {}

    # user_id — из заголовка X-User-Id или query-параметра
    user_id_raw = headers.get('X-User-Id') or params.get('user_id')
    user_id = int(user_id_raw) if user_id_raw and str(user_id_raw).isdigit() else None

    status = params.get('status')  # None = все статусы
    category = params.get('category')
    contract_type = params.get('type')
    limit = min(int(params.get('limit', '50')), 200)
    offset = int(params.get('offset', '0'))

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            conditions = []
            query_params = []

            if user_id:
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
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'contracts': contracts_list, 'total': total, 'limit': limit, 'offset': offset}),
                'isBase64Encoded': False
            }
    finally:
        conn.close()