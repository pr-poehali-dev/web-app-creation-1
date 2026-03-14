"""CRUD операции с заказами: создание, получение, обновление, проверка отклика"""
import json
import uuid
from decimal import Decimal
from datetime import datetime, date
from typing import Dict, Any
from psycopg2.extras import RealDictCursor
from orders_utils import (
    get_db_connection, get_schema, send_notification,
    generate_order_number, reject_other_responses,
    decimal_to_float, offers_cache
)


class SafeJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, uuid.UUID):
            return str(obj)
        if isinstance(obj, Decimal):
            return float(obj)
        if hasattr(obj, 'hex'):
            return str(obj)
        return super().default(obj)


def check_existing_response(event: Dict[str, Any], offer_id: str, headers: Dict[str, str]) -> Dict[str, Any]:
    """Проверить, есть ли у пользователя отклик на запрос"""
    user_headers = event.get('headers', {})
    user_id = user_headers.get('X-User-Id') or user_headers.get('x-user-id')
    if not user_id:
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'exists': False}),
            'isBase64Encoded': False
        }
    conn = get_db_connection()
    cur = conn.cursor()
    schema = get_schema()
    from psycopg2 import sql as pgsql
    cur.execute(
        pgsql.SQL("SELECT id, price_per_unit, quantity, buyer_comment, status, attachments FROM {schema}.orders WHERE offer_id = %s AND buyer_id = %s AND status NOT IN ('cancelled') LIMIT 1").format(schema=pgsql.Identifier(schema)),
        (offer_id, int(user_id))
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    if row:
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'exists': True,
                'orderId': str(row['id']),
                'pricePerUnit': float(row['price_per_unit']),
                'quantity': row['quantity'],
                'buyerComment': row.get('buyer_comment', ''),
                'status': row['status'],
                'attachments': row.get('attachments') or []
            }),
            'isBase64Encoded': False
        }
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'exists': False}),
        'isBase64Encoded': False
    }


def get_user_orders(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Получить список заказов пользователя"""
    user_headers = event.get('headers', {})
    user_id = user_headers.get('X-User-Id') or user_headers.get('x-user-id')
    
    print(f"[GET_USER_ORDERS] user_id={user_id}, headers={user_headers}")
    
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
    limit = int(params.get('limit', '50'))
    offset = int(params.get('offset', '0'))
    
    print(f"[GET_USER_ORDERS] type={order_type}, status={status}, limit={limit}, offset={offset}")
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    user_id_int = int(user_id)
    
    schema = get_schema()
    
    count_sql = f"SELECT COUNT(*) as total FROM {schema}.orders WHERE 1=1"
    
    if order_type == 'purchase':
        count_sql += f" AND buyer_id = {user_id_int}"
    elif order_type == 'sale':
        count_sql += f" AND seller_id = {user_id_int}"
    else:
        count_sql += f" AND (buyer_id = {user_id_int} OR seller_id = {user_id_int})"
    
    if status != 'all':
        status_escaped = status.replace("'", "''")
        count_sql += f" AND status = '{status_escaped}'"
    
    cur.execute(count_sql)
    total_count = cur.fetchone()['total']
    
    sql = f"""
        SELECT 
            o.*,
            of.price_per_unit as offer_price_per_unit,
            COALESCE(of.quantity - of.sold_quantity - of.reserved_quantity, 0) as offer_available_quantity,
            COALESCE(of.category, o.offer_category) as _offer_category_merged,
            of.transport_route as offer_transport_route,
            COALESCE(of.transport_service_type, o.offer_transport_service_type) as _offer_transport_service_type_merged,
            of.transport_date_time as _of_transport_date_time,
            o.offer_transport_date_time as _o_transport_date_time,
            of.transport_negotiable as offer_transport_negotiable,
            CASE WHEN r.id IS NOT NULL THEN true ELSE false END as is_request,
            COALESCE((
                SELECT COUNT(*) FROM {schema}.order_messages om 
                WHERE om.order_id = o.id AND om.is_read = false 
                AND om.sender_id != {user_id_int}
            ), 0) as unread_messages,
            ub.rating as buyer_rating,
            us.rating as seller_rating,
            (SELECT AVG(rv.rating) FROM {schema}.reviews rv WHERE rv.reviewed_user_id = o.seller_id) as seller_avg_review_rating,
            (SELECT AVG(rv.rating) FROM {schema}.reviews rv WHERE rv.reviewed_user_id = o.buyer_id) as buyer_avg_review_rating
        FROM {schema}.orders o
        LEFT JOIN {schema}.offers of ON o.offer_id = of.id
        LEFT JOIN {schema}.requests r ON o.offer_id = r.id
        LEFT JOIN {schema}.users ub ON o.buyer_id = ub.id
        LEFT JOIN {schema}.users us ON o.seller_id = us.id
        WHERE 1=1
    """
    
    if order_type == 'purchase':
        sql += f" AND o.buyer_id = {user_id_int}"
    elif order_type == 'sale':
        sql += f" AND o.seller_id = {user_id_int}"
    else:
        sql += f" AND (o.buyer_id = {user_id_int} OR o.seller_id = {user_id_int})"
    
    if status != 'all':
        status_escaped = status.replace("'", "''")
        sql += f" AND o.status = '{status_escaped}'"
    
    sql += f" ORDER BY order_date DESC LIMIT {limit} OFFSET {offset}"
    
    print(f"[GET_USER_ORDERS] SQL: {sql}")
    
    cur.execute(sql)
    orders = cur.fetchall()
    
    print(f"[GET_USER_ORDERS] Found {len(orders)} orders")
    
    result = []
    for order in orders:
        order_dict = dict(order)
        
        order_dict['offerPricePerUnit'] = float(order_dict.pop('offer_price_per_unit')) if order_dict.get('offer_price_per_unit') is not None else None
        order_dict['offerAvailableQuantity'] = int(order_dict.pop('offer_available_quantity')) if order_dict.get('offer_available_quantity') is not None else 0
        order_dict['offerCategory'] = order_dict.pop('_offer_category_merged', None) or order_dict.pop('offer_category', None)
        order_dict['offerTransportRoute'] = order_dict.pop('offer_transport_route', None)
        order_dict['offerTransportServiceType'] = order_dict.pop('_offer_transport_service_type_merged', None) or order_dict.pop('offer_transport_service_type', None)
        dt = order_dict.pop('_of_transport_date_time', None) or order_dict.pop('_o_transport_date_time', None) or order_dict.pop('offer_transport_date_time', None)
        order_dict['offerTransportDateTime'] = dt.isoformat() if dt and hasattr(dt, 'isoformat') else (str(dt) if dt else None)
        order_dict['offerTransportNegotiable'] = order_dict.pop('offer_transport_negotiable', None)
        order_dict['unreadMessages'] = int(order_dict.pop('unread_messages', 0) or 0)
        order_dict['passengerPickupAddress'] = order_dict.pop('passenger_pickup_address', None)
        order_dict['buyerRating'] = float(order_dict.pop('buyer_rating')) if order_dict.get('buyer_rating') is not None else None
        order_dict['sellerRating'] = float(order_dict.pop('seller_rating')) if order_dict.get('seller_rating') is not None else None
        order_dict['sellerAvgReviewRating'] = round(float(order_dict.pop('seller_avg_review_rating')), 1) if order_dict.get('seller_avg_review_rating') is not None else None
        order_dict['buyerAvgReviewRating'] = round(float(order_dict.pop('buyer_avg_review_rating')), 1) if order_dict.get('buyer_avg_review_rating') is not None else None
        
        order_dict['is_request'] = order_dict.get('is_request', False)
        
        order_dict['type'] = 'purchase' if order_dict['buyer_id'] == user_id_int else 'sale'
        
        order_dict['offer_title'] = order_dict.get('title', '')
        order_dict['seller_full_name'] = order_dict.get('seller_name', 'Продавец')
        order_dict['buyer_full_name'] = order_dict.get('buyer_name', 'Покупатель')
        
        order_dict['orderDate'] = order_dict.pop('order_date').isoformat() if order_dict.get('order_date') else None
        order_dict['deliveryDate'] = order_dict.pop('delivery_date').isoformat() if order_dict.get('delivery_date') else None
        order_dict['completedDate'] = order_dict.pop('completed_date').isoformat() if order_dict.get('completed_date') else None
        order_dict['createdAt'] = order_dict.pop('created_at').isoformat() if order_dict.get('created_at') else None
        order_dict['updatedAt'] = order_dict.pop('updated_at').isoformat() if order_dict.get('updated_at') else None
        order_dict['counterOfferedAt'] = order_dict.pop('counter_offered_at').isoformat() if order_dict.get('counter_offered_at') else None
        
        if 'counter_offer_message' in order_dict:
            order_dict['counterOfferMessage'] = order_dict.pop('counter_offer_message')
        
        order_dict = decimal_to_float(order_dict)
        
        for key, val in list(order_dict.items()):
            if isinstance(val, uuid.UUID) or hasattr(val, 'hex'):
                order_dict[key] = str(val)
            elif isinstance(val, (datetime, date)):
                order_dict[key] = val.isoformat()
        
        result.append(order_dict)
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'orders': result,
            'total': total_count,
            'limit': limit,
            'offset': offset,
            'hasMore': offset + len(result) < total_count
        }, cls=SafeJSONEncoder),
        'isBase64Encoded': False
    }


def get_order_by_id(order_id: str, headers: Dict[str, str], event: Dict[str, Any] = None) -> Dict[str, Any]:
    """Получить заказ по ID"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    order_id_escaped = order_id.replace("'", "''")
    schema = get_schema()
    
    sql = f"""
        SELECT 
            o.*,
            of.price_per_unit as offer_price_per_unit,
            COALESCE(of.quantity - of.sold_quantity - of.reserved_quantity, 0) as offer_available_quantity,
            COALESCE(of.category, o.offer_category) as _offer_category_merged,
            of.transport_route as offer_transport_route,
            COALESCE(of.transport_service_type, o.offer_transport_service_type) as _offer_transport_service_type_merged,
            of.transport_date_time as _of_transport_date_time,
            o.offer_transport_date_time as _o_transport_date_time,
            of.transport_negotiable as offer_transport_negotiable,
            CASE WHEN r.id IS NOT NULL THEN true ELSE false END as is_request,
            ub.rating as buyer_rating,
            us.rating as seller_rating,
            (SELECT AVG(rv.rating) FROM {schema}.reviews rv WHERE rv.reviewed_user_id = o.seller_id) as seller_avg_review_rating,
            (SELECT AVG(rv.rating) FROM {schema}.reviews rv WHERE rv.reviewed_user_id = o.buyer_id) as buyer_avg_review_rating
        FROM {schema}.orders o
        LEFT JOIN {schema}.offers of ON o.offer_id = of.id
        LEFT JOIN {schema}.requests r ON o.offer_id = r.id
        LEFT JOIN {schema}.users ub ON o.buyer_id = ub.id
        LEFT JOIN {schema}.users us ON o.seller_id = us.id
        WHERE o.id = '{order_id_escaped}'
    """
    
    cur.execute(sql)
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
    
    order_dict['offerPricePerUnit'] = float(order_dict.pop('offer_price_per_unit')) if order_dict.get('offer_price_per_unit') is not None else None
    order_dict['offerAvailableQuantity'] = int(order_dict.pop('offer_available_quantity')) if order_dict.get('offer_available_quantity') is not None else 0
    order_dict['offerCategory'] = order_dict.pop('_offer_category_merged', None) or order_dict.pop('offer_category', None)
    order_dict['offerTransportRoute'] = order_dict.pop('offer_transport_route', None)
    order_dict['offerTransportServiceType'] = order_dict.pop('_offer_transport_service_type_merged', None) or order_dict.pop('offer_transport_service_type', None)
    dt2 = order_dict.pop('_of_transport_date_time', None) or order_dict.pop('_o_transport_date_time', None) or order_dict.pop('offer_transport_date_time', None)
    order_dict['offerTransportDateTime'] = dt2.isoformat() if dt2 and hasattr(dt2, 'isoformat') else (str(dt2) if dt2 else None)
    order_dict['offerTransportNegotiable'] = order_dict.pop('offer_transport_negotiable', None)
    order_dict['passengerPickupAddress'] = order_dict.pop('passenger_pickup_address', None)
    order_dict['is_request'] = order_dict.get('is_request', False)
    order_dict['completionRequested'] = order_dict.pop('completion_requested', False) or False
    order_dict['buyerRating'] = float(order_dict.pop('buyer_rating')) if order_dict.get('buyer_rating') is not None else None
    order_dict['sellerRating'] = float(order_dict.pop('seller_rating')) if order_dict.get('seller_rating') is not None else None
    order_dict['sellerAvgReviewRating'] = round(float(order_dict.pop('seller_avg_review_rating')), 1) if order_dict.get('seller_avg_review_rating') is not None else None
    order_dict['buyerAvgReviewRating'] = round(float(order_dict.pop('buyer_avg_review_rating')), 1) if order_dict.get('buyer_avg_review_rating') is not None else None
    
    order_dict['offer_title'] = order_dict.get('title', '')
    order_dict['buyer_full_name'] = order_dict.get('buyer_name', 'Покупатель')
    order_dict['seller_full_name'] = order_dict.get('seller_name', 'Продавец')
    
    user_id = None
    if event:
        user_headers = event.get('headers', {})
        user_id_str = user_headers.get('X-User-Id') or user_headers.get('x-user-id')
        if user_id_str:
            user_id = int(user_id_str)
    if user_id:
        order_dict['type'] = 'purchase' if order_dict['buyer_id'] == user_id else 'sale'
    
    order_dict['orderDate'] = order_dict.pop('order_date').isoformat() if order_dict.get('order_date') else None
    order_dict['deliveryDate'] = order_dict.pop('delivery_date').isoformat() if order_dict.get('delivery_date') else None
    order_dict['completedDate'] = order_dict.pop('completed_date').isoformat() if order_dict.get('completed_date') else None
    order_dict['createdAt'] = order_dict.pop('created_at').isoformat() if order_dict.get('created_at') else None
    order_dict['updatedAt'] = order_dict.pop('updated_at').isoformat() if order_dict.get('updated_at') else None
    order_dict['counterOfferedAt'] = order_dict.pop('counter_offered_at').isoformat() if order_dict.get('counter_offered_at') else None
    
    if 'counter_offer_message' in order_dict:
        order_dict['counterOfferMessage'] = order_dict.pop('counter_offer_message')
    
    order_dict = decimal_to_float(order_dict)
    
    for key, val in list(order_dict.items()):
        if isinstance(val, uuid.UUID) or hasattr(val, 'hex'):
            order_dict[key] = str(val)
        elif isinstance(val, (datetime, date)):
            order_dict[key] = val.isoformat()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(order_dict, cls=SafeJSONEncoder),
        'isBase64Encoded': False
    }


def create_order(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Создать новый заказ"""
    body = json.loads(event.get('body', '{}'))
    user_headers = event.get('headers', {})
    user_id = user_headers.get('X-User-Id') or user_headers.get('x-user-id')
    
    print(f"[CREATE_ORDER] user_id={user_id}, body={body}")
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'User ID required'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    schema = get_schema()
    offer_id_escaped = body['offerId'].replace("'", "''")
    
    cur.execute(f"SELECT user_id FROM {schema}.requests WHERE id = '{offer_id_escaped}'")
    request = cur.fetchone()
    
    if request:
        seller_id = request['user_id']
        offer_category = None
        offer_transport_service_type = None
        offer_transport_date_time = None
        is_request = True
    else:
        cur.execute(f"SELECT user_id, category, transport_service_type, transport_date_time FROM {schema}.offers WHERE id = '{offer_id_escaped}'")
        offer = cur.fetchone()
        
        if not offer:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'Offer or request not found'}),
                'isBase64Encoded': False
            }
        
        seller_id = offer['user_id']
        offer_category = offer.get('category')
        offer_transport_service_type = offer.get('transport_service_type')
        offer_transport_date_time = offer.get('transport_date_time')
        is_request = False
    
    if int(user_id) == seller_id:
        cur.close()
        conn.close()
        return {
            'statusCode': 403,
            'headers': headers,
            'body': json.dumps({'error': 'Нельзя купить собственное предложение'}),
            'isBase64Encoded': False
        }
    
    if is_request:
        cur.execute(
            f"SELECT id FROM {schema}.orders WHERE offer_id = '{offer_id_escaped}' AND buyer_id = {int(user_id)} AND status NOT IN ('cancelled')"
        )
        existing_response = cur.fetchone()
        if existing_response:
            cur.close()
            conn.close()
            return {
                'statusCode': 409,
                'headers': headers,
                'body': json.dumps({'error': 'Вы уже отправили отклик на этот запрос', 'existingOrderId': str(existing_response['id'])}),
                'isBase64Encoded': False
            }
    
    cur.execute(f"SELECT first_name, last_name, phone, email FROM {schema}.users WHERE id = {seller_id}")
    seller = cur.fetchone()
    
    if seller:
        seller_name = f"{seller.get('first_name', '')} {seller.get('last_name', '')}".strip()
        seller_phone = seller.get('phone', '')
        seller_email = seller.get('email', '')
    else:
        seller_name = 'Продавец'
        seller_phone = ''
        seller_email = ''
    
    order_number = generate_order_number()
    
    quantity = body.get('quantity')
    if quantity is None or quantity == 0:
        quantity = 1
    
    vat_amount = None
    if body.get('hasVAT') and body.get('vatRate'):
        vat_amount = (body['pricePerUnit'] * quantity * body['vatRate']) / 100
    
    total_amount = body['pricePerUnit'] * quantity
    if vat_amount:
        total_amount += vat_amount
    
    title_escaped = body['title'].replace("'", "''")
    unit_escaped = body['unit'].replace("'", "''")
    delivery_type_escaped = body['deliveryType'].replace("'", "''")
    delivery_address_escaped = body.get('deliveryAddress', '').replace("'", "''")
    district_escaped = body['district'].replace("'", "''")
    buyer_name_escaped = body['buyerName'].replace("'", "''")
    buyer_phone_escaped = body['buyerPhone'].replace("'", "''")
    buyer_email_escaped = body.get('buyerEmail', '').replace("'", "''")
    buyer_company_escaped = body.get('buyerCompany', '').replace("'", "''")
    buyer_inn_escaped = body.get('buyerInn', '').replace("'", "''")
    buyer_comment_escaped = body.get('buyerComment', '').replace("'", "''")
    passenger_pickup_address = body.get('passengerPickupAddress', '') or ''
    passenger_pickup_escaped = passenger_pickup_address.replace("'", "''")
    
    seller_name_escaped = seller_name.replace("'", "''")
    seller_phone_escaped = seller_phone.replace("'", "''")
    seller_email_escaped = seller_email.replace("'", "''")
    
    counter_price = body.get('counterPrice')
    initial_status = 'new'
    counter_price_sql = 'NULL'
    counter_total_sql = 'NULL'
    counter_message_sql = 'NULL'
    counter_offered_at_sql = 'NULL'
    counter_offered_by_sql = 'NULL'
    
    if counter_price is not None and float(counter_price) > 0:
        initial_status = 'negotiating'
        counter_price_float = float(counter_price)
        counter_total = counter_price_float * body['quantity']
        counter_price_sql = str(counter_price_float)
        counter_total_sql = str(counter_total)
        counter_message = body.get('counterMessage', '').replace("'", "''")
        counter_message_sql = f"'{counter_message}'" if counter_message else 'NULL'
        counter_offered_at_sql = 'CURRENT_TIMESTAMP'
        counter_offered_by_sql = "'buyer'"
    
    attachments_json = json.dumps(body.get('attachments', []))
    attachments_escaped = attachments_json.replace("'", "''")

    offer_category_sql = f"'{offer_category.replace(chr(39), chr(39)*2)}'" if offer_category else 'NULL'
    offer_transport_service_type_sql = f"'{offer_transport_service_type.replace(chr(39), chr(39)*2)}'" if offer_transport_service_type else 'NULL'
    offer_transport_date_time_sql = f"'{offer_transport_date_time.isoformat() if hasattr(offer_transport_date_time, 'isoformat') else offer_transport_date_time}'" if offer_transport_date_time else 'NULL'

    sql = f"""
        INSERT INTO {schema}.orders (
            order_number, buyer_id, seller_id, offer_id,
            title, quantity, original_quantity, unit, price_per_unit, total_amount,
            has_vat, vat_amount,
            delivery_type, delivery_address, district,
            buyer_name, buyer_phone, buyer_email, buyer_company, buyer_inn, buyer_comment,
            seller_name, seller_phone, seller_email,
            status,
            counter_price_per_unit, counter_total_amount, counter_offer_message, counter_offered_at, counter_offered_by,
            attachments, passenger_pickup_address,
            offer_category, offer_transport_service_type, offer_transport_date_time
        ) VALUES (
            '{order_number}', {int(user_id)}, {seller_id}, '{offer_id_escaped}',
            '{title_escaped}', {quantity}, {quantity}, '{unit_escaped}', {body['pricePerUnit']}, {total_amount},
            {body.get('hasVAT', False)}, {vat_amount if vat_amount else 'NULL'},
            '{delivery_type_escaped}', '{delivery_address_escaped}', '{district_escaped}',
            '{buyer_name_escaped}', '{buyer_phone_escaped}', '{buyer_email_escaped}', '{buyer_company_escaped}', '{buyer_inn_escaped}', '{buyer_comment_escaped}',
            '{seller_name_escaped}', '{seller_phone_escaped}', '{seller_email_escaped}',
            '{initial_status}',
            {counter_price_sql}, {counter_total_sql}, {counter_message_sql}, {counter_offered_at_sql}, {counter_offered_by_sql},
            '{attachments_escaped}'::jsonb, {f"'{passenger_pickup_escaped}'" if passenger_pickup_escaped else 'NULL'},
            {offer_category_sql}, {offer_transport_service_type_sql}, {offer_transport_date_time_sql}
        )
        RETURNING id, order_number, order_date
    """
    
    cur.execute(sql)
    result = cur.fetchone()
    
    if not is_request:
        update_offer_sql = f"""
            UPDATE {schema}.offers 
            SET reserved_quantity = COALESCE(reserved_quantity, 0) + {quantity}
            WHERE id = '{offer_id_escaped}'
        """
        cur.execute(update_offer_sql)
        offers_cache.clear()
    
    conn.commit()
    cur.close()
    conn.close()
    
    try:
        if initial_status == 'negotiating':
            notification_title = 'Новое встречное предложение по заказу'
            notification_message = f'Покупатель предложил {counter_price} ₽ за единицу товара "{body["title"]}"'
        else:
            notification_title = 'Новый заказ на ваше предложение'
            pickup = body.get('passengerPickupAddress', '')
            pickup_info = f' | Посадка: {pickup}' if pickup else ''
            notification_message = f'Получен заказ на "{body["title"]}" на сумму {total_amount:,.0f} ₽{pickup_info}'
        
        send_notification(seller_id, notification_title, notification_message, f'/my-orders?id={result["id"]}')
    except Exception as e:
        print(f'Notification error: {e}')
    
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
    '''Обновить статус заказа, встречное предложение или принять заказ'''
    body = json.loads(event.get('body', '{}'))
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    schema = get_schema()
    from psycopg2 import sql as pgsql
    
    cur.execute(
        pgsql.SQL("SELECT * FROM {schema}.orders WHERE id = %s").format(schema=pgsql.Identifier(schema)),
        (order_id,)
    )
    order = cur.fetchone()
    
    if not order:
        cur.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': 'Order not found'}),
            'isBase64Encoded': False
        }
    
    updates = []
    
    user_headers = event.get('headers', {})
    user_id = int(user_headers.get('X-User-Id') or user_headers.get('x-user-id') or 0)
    is_buyer = user_id == order['buyer_id']
    is_seller = user_id == order['seller_id']
    
    # Редактирование отклика покупателем (до принятия продавцом)
    if body.get('editResponse') and is_buyer and order['status'] in ('new', 'pending', 'negotiating'):
        qty_diff = 0
        if 'pricePerUnit' in body:
            new_price = float(body['pricePerUnit'])
            new_qty = int(body.get('quantity', order['quantity']))
            old_qty = int(order['quantity'])
            qty_diff = new_qty - old_qty
            new_total = new_price * new_qty
            updates.append(f"price_per_unit = {new_price}")
            updates.append(f"quantity = {new_qty}")
            updates.append(f"total_amount = {new_total}")
            if order.get('counter_offered_by') == 'buyer':
                updates.append(f"counter_price_per_unit = {new_price}")
                updates.append(f"counter_total_amount = {new_total}")
        if 'buyerComment' in body:
            comment_escaped = body['buyerComment'].replace("'", "''")
            updates.append(f"buyer_comment = '{comment_escaped}'")
        if 'deliveryDays' in body:
            delivery_escaped = str(body['deliveryDays']).replace("'", "''")
            old_comment = order.get('buyer_comment', '') or ''
            import re
            cleaned = re.sub(r'Срок поставки: \d+ дней\.?\s*', '', old_comment).strip()
            new_comment = f"Срок поставки: {delivery_escaped} дней. {cleaned}".strip()
            new_comment_escaped = new_comment.replace("'", "''")
            updates.append(f"buyer_comment = '{new_comment_escaped}'")
        if 'attachments' in body:
            att_json = json.dumps(body['attachments']).replace("'", "''")
            updates.append(f"attachments = '{att_json}'::jsonb")
        if updates:
            cur.execute(
                pgsql.SQL("UPDATE {schema}.orders SET " + ', '.join(updates) + " WHERE id = %s").format(
                    schema=pgsql.Identifier(schema)
                ),
                (order_id,)
            )
            if qty_diff != 0 and order.get('offer_id') and not order.get('is_request'):
                cur.execute(
                    pgsql.SQL("UPDATE {schema}.offers SET reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) + %s) WHERE id = %s").format(schema=pgsql.Identifier(schema)),
                    (qty_diff, str(order['offer_id']))
                )
            conn.commit()
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'Response updated successfully'}),
                'isBase64Encoded': False
            }
    
    # Предложение цены от покупателя
    if 'counterPrice' in body and is_buyer:
        counter_price = float(body['counterPrice'])
        quantity = int(body.get('counterQuantity', order['quantity']))
        counter_total = counter_price * quantity
        counter_message = body.get('counterMessage', '').replace("'", "''")
        
        updates.append(f"counter_price_per_unit = {counter_price}")
        updates.append(f"counter_total_amount = {counter_total}")
        updates.append(f"quantity = {quantity}")
        updates.append(f"counter_offer_message = '{counter_message}'")
        updates.append(f"counter_offered_at = CURRENT_TIMESTAMP")
        updates.append(f"counter_offered_by = 'buyer'")
        updates.append(f"buyer_accepted_counter = FALSE")
        updates.append(f"status = 'negotiating'")
    
    # Встречное предложение от продавца
    if 'counterPrice' in body and is_seller:
        counter_price = float(body['counterPrice'])
        quantity = int(body.get('counterQuantity', order['quantity']))
        counter_total = counter_price * quantity
        counter_message = body.get('counterMessage', '').replace("'", "''")
        
        updates.append(f"counter_price_per_unit = {counter_price}")
        updates.append(f"counter_total_amount = {counter_total}")
        updates.append(f"quantity = {quantity}")
        updates.append(f"counter_offer_message = '{counter_message}'")
        updates.append(f"counter_offered_at = CURRENT_TIMESTAMP")
        updates.append(f"counter_offered_by = 'seller'")
        updates.append(f"buyer_accepted_counter = FALSE")
        updates.append(f"status = 'negotiating'")
    
    # Продавец принимает предложение покупателя
    counter_accepted = False
    if 'acceptCounter' in body and body['acceptCounter'] and is_seller:
        if order.get('counter_price_per_unit') is None or order.get('counter_total_amount') is None:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'No counter offer to accept'}),
                'isBase64Encoded': False
            }
        
        updates.append(f"buyer_accepted_counter = TRUE")
        updates.append(f"price_per_unit = {float(order['counter_price_per_unit'])}")
        updates.append(f"total_amount = {float(order['counter_total_amount'])}")
        updates.append(f"status = 'accepted'")
        counter_accepted = True
        
        order_quantity = order['quantity']
        cur.execute(
            pgsql.SQL("""
                UPDATE {schema}.offers 
                SET sold_quantity = COALESCE(sold_quantity, 0) + %s,
                    reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - %s)
                WHERE id = %s
            """).format(schema=pgsql.Identifier(schema)),
            (order_quantity, order_quantity, str(order['offer_id']))
        )
        offers_cache.clear()
    
    # Покупатель принимает встречное предложение продавца
    if 'acceptCounter' in body and body['acceptCounter'] and is_buyer:
        if order.get('counter_price_per_unit') is None or order.get('counter_total_amount') is None:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'No counter offer to accept'}),
                'isBase64Encoded': False
            }
        
        if order.get('counter_offered_by') != 'seller':
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'No seller counter offer to accept'}),
                'isBase64Encoded': False
            }
        
        updates.append(f"buyer_accepted_counter = TRUE")
        updates.append(f"price_per_unit = {float(order['counter_price_per_unit'])}")
        updates.append(f"total_amount = {float(order['counter_total_amount'])}")
        updates.append(f"status = 'accepted'")
        counter_accepted = True
        
        order_quantity = order['quantity']
        cur.execute(
            pgsql.SQL("""
                UPDATE {schema}.offers 
                SET sold_quantity = COALESCE(sold_quantity, 0) + %s,
                    reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - %s)
                WHERE id = %s
            """).format(schema=pgsql.Identifier(schema)),
            (order_quantity, order_quantity, str(order['offer_id']))
        )
        offers_cache.clear()
    
    # Продавец принимает заказ (по исходной цене)
    if 'status' in body and body['status'] == 'accepted' and not counter_accepted:
        cur.execute(
            pgsql.SQL("SELECT quantity, sold_quantity, reserved_quantity FROM {schema}.offers WHERE id = %s").format(schema=pgsql.Identifier(schema)),
            (str(order['offer_id']),)
        )
        offer = cur.fetchone()
        
        if offer:
            available = offer['quantity'] - (offer.get('sold_quantity', 0) or 0) - (offer.get('reserved_quantity', 0) or 0)
            order_quantity = order['quantity']
            
            if available < order_quantity:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({
                        'error': 'Insufficient quantity',
                        'available': available,
                        'requested': order_quantity
                    }),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                pgsql.SQL("""
                    UPDATE {schema}.offers 
                    SET sold_quantity = COALESCE(sold_quantity, 0) + %s,
                        reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - %s)
                    WHERE id = %s
                """).format(schema=pgsql.Identifier(schema)),
                (order_quantity, order_quantity, str(order['offer_id']))
            )
            offers_cache.clear()
        
        updates.append(f"status = 'accepted'")
    
    # Запрос на завершение от исполнителя
    if body.get('completionRequested') is True and is_seller:
        updates.append(f"completion_requested = TRUE")
        try:
            send_notification(
                order['buyer_id'],
                'Запрос на завершение заказа',
                f'Исполнитель запрашивает подтверждение завершения заказа №{order.get("order_number", order_id[:8])}',
                f'/my-orders?id={order_id}'
            )
        except Exception as e:
            print(f'Notification error: {e}')

    # Завершить заказ может только покупатель
    if 'status' in body and body['status'] == 'completed':
        if not is_buyer:
            cur.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': headers,
                'body': json.dumps({'error': 'Только покупатель может завершить заказ'}),
                'isBase64Encoded': False
            }
        # Пассажирские перевозки: нельзя завершить до даты выезда
        from datetime import datetime
        order_category = order.get('offer_category')
        order_service_type = order.get('offer_transport_service_type') or ''
        order_transport_dt = order.get('offer_transport_date_time')
        is_passenger = order_category == 'transport' and 'пассажир' in order_service_type.lower()
        if is_passenger and order_transport_dt:
            if hasattr(order_transport_dt, 'replace'):
                departure_dt = order_transport_dt.replace(tzinfo=None)
            else:
                departure_dt = datetime.fromisoformat(str(order_transport_dt))
            if datetime.now() < departure_dt:
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': headers,
                    'body': json.dumps({'error': f'Завершить заказ можно только после даты выезда: {departure_dt.strftime("%d.%m.%Y %H:%M")}'}),
                    'isBase64Encoded': False
                }
        updates.append(f"completed_date = CURRENT_TIMESTAMP")
        updates.append(f"completion_requested = FALSE")
        updates.append(f"status = 'completed'")
        
        seller_id_complete = order['seller_id']
        cur.execute(
            pgsql.SQL("UPDATE {schema}.users SET rating = LEAST(100, COALESCE(rating, 100) * 1.05) WHERE id = %s").format(schema=pgsql.Identifier(schema)),
            (seller_id_complete,)
        )
        print(f"[COMPLETE_ORDER] Seller {seller_id_complete} rating increased by 5%")
        
        offer_id_for_complete = str(order['offer_id'])
        cur.execute(
            pgsql.SQL("""
                UPDATE {schema}.offers
                SET status = 'completed', updated_at = NOW()
                WHERE id = %s
                  AND quantity > 0
                  AND sold_quantity >= quantity
                  AND status = 'active'
            """).format(schema=pgsql.Identifier(schema)),
            (offer_id_for_complete,)
        )
        rows_updated = cur.rowcount
        if rows_updated > 0:
            offers_cache.clear()
            print(f"[COMPLETE_ORDER] Offer {offer_id_for_complete} auto-completed (sold_quantity >= quantity)")
    
    # Отмена заказа
    elif 'status' in body and body['status'] == 'cancelled':
        status_escaped = body['status'].replace("'", "''")
        updates.append(f"status = '{status_escaped}'")
        
        cancelled_by = 'seller' if is_seller else 'buyer'
        updates.append(f"cancelled_by = '{cancelled_by}'")
        
        order_quantity = order['quantity']
        current_status = order.get('status', '')
        if current_status == 'accepted':
            cur.execute(
                pgsql.SQL("UPDATE {schema}.offers SET sold_quantity = GREATEST(0, COALESCE(sold_quantity, 0) - %s) WHERE id = %s").format(schema=pgsql.Identifier(schema)),
                (order_quantity, str(order['offer_id']))
            )
        else:
            cur.execute(
                pgsql.SQL("UPDATE {schema}.offers SET reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - %s) WHERE id = %s").format(schema=pgsql.Identifier(schema)),
                (order_quantity, str(order['offer_id']))
            )
        
        offers_cache.clear()
        print(f"[CANCEL_ORDER] Returned {order_quantity} units to offer {order['offer_id']} (from {current_status})")
        
        cancelled_by_str = 'seller' if is_seller else 'buyer'

        if order.get('status') == 'accepted':
            if is_buyer:
                buyer_id_cancel = order['buyer_id']
                cur.execute(
                    pgsql.SQL("UPDATE {schema}.users SET rating = GREATEST(0, COALESCE(rating, 100) * 0.95) WHERE id = %s").format(schema=pgsql.Identifier(schema)),
                    (buyer_id_cancel,)
                )
                print(f"[CANCEL_ORDER] Buyer {buyer_id_cancel} rating decreased 5% (cancelled accepted order)")
            else:
                seller_id_cancel = order['seller_id']
                cur.execute(
                    pgsql.SQL("UPDATE {schema}.users SET rating = GREATEST(0, COALESCE(rating, 100) * 0.95) WHERE id = %s").format(schema=pgsql.Identifier(schema)),
                    (seller_id_cancel,)
                )
                print(f"[CANCEL_ORDER] Seller {seller_id_cancel} rating decreased 5% (cancelled accepted order)")
        else:
            print(f"[CANCEL_ORDER] Order cancelled by {cancelled_by_str} before acceptance — no rating penalty")
    
    # Отклонение заказа
    elif 'status' in body and body['status'] == 'rejected':
        updates.append(f"status = 'rejected'")
        
        order_quantity = order['quantity']
        cur.execute(
            pgsql.SQL("UPDATE {schema}.offers SET reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - %s) WHERE id = %s").format(schema=pgsql.Identifier(schema)),
            (order_quantity, str(order['offer_id']))
        )
        print(f"[REJECT_ORDER] Returned {order_quantity} units to offer {order['offer_id']}")
    
    # Обычное обновление статуса
    elif 'status' in body and body['status'] != 'accepted':
        allowed_statuses = {'new', 'pending', 'negotiating', 'cancelled', 'completed', 'rejected', 'accepted'}
        new_status = body['status'] if body['status'] in allowed_statuses else None
        if new_status:
            updates.append(f"status = '{new_status}'")
    
    if 'trackingNumber' in body:
        tracking_escaped = body['trackingNumber'].replace("'", "''")
        updates.append(f"tracking_number = '{tracking_escaped}'")
    
    if 'deliveryDate' in body:
        date_escaped = body['deliveryDate'].replace("'", "''")
        updates.append(f"delivery_date = '{date_escaped}'")
    
    if 'sellerComment' in body:
        comment_escaped = body['sellerComment'].replace("'", "''")
        updates.append(f"seller_comment = '{comment_escaped}'")
    
    if 'cancellationReason' in body:
        reason_escaped = body['cancellationReason'].replace("'", "''")
        updates.append(f"cancellation_reason = '{reason_escaped}'")
    
    if not updates:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'No fields to update'}),
            'isBase64Encoded': False
        }
    
    cur.execute(
        pgsql.SQL("UPDATE {schema}.orders SET {fields}, updated_at = CURRENT_TIMESTAMP WHERE id = %s").format(
            schema=pgsql.Identifier(schema),
            fields=pgsql.SQL(', '.join(updates))
        ),
        (order_id,)
    )
    
    accepted_now = counter_accepted or (body.get('status') == 'accepted')
    if accepted_now:
        try:
            cur.execute(
                pgsql.SQL("SELECT id FROM {schema}.requests WHERE id = %s").format(schema=pgsql.Identifier(schema)),
                (str(order['offer_id']),)
            )
            is_request = cur.fetchone() is not None
            if is_request:
                reject_other_responses(
                    cur, schema,
                    str(order['offer_id']),
                    order_id,
                    order.get('title', 'предложение'),
                    is_request=True
                )
        except Exception as e:
            print(f"[AUTO_REJECT] Error: {e}")
    
    conn.commit()
    
    try:
        new_status = body.get('status')
        
        if 'counterPrice' in body and is_buyer:
            send_notification(
                order['seller_id'],
                'Встречное предложение по заказу',
                f'Покупатель предложил {body["counterPrice"]} ₽ за единицу товара',
                f'/my-orders?id={order_id}'
            )
        
        elif 'counterPrice' in body and is_seller:
            send_notification(
                order['buyer_id'],
                'Встречное предложение от продавца',
                f'Продавец предложил {body["counterPrice"]} ₽ за единицу товара',
                f'/my-orders?id={order_id}'
            )
        
        elif counter_accepted:
            if is_seller:
                send_notification(
                    order['buyer_id'],
                    'Встречное предложение принято',
                    f'Продавец согласился на вашу цену. Заказ принят!',
                    f'/my-orders?id={order_id}'
                )
            elif is_buyer:
                send_notification(
                    order['seller_id'],
                    'Встречное предложение принято',
                    f'Покупатель согласился на вашу цену. Заказ принят!',
                    f'/my-orders?id={order_id}'
                )
        
        elif new_status == 'accepted':
            if is_seller:
                send_notification(
                    order['buyer_id'],
                    'Заказ принят',
                    f'Ваш заказ №{order.get("order_number", order_id[:8])} принят в работу',
                    f'/my-orders?id={order_id}'
                )
            elif is_buyer:
                send_notification(
                    order['seller_id'],
                    'Ваш отклик принят',
                    f'Заказчик принял ваш отклик по заказу №{order.get("order_number", order_id[:8])}',
                    f'/my-orders?id={order_id}'
                )
        
        elif new_status == 'rejected':
            send_notification(
                order['buyer_id'],
                'Заказ отклонен',
                f'К сожалению, ваш заказ №{order.get("order_number", order_id[:8])} был отклонен',
                f'/my-orders?id={order_id}'
            )
        
        elif new_status == 'cancelled':
            notify_user = order['buyer_id'] if is_seller else order['seller_id']
            who_cancelled = 'Продавец' if is_seller else 'Покупатель'
            send_notification(
                notify_user,
                'Заказ отменён',
                f'{who_cancelled} отменил заказ №{order.get("order_number", order_id[:8])}',
                f'/my-orders?id={order_id}'
            )
        
        elif new_status == 'completed':
            send_notification(
                order['seller_id'],
                'Заказ завершён',
                f'Покупатель подтвердил получение заказа №{order.get("order_number", order_id[:8])}',
                f'/my-orders?id={order_id}'
            )
    except Exception as e:
        print(f'Notification error: {e}')
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'message': 'Order updated successfully'}),
        'isBase64Encoded': False
    }