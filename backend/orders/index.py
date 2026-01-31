'''
Управление заказами пользователей
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
import urllib.request
import urllib.parse

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
    try:
        # Push-уведомление
        push_data = json.dumps({
            'userId': user_id,
            'title': title,
            'message': message,
            'url': url
        }).encode('utf-8')
        
        push_req = urllib.request.Request(
            'https://functions.poehali.dev/c16d67d9-8c85-481e-ae48-92e2b0d9cc64',
            data=push_data,
            headers={'Content-Type': 'application/json'}
        )
        urllib.request.urlopen(push_req, timeout=3)
    except Exception as e:
        print(f'Push notification error: {e}')
    
    try:
        # Email-уведомление
        email_data = json.dumps({
            'userId': user_id,
            'title': title,
            'message': message,
            'url': url
        }).encode('utf-8')
        
        email_req = urllib.request.Request(
            'https://functions.poehali.dev/3c4b3e64-cb71-4b82-abd5-e67393be3d43',
            data=email_data,
            headers={'Content-Type': 'application/json'}
        )
        urllib.request.urlopen(email_req, timeout=3)
    except Exception as e:
        print(f'Email notification error: {e}')

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
        
        if method == 'GET':
            query_params = event.get('queryStringParameters', {}) or {}
            order_id = query_params.get('id') or query_params.get('orderId')
            offer_id = query_params.get('offerId')
            messages_flag = query_params.get('messages')
            
            print(f"[GET] order_id={order_id}, offer_id={offer_id}, messages={messages_flag}")
            
            if messages_flag == 'true' and offer_id:
                return get_messages_by_offer(offer_id, headers)
            elif messages_flag == 'true' and order_id:
                return get_messages_by_order(order_id, headers)
            elif order_id:
                return get_order_by_id(order_id, headers)
            else:
                return get_user_orders(event, headers)
        
        elif method == 'POST':
            query_params = event.get('queryStringParameters', {}) or {}
            is_message = query_params.get('message') == 'true'
            
            print(f"[POST] is_message={is_message}, query={query_params}")
            
            if is_message:
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
            
            if cleanup_all:
                return cleanup_all_orders(event, headers)
            elif cleanup_orphaned:
                return cleanup_orphaned_orders(event, headers)
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
    
    # Запрос с JOIN к таблице offers для получения цены и доступного количества
    sql = f"""
        SELECT 
            o.*,
            of.price_per_unit as offer_price_per_unit,
            COALESCE(of.quantity - of.sold_quantity - of.reserved_quantity, 0) as offer_available_quantity
        FROM {schema}.orders o
        LEFT JOIN {schema}.offers of ON o.offer_id = of.id
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

def get_order_by_id(order_id: str, headers: Dict[str, str]) -> Dict[str, Any]:
    """Получить заказ по ID"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    order_id_escaped = order_id.replace("'", "''")
    schema = get_schema()
    
    # Запрос с JOIN к таблице offers
    sql = f"""
        SELECT 
            o.*,
            of.price_per_unit as offer_price_per_unit,
            COALESCE(of.quantity - of.sold_quantity - of.reserved_quantity, 0) as offer_available_quantity
        FROM {schema}.orders o
        LEFT JOIN {schema}.offers of ON o.offer_id = of.id
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
    
    # Добавляем поля из offers
    order_dict['offerPricePerUnit'] = float(order_dict.pop('offer_price_per_unit')) if order_dict.get('offer_price_per_unit') is not None else None
    order_dict['offerAvailableQuantity'] = int(order_dict.pop('offer_available_quantity')) if order_dict.get('offer_available_quantity') is not None else 0
    
    # Добавляем поля из самого заказа
    order_dict['offer_title'] = order_dict.get('title', '')
    order_dict['buyer_full_name'] = order_dict.get('buyer_name', 'Покупатель')
    order_dict['seller_full_name'] = order_dict.get('seller_name', 'Продавец')
    
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
    cur.execute(f"SELECT user_id FROM {schema}.offers WHERE id = '{offer_id_escaped}'")
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
    
    vat_amount = None
    if body.get('hasVAT') and body.get('vatRate'):
        vat_amount = (body['pricePerUnit'] * body['quantity'] * body['vatRate']) / 100
    
    total_amount = body['pricePerUnit'] * body['quantity']
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
    
    sql = f"""
        INSERT INTO {schema}.orders (
            order_number, buyer_id, seller_id, offer_id,
            title, quantity, original_quantity, unit, price_per_unit, total_amount,
            has_vat, vat_amount,
            delivery_type, delivery_address, district,
            buyer_name, buyer_phone, buyer_email, buyer_company, buyer_inn, buyer_comment,
            seller_name, seller_phone, seller_email,
            status,
            counter_price_per_unit, counter_total_amount, counter_offer_message, counter_offered_at, counter_offered_by
        ) VALUES (
            '{order_number}', {int(user_id)}, {seller_id}, '{offer_id_escaped}',
            '{title_escaped}', {body['quantity']}, {body['quantity']}, '{unit_escaped}', {body['pricePerUnit']}, {total_amount},
            {body.get('hasVAT', False)}, {vat_amount if vat_amount else 'NULL'},
            '{delivery_type_escaped}', '{delivery_address_escaped}', '{district_escaped}',
            '{buyer_name_escaped}', '{buyer_phone_escaped}', '{buyer_email_escaped}', '{buyer_company_escaped}', '{buyer_inn_escaped}', '{buyer_comment_escaped}',
            '{seller_name_escaped}', '{seller_phone_escaped}', '{seller_email_escaped}',
            '{initial_status}',
            {counter_price_sql}, {counter_total_sql}, {counter_message_sql}, {counter_offered_at_sql}, {counter_offered_by_sql}
        )
        RETURNING id, order_number, order_date
    """
    
    cur.execute(sql)
    result = cur.fetchone()
    
    # Обновляем reserved_quantity в таблице offers
    update_offer_sql = f"""
        UPDATE {schema}.offers 
        SET reserved_quantity = COALESCE(reserved_quantity, 0) + {body['quantity']}
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
        
        # Продавец принял встречное предложение покупателя
        elif counter_accepted:
            send_notification(
                order['buyer_id'],
                'Встречное предложение принято',
                f'Продавец согласился на вашу цену. Заказ принят!',
                f'/my-orders?id={order_id}'
            )
        
        # Продавец принял заказ
        elif new_status == 'accepted':
            send_notification(
                order['buyer_id'],
                'Заказ принят',
                f'Ваш заказ №{order.get("order_number", order_id[:8])} принят в работу',
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
        result.append(msg_dict)
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(result),
        'isBase64Encoded': False
    }

def get_messages_by_order(order_id: str, headers: Dict[str, str]) -> Dict[str, Any]:
    """Получить все сообщения по заказу"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    schema = get_schema()
    order_id_escaped = order_id.replace("'", "''")
    
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

def create_message(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Создать новое сообщение по заказу"""
    body = json.loads(event.get('body', '{}'))
    user_headers = event.get('headers', {})
    user_id = user_headers.get('X-User-Id') or user_headers.get('x-user-id')
    
    print(f"[CREATE_MESSAGE] user_id={user_id}, body={body}")
    
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
    message_escaped = body['message'].replace("'", "''")
    sender_name_escaped = sender_name.replace("'", "''")
    
    # Получаем информацию о заказе для определения получателя уведомления
    cur.execute(f"SELECT buyer_id, seller_id, order_number FROM {schema}.orders WHERE id = '{order_id_escaped}'")
    order = cur.fetchone()
    
    sql = f"""
        INSERT INTO {schema}.order_messages (order_id, sender_id, sender_name, sender_type, message)
        VALUES ('{order_id_escaped}', {sender_id}, '{sender_name_escaped}', '{sender_type_escaped}', '{message_escaped}')
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
            send_notification(
                recipient_id,
                'Новое сообщение по заказу',
                f'{sender_name}: {body["message"][:50]}...' if len(body["message"]) > 50 else f'{sender_name}: {body["message"]}',
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