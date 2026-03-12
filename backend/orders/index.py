'''
Управление заказами пользователей с JWT защитой
GET / - получить список заказов пользователя
GET /?id=uuid - получить заказ по ID
GET /?offerId=uuid&messages=true - получить сообщения по предложению
POST / - создать новый заказ
POST /?message=true - отправить сообщение по заказу
PUT /?id=uuid - обновить статус заказа
Использует DB_SCHEMA для доступа к схеме БД.
'''

import json
from datetime import datetime, date
from decimal import Decimal
from typing import Dict, Any
from rate_limiter import rate_limiter

from orders_utils import get_schema, get_db_connection, SafeJSONEncoder, decimal_to_float
from psycopg2.extras import RealDictCursor


def _serialize_order(order_dict: dict, user_id_int: int) -> dict:
    """Безопасно сериализует один заказ — конвертирует все datetime/Decimal"""
    def _iso(val):
        return val.isoformat() if val and hasattr(val, 'isoformat') else None

    order_dict['offerPricePerUnit'] = float(order_dict.pop('offer_price_per_unit')) if order_dict.get('offer_price_per_unit') is not None else None
    order_dict['offerAvailableQuantity'] = int(order_dict.pop('offer_available_quantity', 0) or 0)
    order_dict['offerCategory'] = order_dict.pop('_offer_category_merged', None) or order_dict.pop('offer_category', None)
    order_dict['offerTransportRoute'] = order_dict.pop('offer_transport_route', None)
    order_dict['offerTransportServiceType'] = order_dict.pop('_offer_transport_service_type_merged', None) or order_dict.pop('offer_transport_service_type', None)
    dt = order_dict.pop('_offer_transport_date_time_merged', None) or order_dict.pop('offer_transport_date_time', None)
    order_dict['offerTransportDateTime'] = _iso(dt)
    order_dict['offerTransportNegotiable'] = order_dict.pop('offer_transport_negotiable', None)
    order_dict['unreadMessages'] = int(order_dict.pop('unread_messages', 0) or 0)
    order_dict['passengerPickupAddress'] = order_dict.pop('passenger_pickup_address', None)
    order_dict['buyerRating'] = float(order_dict.pop('buyer_rating')) if order_dict.get('buyer_rating') is not None else None
    order_dict['sellerRating'] = float(order_dict.pop('seller_rating')) if order_dict.get('seller_rating') is not None else None
    order_dict['sellerAvgReviewRating'] = round(float(order_dict.pop('seller_avg_review_rating')), 1) if order_dict.get('seller_avg_review_rating') is not None else None
    order_dict['buyerAvgReviewRating'] = round(float(order_dict.pop('buyer_avg_review_rating')), 1) if order_dict.get('buyer_avg_review_rating') is not None else None
    order_dict['is_request'] = order_dict.get('is_request', False)
    order_dict['type'] = 'purchase' if order_dict.get('buyer_id') == user_id_int else 'sale'
    order_dict['offer_title'] = order_dict.get('title', '')
    order_dict['seller_full_name'] = order_dict.get('seller_name', 'Продавец')
    order_dict['buyer_full_name'] = order_dict.get('buyer_name', 'Покупатель')
    order_dict['orderDate'] = _iso(order_dict.pop('order_date', None))
    order_dict['deliveryDate'] = _iso(order_dict.pop('delivery_date', None))
    order_dict['completedDate'] = _iso(order_dict.pop('completed_date', None))
    order_dict['createdAt'] = _iso(order_dict.pop('created_at', None))
    order_dict['updatedAt'] = _iso(order_dict.pop('updated_at', None))
    order_dict['counterOfferedAt'] = _iso(order_dict.pop('counter_offered_at', None))
    order_dict['cancelledDate'] = _iso(order_dict.pop('cancelled_date', None))
    order_dict['archivedAt'] = _iso(order_dict.pop('archived_at', None))
    order_dict['adminArchivedAt'] = _iso(order_dict.pop('admin_archived_at', None))
    if 'counter_offer_message' in order_dict:
        order_dict['counterOfferMessage'] = order_dict.pop('counter_offer_message')
    order_dict = decimal_to_float(order_dict)
    for key, val in list(order_dict.items()):
        if hasattr(val, 'hex'):
            order_dict[key] = str(val)
    return order_dict


def _safe_get_user_orders(event: dict, headers: dict) -> dict:
    """Получить список заказов с гарантированной сериализацией datetime"""
    user_headers = event.get('headers', {})
    user_id = user_headers.get('X-User-Id') or user_headers.get('x-user-id')
    if not user_id:
        return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'User ID required'}, cls=SafeJSONEncoder), 'isBase64Encoded': False}
    user_id_int = int(user_id)
    params = event.get('queryStringParameters', {}) or {}
    order_type = params.get('type', 'all')
    status = params.get('status', 'all')
    limit = int(params.get('limit', '50'))
    offset = int(params.get('offset', '0'))
    schema = get_schema()
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    count_sql = f"SELECT COUNT(*) as total FROM {schema}.orders WHERE 1=1"
    if order_type == 'purchase':
        count_sql += f" AND buyer_id = {user_id_int}"
    elif order_type == 'sale':
        count_sql += f" AND seller_id = {user_id_int}"
    else:
        count_sql += f" AND (buyer_id = {user_id_int} OR seller_id = {user_id_int})"
    if status != 'all':
        count_sql += f" AND status = '{status.replace(chr(39), chr(39)*2)}'"
    cur.execute(count_sql)
    total_count = cur.fetchone()['total']
    sql = f"""
        SELECT o.*,
            of.price_per_unit as offer_price_per_unit,
            COALESCE(of.quantity - of.sold_quantity - of.reserved_quantity, 0) as offer_available_quantity,
            COALESCE(of.category, o.offer_category) as _offer_category_merged,
            of.transport_route as offer_transport_route,
            COALESCE(of.transport_service_type, o.offer_transport_service_type) as _offer_transport_service_type_merged,
            COALESCE(of.transport_date_time::timestamp, o.offer_transport_date_time) as _offer_transport_date_time_merged,
            of.transport_negotiable as offer_transport_negotiable,
            CASE WHEN r.id IS NOT NULL THEN true ELSE false END as is_request,
            COALESCE((SELECT COUNT(*) FROM {schema}.order_messages om WHERE om.order_id = o.id AND om.is_read = false AND om.sender_id != {user_id_int}), 0) as unread_messages,
            ub.rating as buyer_rating, us.rating as seller_rating,
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
        sql += f" AND o.status = '{status.replace(chr(39), chr(39)*2)}'"
    sql += f" ORDER BY order_date DESC LIMIT {limit} OFFSET {offset}"
    cur.execute(sql)
    orders = cur.fetchall()
    cur.close()
    conn.close()
    result = [_serialize_order(dict(o), user_id_int) for o in orders]
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'orders': result, 'total': total_count, 'limit': limit, 'offset': offset, 'hasMore': offset + len(result) < total_count}, cls=SafeJSONEncoder),
        'isBase64Encoded': False
    }


def _safe_get_order_by_id(order_id: str, headers: dict, event: dict) -> dict:
    """Получить заказ по ID с гарантированной сериализацией datetime"""
    try:
        resp = get_order_by_id(order_id, headers, event)
        if resp.get('statusCode') == 200:
            parsed = json.loads(resp['body'])
            parsed = decimal_to_float(parsed)
            resp['body'] = json.dumps(parsed, cls=SafeJSONEncoder)
        return resp
    except Exception as e:
        print(f'[SAFE_GET_ORDER] Error: {e}')
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': str(e)}, cls=SafeJSONEncoder), 'isBase64Encoded': False}

from orders_crud import (
    check_existing_response,
    get_user_orders,
    get_order_by_id,
    create_order,
    update_order,
)
from orders_messages import (
    get_messages_by_offer,
    get_messages_by_order,
    create_message,
    delete_message,
)
from orders_admin import (
    cancel_trip_handler,
    cleanup_orphaned_orders,
    admin_archive_order,
    delete_order,
    cleanup_all_orders,
)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Главный обработчик заказов — маршрутизирует запросы по методам и параметрам
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
        print(f"[ORDERS] Method: {method}, Query: {event.get('queryStringParameters')}, Body: {event.get('body', '')[:200]}")
        
        source_ip = (event.get('requestContext', {}) or {}).get('identity', {}).get('sourceIp', 'unknown')
        user_id_header = (event.get('headers', {}) or {}).get('X-User-Id', '')
        rate_key = f"orders:{user_id_header or source_ip}"

        if method == 'GET':
            query_params = event.get('queryStringParameters', {}) or {}
            order_id = query_params.get('id') or query_params.get('orderId')
            order_number_param = query_params.get('orderNumber')
            offer_id = query_params.get('offerId')
            messages_flag = query_params.get('messages')
            
            # Поиск по номеру заказа
            if order_number_param and not order_id:
                schema = get_schema()
                try:
                    conn_tmp = get_db_connection()
                    cur_tmp = conn_tmp.cursor()
                    from psycopg2 import sql as pgsql
                    cur_tmp.execute(
                        pgsql.SQL("SELECT id FROM {schema}.orders WHERE order_number = %s LIMIT 1").format(schema=pgsql.Identifier(schema)),
                        (order_number_param,)
                    )
                    row = cur_tmp.fetchone()
                    cur_tmp.close()
                    conn_tmp.close()
                    if row:
                        order_id = str(row['id'])
                    else:
                        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Order not found', 'orders': []}), 'isBase64Encoded': False}
                except Exception as e:
                    print(f"[ORDER_NUMBER_SEARCH] Error: {e}")
                    return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': str(e)}), 'isBase64Encoded': False}
            
            print(f"[GET] order_id={order_id}, offer_id={offer_id}, messages={messages_flag}")
            
            check_response = query_params.get('checkResponse')

            if messages_flag == 'true':
                allowed, remaining = rate_limiter.check_rate_limit(rate_key, max_requests=40, window_seconds=60)
                if not allowed:
                    retry_after = rate_limiter.get_retry_after(rate_key, window_seconds=60)
                    return {
                        'statusCode': 429,
                        'headers': {**headers, 'Retry-After': str(retry_after), 'X-RateLimit-Limit': '40', 'X-RateLimit-Remaining': '0'},
                        'body': json.dumps({'error': 'Too many requests', 'retry_after': retry_after}),
                        'isBase64Encoded': False
                    }
            
            if check_response == 'true' and offer_id:
                return check_existing_response(event, offer_id, headers)
            elif messages_flag == 'true' and offer_id:
                return get_messages_by_offer(offer_id, headers)
            elif messages_flag == 'true' and order_id:
                return get_messages_by_order(order_id, headers, event)
            elif order_id:
                return _safe_get_order_by_id(order_id, headers, event)
            else:
                return _safe_get_user_orders(event, headers)
        
        elif method == 'POST':
            query_params = event.get('queryStringParameters', {}) or {}
            is_message = query_params.get('message') == 'true'
            
            print(f"[POST] is_message={is_message}, query={query_params}")

            if is_message:
                allowed, remaining = rate_limiter.check_rate_limit(rate_key, max_requests=40, window_seconds=60)
                if not allowed:
                    retry_after = rate_limiter.get_retry_after(rate_key, window_seconds=60)
                    return {
                        'statusCode': 429,
                        'headers': {**headers, 'Retry-After': str(retry_after), 'X-RateLimit-Limit': '40', 'X-RateLimit-Remaining': '0'},
                        'body': json.dumps({'error': 'Too many requests', 'retry_after': retry_after}),
                        'isBase64Encoded': False
                    }
                return create_message(event, headers)
            else:
                return create_order(event, headers)
        
        elif method == 'PUT':
            query_params = event.get('queryStringParameters', {}) or {}
            order_id = query_params.get('id')
            cancel_trip = query_params.get('cancelTrip') == 'true'
            offer_id_param = query_params.get('offerId')
            if cancel_trip and offer_id_param:
                return cancel_trip_handler(offer_id_param, event, headers)
            if not order_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Order ID required'}),
                    'isBase64Encoded': False
                }
            return update_order(order_id, event, headers)
        
        elif method == 'DELETE':
            query_params = event.get('queryStringParameters', {}) or {}
            cleanup_orphaned = query_params.get('cleanupOrphaned') == 'true'
            cleanup_all = query_params.get('cleanupAll') == 'true'
            admin_archive = query_params.get('adminArchive') == 'true'
            order_id = query_params.get('id')
            message_id = query_params.get('messageId')
            
            if cleanup_all:
                return cleanup_all_orders(event, headers)
            elif cleanup_orphaned:
                return cleanup_orphaned_orders(event, headers)
            elif admin_archive and order_id:
                return admin_archive_order(order_id, event, headers)
            elif message_id:
                return delete_message(message_id, event, headers)
            elif order_id:
                return delete_order(order_id, event, headers)
            else:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Operation not specified'}),
                    'isBase64Encoded': False
                }
        
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
            'body': json.dumps({'error': str(e), 'trace': error_trace}),
            'isBase64Encoded': False
        }