'''
API для управления заказами
GET / - получить список заказов пользователя
GET /?id=uuid - получить заказ по ID
POST / - создать новый заказ
PUT /?id=uuid - обновить статус заказа
'''

import json
import os
from typing import Dict, Any
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)

def generate_order_number():
    """Генерация уникального номера заказа"""
    from datetime import datetime
    import random
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_part = random.randint(1000, 9999)
    return f'ORD-{timestamp}-{random_part}'

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    try:
        if method == 'GET':
            query_params = event.get('queryStringParameters', {}) or {}
            order_id = query_params.get('id')
            
            if order_id:
                return get_order_by_id(order_id, headers)
            else:
                return get_user_orders(event, headers)
        
        elif method == 'POST':
            return create_order(event, headers)
        
        elif method == 'PUT':
            query_params = event.get('queryStringParameters', {}) or {}
            order_id = query_params.get('id')
            if not order_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Order ID required'}),
                    'isBase64Encoded': False
                }
            return update_order(order_id, event, headers)
        
        else:
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f'ERROR in orders handler: {str(e)}')
        print(f'Traceback: {error_trace}')
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }

def get_user_orders(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Получить список заказов пользователя"""
    user_headers = event.get('headers', {})
    user_id = user_headers.get('X-User-Id') or user_headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'User ID required'}),
            'isBase64Encoded': False
        }
    
    params = event.get('queryStringParameters', {}) or {}
    order_type = params.get('type', 'all')
    status = params.get('status', 'all')
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    sql = """
        SELECT 
            o.*,
            of.title as offer_title,
            of.district as offer_district,
            buyer.email as buyer_email,
            buyer.first_name || ' ' || buyer.last_name as buyer_full_name,
            seller.email as seller_email,
            seller.first_name || ' ' || seller.last_name as seller_full_name
        FROM orders o
        LEFT JOIN offers of ON o.offer_id = of.id
        LEFT JOIN users buyer ON o.buyer_id = buyer.id
        LEFT JOIN users seller ON o.seller_id = seller.id
        WHERE 1=1
    """
    
    query_params = []
    
    if order_type == 'purchase':
        sql += " AND o.buyer_id = %s"
        query_params.append(int(user_id))
    elif order_type == 'sale':
        sql += " AND o.seller_id = %s"
        query_params.append(int(user_id))
    else:
        sql += " AND (o.buyer_id = %s OR o.seller_id = %s)"
        query_params.extend([int(user_id), int(user_id)])
    
    if status != 'all':
        sql += " AND o.status = %s"
        query_params.append(status)
    
    sql += " ORDER BY o.order_date DESC"
    
    cur.execute(sql, query_params)
    orders = cur.fetchall()
    
    result = []
    for order in orders:
        order_dict = dict(order)
        order_dict['type'] = 'purchase' if order_dict['buyer_id'] == int(user_id) else 'sale'
        order_dict['counterparty'] = order_dict['seller_full_name'] if order_dict['type'] == 'purchase' else order_dict['buyer_full_name']
        order_dict['orderDate'] = order_dict.pop('order_date').isoformat() if order_dict.get('order_date') else None
        order_dict['deliveryDate'] = order_dict.pop('delivery_date').isoformat() if order_dict.get('delivery_date') else None
        order_dict['createdAt'] = order_dict.pop('created_at').isoformat() if order_dict.get('created_at') else None
        order_dict['updatedAt'] = order_dict.pop('updated_at').isoformat() if order_dict.get('updated_at') else None
        if order_dict.get('price_per_unit'):
            order_dict['price_per_unit'] = float(order_dict['price_per_unit'])
        if order_dict.get('total_amount'):
            order_dict['total_amount'] = float(order_dict['total_amount'])
        if order_dict.get('vat_amount'):
            order_dict['vat_amount'] = float(order_dict['vat_amount'])
        result.append(order_dict)
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'orders': result, 'total': len(result)}),
        'isBase64Encoded': False
    }

def get_order_by_id(order_id: str, headers: Dict[str, str]) -> Dict[str, Any]:
    """Получить заказ по ID"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    sql = """
        SELECT 
            o.*,
            of.title as offer_title,
            of.district as offer_district,
            of.description as offer_description,
            buyer.email as buyer_email_db,
            buyer.first_name || ' ' || buyer.last_name as buyer_full_name,
            seller.email as seller_email_db,
            seller.first_name || ' ' || seller.last_name as seller_full_name
        FROM orders o
        LEFT JOIN offers of ON o.offer_id = of.id
        LEFT JOIN users buyer ON o.buyer_id = buyer.id
        LEFT JOIN users seller ON o.seller_id = seller.id
        WHERE o.id = %s
    """
    
    cur.execute(sql, (order_id,))
    order = cur.fetchone()
    
    cur.close()
    conn.close()
    
    if not order:
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': 'Order not found'}),
            'isBase64Encoded': False
        }
    
    order_dict = dict(order)
    order_dict['orderDate'] = order_dict.pop('order_date').isoformat() if order_dict.get('order_date') else None
    order_dict['deliveryDate'] = order_dict.pop('delivery_date').isoformat() if order_dict.get('delivery_date') else None
    order_dict['createdAt'] = order_dict.pop('created_at').isoformat() if order_dict.get('created_at') else None
    order_dict['updatedAt'] = order_dict.pop('updated_at').isoformat() if order_dict.get('updated_at') else None
    if order_dict.get('price_per_unit'):
        order_dict['price_per_unit'] = float(order_dict['price_per_unit'])
    if order_dict.get('total_amount'):
        order_dict['total_amount'] = float(order_dict['total_amount'])
    if order_dict.get('vat_amount'):
        order_dict['vat_amount'] = float(order_dict['vat_amount'])
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(order_dict),
        'isBase64Encoded': False
    }

def create_order(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Создать новый заказ"""
    body = json.loads(event.get('body', '{}'))
    user_headers = event.get('headers', {})
    user_id = user_headers.get('X-User-Id') or user_headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'User ID required'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT user_id FROM offers WHERE id = %s", (body['offerId'],))
    offer = cur.fetchone()
    
    if not offer:
        cur.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': 'Offer not found'}),
            'isBase64Encoded': False
        }
    
    seller_id = offer['user_id']
    
    order_number = generate_order_number()
    
    vat_amount = None
    if body.get('hasVAT') and body.get('vatRate'):
        vat_amount = (body['pricePerUnit'] * body['quantity'] * body['vatRate']) / 100
    
    total_amount = body['pricePerUnit'] * body['quantity']
    if vat_amount:
        total_amount += vat_amount
    
    sql = """
        INSERT INTO orders (
            order_number, buyer_id, seller_id, offer_id,
            title, quantity, unit, price_per_unit, total_amount,
            has_vat, vat_amount,
            delivery_type, delivery_address, district,
            buyer_name, buyer_phone, buyer_email, buyer_company, buyer_inn, buyer_comment,
            status
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, order_number, order_date
    """
    
    cur.execute(sql, (
        order_number,
        int(user_id),
        seller_id,
        body['offerId'],
        body['title'],
        body['quantity'],
        body['unit'],
        body['pricePerUnit'],
        total_amount,
        body.get('hasVAT', False),
        vat_amount,
        body['deliveryType'],
        body.get('deliveryAddress', ''),
        body['district'],
        body['buyerName'],
        body['buyerPhone'],
        body.get('buyerEmail', ''),
        body.get('buyerCompany', ''),
        body.get('buyerInn', ''),
        body.get('buyerComment', ''),
        'new'
    ))
    
    result = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 201,
        'headers': headers,
        'body': json.dumps({
            'id': str(result['id']),
            'orderNumber': result['order_number'],
            'orderDate': result['order_date'].isoformat(),
            'message': 'Order created successfully'
        }),
        'isBase64Encoded': False
    }

def update_order(order_id: str, event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Обновить статус заказа"""
    body = json.loads(event.get('body', '{}'))
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    updates = []
    params = []
    
    if 'status' in body:
        updates.append('status = %s')
        params.append(body['status'])
    
    if 'trackingNumber' in body:
        updates.append('tracking_number = %s')
        params.append(body['trackingNumber'])
    
    if 'deliveryDate' in body:
        updates.append('delivery_date = %s')
        params.append(body['deliveryDate'])
    
    if 'sellerComment' in body:
        updates.append('seller_comment = %s')
        params.append(body['sellerComment'])
    
    if 'cancellationReason' in body:
        updates.append('cancellation_reason = %s')
        params.append(body['cancellationReason'])
    
    if not updates:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'No fields to update'}),
            'isBase64Encoded': False
        }
    
    sql = f"UPDATE orders SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = %s"
    params.append(order_id)
    
    cur.execute(sql, params)
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'message': 'Order updated successfully'}),
        'isBase64Encoded': False
    }
