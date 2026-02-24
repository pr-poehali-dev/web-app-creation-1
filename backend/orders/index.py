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
import os
import sys
from typing import Dict, Any
from datetime import datetime
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor
import http.client
import base64
import uuid
import mimetypes
import boto3
import time
from rate_limiter import rate_limiter

# Импортируем offers_cache для инвалидации кэша
# Кэш находится в backend/offers/cache.py
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'offers'))
try:
    from cache import offers_cache
except ImportError:
    # Если импорт не удался, создаём заглушку
    class DummyCache:
        def clear(self): pass
    offers_cache = DummyCache()


def decimal_to_float(obj):
    """Рекурсивно конвертирует Decimal в float"""
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_to_float(item) for item in obj]
    return obj

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)

def get_schema():
    return os.environ.get('DB_SCHEMA', 'public')

def generate_order_number():
    """Генерация уникального номера заказа"""
    from datetime import datetime
    import random
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_part = random.randint(1000, 9999)
    return f'ORD-{timestamp}-{random_part}'

def send_notification(user_id: int, title: str, message: str, url: str = '/my-orders'):
    """Отправка push и email уведомлений"""
    notification_data = json.dumps({
        'userId': user_id,
        'title': title,
        'message': message,
        'url': url
    })
    headers = {'Content-Type': 'application/json'}

    # Web Push-уведомление
    try:
        conn = http.client.HTTPSConnection('functions.poehali.dev', timeout=3)
        conn.request('POST', '/a1c8fafd-b64f-45e5-b9b9-0a050cca4f7a',  # push-send
                    notification_data, headers)
        response = conn.getresponse()
        response.read()
        conn.close()
        print(f'[NOTIFICATION] Push sent to user {user_id}: {title}')
    except Exception as e:
        print(f'[NOTIFICATION] Push error: {e}')

    # Email-уведомление
    try:
        conn = http.client.HTTPSConnection('functions.poehali.dev', timeout=2)
        conn.request('POST', '/3c4b3e64-cb71-4b82-abd5-e67393be3d43',  # email-notify
                    notification_data, headers)
        response = conn.getresponse()
        response.read()
        conn.close()
        print(f'[NOTIFICATION] Email sent to user {user_id}: {title}')
    except Exception as e:
        print(f'[NOTIFICATION] Email error: {e}')

def reject_other_responses(cur, schema: str, offer_id: str, accepted_order_id: str, title: str, is_request: bool = True):
    """Отклоняет все остальные отклики на тот же запрос/предложение при принятии одного"""
    offer_id_escaped = offer_id.replace("'", "''")
    accepted_id_escaped = accepted_order_id.replace("'", "''")
    
    cur.execute(f"""
        SELECT id, buyer_id, order_number 
        FROM {schema}.orders 
        WHERE offer_id = '{offer_id_escaped}' 
          AND id != '{accepted_id_escaped}'
          AND status IN ('new', 'pending', 'negotiating')
    """)
    other_orders = cur.fetchall()
    
    if not other_orders:
        print(f"[AUTO_REJECT] No other responses to reject for offer {offer_id}")
        return
    
    entity_type = 'запрос' if is_request else 'предложение'
    reason_text = 'Автоматически отклонён — выбран другой исполнитель'
    reason_escaped = reason_text.replace("'", "''")
    
    other_ids = [f"'{str(o['id'])}'" for o in other_orders]
    cur.execute(f"""
        UPDATE {schema}.orders 
        SET status = 'rejected', 
            cancellation_reason = '{reason_escaped}',
            updated_at = CURRENT_TIMESTAMP
        WHERE id IN ({','.join(other_ids)})
    """)
    
    print(f"[AUTO_REJECT] Rejected {len(other_orders)} other responses for {entity_type} {offer_id}")
    
    notify_text = f'К сожалению, по {entity_type}у «{title}» выбран другой исполнитель'
    for o in other_orders:
        try:
            send_notification(
                o['buyer_id'],
                'Ваш отклик отклонён',
                notify_text,
                f'/my-orders?tab=my-responses'
            )
        except Exception as e:
            print(f"[AUTO_REJECT] Notification error for user {o['buyer_id']}: {e}")

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
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
            offer_id = query_params.get('offerId')
            messages_flag = query_params.get('messages')
            
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
                return get_order_by_id(order_id, headers, event)
            else:
                return get_user_orders(event, headers)
        
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
            order_id = query_params.get('id')
            message_id = query_params.get('messageId')
            
            if cleanup_all:
                return cleanup_all_orders(event, headers)
            elif cleanup_orphaned:
                return cleanup_orphaned_orders(event, headers)
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
    offer_id_escaped = offer_id.replace("'", "''")
    cur.execute(
        f"SELECT id, price_per_unit, quantity, buyer_comment, status, attachments FROM {schema}.orders WHERE offer_id = '{offer_id_escaped}' AND buyer_id = {int(user_id)} AND status NOT IN ('cancelled') LIMIT 1"
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
    
    # Подсчет общего количества заказов
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
            of.category as offer_category,
            of.transport_route as offer_transport_route,
            CASE WHEN r.id IS NOT NULL THEN true ELSE false END as is_request,
            COALESCE((
                SELECT COUNT(*) FROM {schema}.order_messages om 
                WHERE om.order_id = o.id AND om.is_read = false 
                AND om.sender_id != {user_id_int}
            ), 0) as unread_messages
        FROM {schema}.orders o
        LEFT JOIN {schema}.offers of ON o.offer_id = of.id
        LEFT JOIN {schema}.requests r ON o.offer_id = r.id
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
        
        # Добавляем поля из offers
        order_dict['offerPricePerUnit'] = float(order_dict.pop('offer_price_per_unit')) if order_dict.get('offer_price_per_unit') is not None else None
        order_dict['offerAvailableQuantity'] = int(order_dict.pop('offer_available_quantity')) if order_dict.get('offer_available_quantity') is not None else 0
        order_dict['offerCategory'] = order_dict.pop('offer_category', None)
        order_dict['offerTransportRoute'] = order_dict.pop('offer_transport_route', None)
        order_dict['unreadMessages'] = int(order_dict.pop('unread_messages', 0) or 0)
        
        order_dict['is_request'] = order_dict.get('is_request', False)
        
        # Определяем тип заказа (покупка или продажа)
        order_dict['type'] = 'purchase' if order_dict['buyer_id'] == user_id_int else 'sale'
        
        # Используем данные продавца/покупателя из самого заказа (buyer_name, seller_name и т.д.)
        order_dict['offer_title'] = order_dict.get('title', '')
        order_dict['seller_full_name'] = order_dict.get('seller_name', 'Продавец')
        order_dict['buyer_full_name'] = order_dict.get('buyer_name', 'Покупатель')
        
        # Преобразуем даты
        order_dict['orderDate'] = order_dict.pop('order_date').isoformat() if order_dict.get('order_date') else None
        order_dict['deliveryDate'] = order_dict.pop('delivery_date').isoformat() if order_dict.get('delivery_date') else None
        order_dict['completedDate'] = order_dict.pop('completed_date').isoformat() if order_dict.get('completed_date') else None
        order_dict['createdAt'] = order_dict.pop('created_at').isoformat() if order_dict.get('created_at') else None
        order_dict['updatedAt'] = order_dict.pop('updated_at').isoformat() if order_dict.get('updated_at') else None
        order_dict['counterOfferedAt'] = order_dict.pop('counter_offered_at').isoformat() if order_dict.get('counter_offered_at') else None
        
        # Преобразуем поля встречного предложения в camelCase
        if 'counter_offer_message' in order_dict:
            order_dict['counterOfferMessage'] = order_dict.pop('counter_offer_message')
        
        order_dict = decimal_to_float(order_dict)
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
        }),
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
            CASE WHEN r.id IS NOT NULL THEN true ELSE false END as is_request
        FROM {schema}.orders o
        LEFT JOIN {schema}.offers of ON o.offer_id = of.id
        LEFT JOIN {schema}.requests r ON o.offer_id = r.id
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
    order_dict['is_request'] = order_dict.get('is_request', False)
    
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
    
    # Сначала ищем в requests (запросы) - приоритет
    cur.execute(f"SELECT user_id FROM {schema}.requests WHERE id = '{offer_id_escaped}'")
    request = cur.fetchone()
    
    if request:
        seller_id = request['user_id']
        is_request = True
    else:
        # Если не нашли в requests, ищем в offers (предложения)
        cur.execute(f"SELECT user_id FROM {schema}.offers WHERE id = '{offer_id_escaped}'")
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
        is_request = False
    
    # ПРОВЕРКА 1: Автор предложения не может купить у самого себя
    if int(user_id) == seller_id:
        cur.close()
        conn.close()
        return {
            'statusCode': 403,
            'headers': headers,
            'body': json.dumps({'error': 'Нельзя купить собственное предложение'}),
            'isBase64Encoded': False
        }
    
    # ПРОВЕРКА 2: Нельзя отправить повторный отклик на тот же запрос
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
    
    # Получаем данные продавца
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
    
    # Для запросов (услуг) quantity может быть null - используем 1
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
    
    seller_name_escaped = seller_name.replace("'", "''")
    seller_phone_escaped = seller_phone.replace("'", "''")
    seller_email_escaped = seller_email.replace("'", "''")
    
    # Проверяем наличие встречной цены от покупателя
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
            attachments
        ) VALUES (
            '{order_number}', {int(user_id)}, {seller_id}, '{offer_id_escaped}',
            '{title_escaped}', {quantity}, {quantity}, '{unit_escaped}', {body['pricePerUnit']}, {total_amount},
            {body.get('hasVAT', False)}, {vat_amount if vat_amount else 'NULL'},
            '{delivery_type_escaped}', '{delivery_address_escaped}', '{district_escaped}',
            '{buyer_name_escaped}', '{buyer_phone_escaped}', '{buyer_email_escaped}', '{buyer_company_escaped}', '{buyer_inn_escaped}', '{buyer_comment_escaped}',
            '{seller_name_escaped}', '{seller_phone_escaped}', '{seller_email_escaped}',
            '{initial_status}',
            {counter_price_sql}, {counter_total_sql}, {counter_message_sql}, {counter_offered_at_sql}, {counter_offered_by_sql},
            '{attachments_escaped}'::jsonb
        )
        RETURNING id, order_number, order_date
    """
    
    cur.execute(sql)
    result = cur.fetchone()
    
    # Обновляем reserved_quantity только для offers (не для requests)
    if not is_request:
        update_offer_sql = f"""
            UPDATE {schema}.offers 
            SET reserved_quantity = COALESCE(reserved_quantity, 0) + {quantity}
            WHERE id = '{offer_id_escaped}'
        """
        cur.execute(update_offer_sql)
        
        # Инвалидируем кэш offers
        offers_cache.clear()
    
    conn.commit()
    cur.close()
    conn.close()
    
    # Отправляем уведомление продавцу о новом заказе
    try:
        if initial_status == 'negotiating':
            notification_title = 'Новое встречное предложение по заказу'
            notification_message = f'Покупатель предложил {counter_price} ₽ за единицу товара "{body["title"]}"'
        else:
            notification_title = 'Новый заказ на ваше предложение'
            notification_message = f'Получен заказ на "{body["title"]}" на сумму {total_amount:,.0f} ₽'
        
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
    cur = conn.cursor()
    schema = get_schema()
    order_id_escaped = order_id.replace("'", "''")
    
    # Получаем текущий заказ
    cur.execute(f"SELECT * FROM {schema}.orders WHERE id = '{order_id_escaped}'")
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
    if body.get('editResponse') and is_buyer and order['status'] in ('new', 'negotiating'):
        if 'pricePerUnit' in body:
            new_price = float(body['pricePerUnit'])
            new_qty = int(body.get('quantity', order['quantity']))
            new_total = new_price * new_qty
            updates.append(f"price_per_unit = {new_price}")
            updates.append(f"quantity = {new_qty}")
            updates.append(f"total_amount = {new_total}")
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
            updates.append("updated_at = CURRENT_TIMESTAMP")
            sql = f"UPDATE {schema}.orders SET {', '.join(updates)} WHERE id = '{order_id_escaped}'"
            cur.execute(sql)
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
    
    # Встречное предложение от продавца (после предложения покупателя)
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
        
        # Переносим количество из reserved в sold
        offer_id_escaped = str(order['offer_id']).replace("'", "''")
        order_quantity = order['quantity']
        cur.execute(f"""
            UPDATE {schema}.offers 
            SET 
                sold_quantity = COALESCE(sold_quantity, 0) + {order_quantity},
                reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - {order_quantity})
            WHERE id = '{offer_id_escaped}'
        """)
        
        # Инвалидируем кэш offers
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
        
        # Проверяем что встречное предложение было от продавца
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
        
        # Переносим количество из reserved в sold
        offer_id_escaped = str(order['offer_id']).replace("'", "''")
        order_quantity = order['quantity']
        cur.execute(f"""
            UPDATE {schema}.offers 
            SET 
                sold_quantity = COALESCE(sold_quantity, 0) + {order_quantity},
                reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - {order_quantity})
            WHERE id = '{offer_id_escaped}'
        """)
        
        # Инвалидируем кэш offers
        offers_cache.clear()
    
    # Продавец принимает заказ (по исходной цене или после принятия встречной покупателем)
    if 'status' in body and body['status'] == 'accepted' and not counter_accepted:
        # Проверяем доступное количество в предложении
        offer_id_escaped = str(order['offer_id']).replace("'", "''")
        cur.execute(f"""
            SELECT quantity, sold_quantity, reserved_quantity 
            FROM {schema}.offers 
            WHERE id = '{offer_id_escaped}'
        """)
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
            
            # Переносим количество из reserved в sold
            cur.execute(f"""
                UPDATE {schema}.offers 
                SET 
                    sold_quantity = COALESCE(sold_quantity, 0) + {order_quantity},
                    reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - {order_quantity})
                WHERE id = '{offer_id_escaped}'
            """)
            
            # Инвалидируем кэш offers
            offers_cache.clear()
        
        updates.append(f"status = 'accepted'")
    
    # ПРОВЕРКА 2: Завершить заказ может только покупатель
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
        updates.append(f"completed_date = CURRENT_TIMESTAMP")
        updates.append(f"status = 'completed'")
    
    # Отмена заказа - записываем кто отменил
    elif 'status' in body and body['status'] == 'cancelled':
        status_escaped = body['status'].replace("'", "''")
        updates.append(f"status = '{status_escaped}'")
        
        # Определяем кто отменил заказ
        cancelled_by = 'seller' if is_seller else 'buyer'
        updates.append(f"cancelled_by = '{cancelled_by}'")
        
        # Возвращаем зарезервированное количество в предложение
        offer_id_escaped = str(order['offer_id']).replace("'", "''")
        order_quantity = order['quantity']
        cur.execute(f"""
            UPDATE {schema}.offers 
            SET reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - {order_quantity})
            WHERE id = '{offer_id_escaped}'
        """)
        
        # Инвалидируем кэш offers
        offers_cache.clear()
        
        print(f"[CANCEL_ORDER] Returned {order_quantity} units to offer {offer_id_escaped}")
        
        # Если отменил продавец - снижаем его рейтинг на 5%
        if is_seller:
            seller_id = order['seller_id']
            cur.execute(f"""
                UPDATE {schema}.users 
                SET rating = GREATEST(0, COALESCE(rating, 100) * 0.95)
                WHERE id = {seller_id}
            """)
            print(f"[CANCEL_ORDER] Seller {seller_id} rating decreased by 5%")
    
    # Отклонение заказа - возвращаем зарезервированное количество
    elif 'status' in body and body['status'] == 'rejected':
        status_escaped = body['status'].replace("'", "''")
        updates.append(f"status = '{status_escaped}'")
        
        # Возвращаем зарезервированное количество в предложение
        offer_id_escaped = str(order['offer_id']).replace("'", "''")
        order_quantity = order['quantity']
        cur.execute(f"""
            UPDATE {schema}.offers 
            SET reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - {order_quantity})
            WHERE id = '{offer_id_escaped}'
        """)
        print(f"[REJECT_ORDER] Returned {order_quantity} units to offer {offer_id_escaped}")
    
    # Обычное обновление статуса
    elif 'status' in body and body['status'] != 'accepted':
        status_escaped = body['status'].replace("'", "''")
        updates.append(f"status = '{status_escaped}'")
    
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
    
    sql = f"UPDATE {schema}.orders SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = '{order_id_escaped}'"
    
    print(f"[UPDATE_ORDER] SQL: {sql}")
    
    cur.execute(sql)
    
    accepted_now = counter_accepted or (body.get('status') == 'accepted')
    if accepted_now:
        try:
            oid = str(order['offer_id']).replace("'", "''")
            cur.execute(f"SELECT id FROM {schema}.requests WHERE id = '{oid}'")
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
    
    # Отправляем уведомления после успешного обновления
    try:
        new_status = body.get('status')
        
        # Встречное предложение от покупателя
        if 'counterPrice' in body and is_buyer:
            send_notification(
                order['seller_id'],
                'Встречное предложение по заказу',
                f'Покупатель предложил {body["counterPrice"]} ₽ за единицу товара',
                f'/my-orders?id={order_id}'
            )
        
        # Встречное предложение от продавца
        elif 'counterPrice' in body and is_seller:
            send_notification(
                order['buyer_id'],
                'Встречное предложение от продавца',
                f'Продавец предложил {body["counterPrice"]} ₽ за единицу товара',
                f'/my-orders?id={order_id}'
            )
        
        # Встречное предложение принято (продавцом или покупателем)
        elif counter_accepted:
            if is_seller:
                # Продавец принял встречное предложение покупателя
                send_notification(
                    order['buyer_id'],
                    'Встречное предложение принято',
                    f'Продавец согласился на вашу цену. Заказ принят!',
                    f'/my-orders?id={order_id}'
                )
            elif is_buyer:
                # Покупатель принял встречное предложение продавца
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
        
        # Заказ отклонен
        elif new_status == 'rejected':
            send_notification(
                order['buyer_id'],
                'Заказ отклонен',
                f'К сожалению, ваш заказ №{order.get("order_number", order_id[:8])} был отклонен',
                f'/my-orders?id={order_id}'
            )
        
        # Заказ отменён
        elif new_status == 'cancelled':
            notify_user = order['buyer_id'] if is_seller else order['seller_id']
            who_cancelled = 'Продавец' if is_seller else 'Покупатель'
            send_notification(
                notify_user,
                'Заказ отменён',
                f'{who_cancelled} отменил заказ №{order.get("order_number", order_id[:8])}',
                f'/my-orders?id={order_id}'
            )
        
        # Заказ завершён
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

def get_messages_by_offer(offer_id: str, headers: Dict[str, str]) -> Dict[str, Any]:
    """Получить все сообщения по предложению"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    schema = get_schema()
    offer_id_escaped = offer_id.replace("'", "''")
    
    # Сначала находим все заказы по offer_id
    sql_orders = f"SELECT id, order_number, buyer_name FROM {schema}.orders WHERE offer_id = '{offer_id_escaped}'"
    cur.execute(sql_orders)
    orders_data = cur.fetchall()
    
    if not orders_data:
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps([]),
            'isBase64Encoded': False
        }
    
    # Получаем ID всех заказов
    order_ids = [f"'{str(o['id'])}'" for o in orders_data]
    order_map = {str(o['id']): {'order_number': o['order_number'], 'buyer_name': o.get('buyer_name', 'Пользователь')} for o in orders_data}
    
    # Получаем сообщения по этим заказам
    sql_messages = f"""
        SELECT * FROM {schema}.order_messages 
        WHERE order_id IN ({','.join(order_ids)})
        ORDER BY created_at DESC
    """
    
    cur.execute(sql_messages)
    messages = cur.fetchall()
    
    result = []
    for msg in messages:
        msg_dict = dict(msg)
        order_id = str(msg_dict.get('order_id'))
        
        # Добавляем данные заказа
        if order_id in order_map:
            msg_dict['order_number'] = order_map[order_id]['order_number']
            msg_dict['sender_name'] = order_map[order_id]['buyer_name']
        else:
            msg_dict['order_number'] = 'N/A'
            msg_dict['sender_name'] = 'Пользователь'
        
        msg_dict['createdAt'] = msg_dict.pop('created_at').isoformat() if msg_dict.get('created_at') else None
        
        # Преобразуем UUID и нестандартные типы в строки
        for k, v in list(msg_dict.items()):
            if hasattr(v, 'hex'):  # UUID
                msg_dict[k] = str(v)
            elif hasattr(v, 'isoformat'):  # datetime
                msg_dict[k] = v.isoformat()
        
        result.append(msg_dict)
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(result),
        'isBase64Encoded': False
    }

def get_messages_by_order(order_id: str, headers: Dict[str, str], event: Dict[str, Any] = None) -> Dict[str, Any]:
    """Получить все сообщения по заказу и отметить чужие как прочитанные"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    schema = get_schema()
    order_id_escaped = order_id.replace("'", "''")
    
    user_id = None
    if event:
        user_headers = event.get('headers', {})
        user_id = user_headers.get('X-User-Id') or user_headers.get('x-user-id')
    
    if user_id:
        cur.execute(f"""
            UPDATE {schema}.order_messages 
            SET is_read = true 
            WHERE order_id = '{order_id_escaped}' 
            AND sender_id != {int(user_id)} 
            AND is_read = false
        """)
        conn.commit()
    
    sql = f"SELECT * FROM {schema}.order_messages WHERE order_id = '{order_id_escaped}' ORDER BY created_at ASC"
    
    cur.execute(sql)
    messages = cur.fetchall()
    
    result = []
    for msg in messages:
        result.append({
            'id': msg['id'],
            'order_id': msg['order_id'],
            'sender_id': msg['sender_id'],
            'sender_name': msg['sender_name'],
            'sender_type': msg['sender_type'],
            'message': msg['message'],
            'is_read': msg['is_read'],
            'attachments': msg.get('attachments') or [],
            'createdAt': msg['created_at'].isoformat() if msg.get('created_at') else None
        })
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'messages': result}),
        'isBase64Encoded': False
    }

def upload_message_file(file_data_b64: str, file_name: str, content_type: str) -> str:
    """Загрузить файл в S3 и вернуть CDN URL"""
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )
    file_bytes = base64.b64decode(file_data_b64)
    ext = os.path.splitext(file_name)[1] or mimetypes.guess_extension(content_type) or ''
    key = f"order-messages/{uuid.uuid4()}{ext}"
    s3.put_object(Bucket='files', Key=key, Body=file_bytes, ContentType=content_type)
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    return cdn_url


def create_message(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Создать новое сообщение по заказу (поддерживает вложения фото/видео)"""
    body = json.loads(event.get('body', '{}'))
    user_headers = event.get('headers', {})
    user_id = user_headers.get('X-User-Id') or user_headers.get('x-user-id')
    
    print(f"[CREATE_MESSAGE] user_id={user_id}, body keys={list(body.keys())}")
    
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
    sender_id = body['senderId']
    
    # Получаем имя отправителя
    cur.execute(f"SELECT first_name, last_name FROM {schema}.users WHERE id = {sender_id}")
    user = cur.fetchone()
    
    if user:
        sender_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
    else:
        sender_name = 'Пользователь'
    
    order_id_escaped = body['orderId'].replace("'", "''")
    sender_type_escaped = body['senderType'].replace("'", "''")
    message_text = body.get('message', '')
    message_escaped = message_text.replace("'", "''")
    sender_name_escaped = sender_name.replace("'", "''")
    
    # Загружаем файл-вложение если есть
    attachments = []
    if body.get('fileData') and body.get('fileName'):
        file_url = upload_message_file(
            body['fileData'],
            body['fileName'],
            body.get('fileType', 'application/octet-stream')
        )
        attachments.append({
            'url': file_url,
            'name': body['fileName'],
            'type': body.get('fileType', 'application/octet-stream')
        })
    
    attachments_json = json.dumps(attachments, ensure_ascii=False).replace("'", "''")
    
    # Получаем информацию о заказе для определения получателя уведомления
    cur.execute(f"SELECT buyer_id, seller_id, order_number FROM {schema}.orders WHERE id = '{order_id_escaped}'")
    order = cur.fetchone()
    
    sql = f"""
        INSERT INTO {schema}.order_messages (order_id, sender_id, sender_name, sender_type, message, attachments)
        VALUES ('{order_id_escaped}', {sender_id}, '{sender_name_escaped}', '{sender_type_escaped}', '{message_escaped}', '{attachments_json}')
        RETURNING id, created_at
    """
    
    cur.execute(sql)
    result = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    
    # Отправляем уведомление получателю сообщения
    if order:
        try:
            recipient_id = order['seller_id'] if int(sender_id) == order['buyer_id'] else order['buyer_id']
            notif_text = message_text if message_text else '📎 Файл'
            send_notification(
                recipient_id,
                'Новое сообщение по заказу',
                f'{sender_name}: {notif_text[:50]}...' if len(notif_text) > 50 else f'{sender_name}: {notif_text}',
                f'/my-orders?id={body["orderId"]}'
            )
        except Exception as e:
            print(f'Message notification error: {e}')
    
    return {
        'statusCode': 201,
        'headers': headers,
        'body': json.dumps({
            'id': str(result['id']),
            'createdAt': result['created_at'].isoformat(),
            'message': 'Message created successfully'
        }),
        'isBase64Encoded': False
    }

def delete_message(message_id: str, event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Удалить сообщение пользователя и файл из S3 (только своё)"""
    user_headers = event.get('headers', {})
    user_id = user_headers.get('X-User-Id') or user_headers.get('x-user-id')
    if not user_id:
        return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Auth required'}), 'isBase64Encoded': False}

    conn = get_db_connection()
    cur = conn.cursor()
    schema = get_schema()
    message_id_escaped = message_id.replace("'", "''")

    cur.execute(f"SELECT sender_id, attachments FROM {schema}.order_messages WHERE id = '{message_id_escaped}'")
    msg = cur.fetchone()

    if not msg:
        cur.close(); conn.close()
        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Message not found'}), 'isBase64Encoded': False}

    if str(msg['sender_id']) != str(user_id):
        cur.close(); conn.close()
        return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Not your message'}), 'isBase64Encoded': False}

    # Удаляем файлы из S3
    attachments = msg.get('attachments') or []
    if attachments:
        try:
            s3 = boto3.client(
                's3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
            )
            for att in attachments:
                url = att.get('url', '')
                # Извлекаем ключ из CDN URL
                if '/bucket/' in url:
                    key = url.split('/bucket/', 1)[1]
                    s3.delete_object(Bucket='files', Key=key)
                    print(f"[DELETE_MESSAGE] Deleted S3 file: {key}")
        except Exception as e:
            print(f"[DELETE_MESSAGE] S3 delete error: {e}")

    cur.execute(f"DELETE FROM {schema}.order_messages WHERE id = '{message_id_escaped}'")
    conn.commit()
    cur.close()
    conn.close()

    return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'message': 'Deleted'}), 'isBase64Encoded': False}


def cleanup_orphaned_orders(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Удаление заказов с несуществующими предложениями"""
    user_headers = event.get('headers', {})
    user_id = user_headers.get('X-User-Id') or user_headers.get('x-user-id')
    
    # Проверка прав администратора (можно добавить проверку роли)
    if not user_id:
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Authentication required'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    schema = get_schema()
    
    # Находим заказы с несуществующими предложениями
    sql_find = f"""
        SELECT o.id, o.title, o.offer_id 
        FROM {schema}.orders o
        LEFT JOIN {schema}.offers of ON o.offer_id = of.id
        WHERE of.id IS NULL
    """
    
    cur.execute(sql_find)
    orphaned = cur.fetchall()
    orphaned_ids = [order['id'] for order in orphaned]
    
    deleted_count = 0
    if orphaned_ids:
        # Удаляем сообщения по этим заказам
        ids_str = "', '".join([str(oid).replace("'", "''") for oid in orphaned_ids])
        sql_delete_messages = f"DELETE FROM {schema}.order_messages WHERE order_id IN ('{ids_str}')"
        cur.execute(sql_delete_messages)
        
        # Удаляем сами заказы
        sql_delete_orders = f"DELETE FROM {schema}.orders WHERE id IN ('{ids_str}')"
        cur.execute(sql_delete_orders)
        deleted_count = cur.rowcount
        
        conn.commit()
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'deleted': deleted_count,
            'orphaned_orders': [{'id': str(o['id']), 'title': o['title'], 'offer_id': str(o['offer_id'])} for o in orphaned],
            'message': f'Deleted {deleted_count} orphaned orders'
        }),
        'isBase64Encoded': False
    }

def delete_order(order_id: str, event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Удаление конкретного заказа по ID"""
    user_headers = event.get('headers', {})
    user_id = user_headers.get('X-User-Id') or user_headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Authentication required'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    schema = get_schema()
    
    order_id_escaped = order_id.replace("'", "''")
    
    # Проверяем существование заказа и права доступа
    cur.execute(f"SELECT buyer_id, seller_id, status FROM {schema}.orders WHERE id = '{order_id_escaped}'")
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
    
    # Проверяем что пользователь - продавец или покупатель
    user_id_int = int(user_id)
    if order['buyer_id'] != user_id_int and order['seller_id'] != user_id_int:
        cur.close()
        conn.close()
        return {
            'statusCode': 403,
            'headers': headers,
            'body': json.dumps({'error': 'Access denied'}),
            'isBase64Encoded': False
        }
    
    # ПРОВЕРКА 3: Отменить можно только до статуса "Принят"
    allowed_statuses = ['new', 'negotiating']
    if order['status'] not in allowed_statuses:
        cur.close()
        conn.close()
        return {
            'statusCode': 403,
            'headers': headers,
            'body': json.dumps({'error': f'Нельзя отменить заказ в статусе "{order["status"]}"'}),
            'isBase64Encoded': False
        }
    
    # Удаляем сообщения по этому заказу
    cur.execute(f"DELETE FROM {schema}.order_messages WHERE order_id = '{order_id_escaped}'")
    
    # Удаляем сам заказ
    cur.execute(f"DELETE FROM {schema}.orders WHERE id = '{order_id_escaped}'")
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'message': 'Order deleted successfully'}),
        'isBase64Encoded': False
    }

def cleanup_all_orders(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Удаление ВСЕХ заказов и сообщений - полная очистка для начала с чистого листа"""
    user_headers = event.get('headers', {})
    user_id = user_headers.get('X-User-Id') or user_headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Authentication required'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    schema = get_schema()
    
    # Считаем сколько было
    cur.execute(f"SELECT COUNT(*) as cnt FROM {schema}.orders")
    orders_count = cur.fetchone()['cnt']
    
    cur.execute(f"SELECT COUNT(*) as cnt FROM {schema}.order_messages")
    messages_count = cur.fetchone()['cnt']
    
    # Удаляем все сообщения
    cur.execute(f"DELETE FROM {schema}.order_messages")
    
    # Удаляем все заказы
    cur.execute(f"DELETE FROM {schema}.orders")
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'deleted_orders': orders_count,
            'deleted_messages': messages_count,
            'message': f'Deleted all {orders_count} orders and {messages_count} messages'
        }),
        'isBase64Encoded': False
    }