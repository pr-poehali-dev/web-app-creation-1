'''
API для управления заказами
GET / - получить список заказов пользователя
GET /?id=uuid - получить заказ по ID
GET /?offerId=uuid&messages=true - получить сообщения по предложению
POST / - создать новый заказ
POST /?message=true - отправить сообщение по заказу
PUT /?id=uuid - обновить статус заказа
Использует DB_SCHEMA для доступа к схеме БД
'''

import json
import os
from typing import Dict, Any
from datetime import datetime
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor


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
        if method == 'GET':
            query_params = event.get('queryStringParameters', {}) or {}
            order_id = query_params.get('id') or query_params.get('orderId')
            offer_id = query_params.get('offerId')
            messages_flag = query_params.get('messages')
            
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
            
            if cleanup_all:
                return cleanup_all_orders(event, headers)
            elif cleanup_orphaned:
                return cleanup_orphaned_orders(event, headers)
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
    
    user_id_int = int(user_id)
    
    schema = get_schema()
    
    # Запрос БЕЗ JOIN - используем только данные из таблицы orders
    sql = f"SELECT * FROM {schema}.orders WHERE 1=1"
    
    if order_type == 'purchase':
        sql += f" AND buyer_id = {user_id_int}"
    elif order_type == 'sale':
        sql += f" AND seller_id = {user_id_int}"
    else:
        sql += f" AND (buyer_id = {user_id_int} OR seller_id = {user_id_int})"
    
    if status != 'all':
        status_escaped = status.replace("'", "''")
        sql += f" AND status = '{status_escaped}'"
    
    sql += " ORDER BY order_date DESC"
    
    cur.execute(sql)
    orders = cur.fetchall()
    
    result = []
    for order in orders:
        order_dict = dict(order)
        
        # Определяем тип заказа (покупка или продажа)
        order_dict['type'] = 'purchase' if order_dict['buyer_id'] == user_id_int else 'sale'
        
        # Используем данные продавца/покупателя из самого заказа (buyer_name, seller_name и т.д.)
        order_dict['offer_title'] = order_dict.get('title', '')
        order_dict['seller_full_name'] = order_dict.get('seller_name', 'Продавец')
        order_dict['buyer_full_name'] = order_dict.get('buyer_name', 'Покупатель')
        
        # Преобразуем даты
        order_dict['orderDate'] = order_dict.pop('order_date').isoformat() if order_dict.get('order_date') else None
        order_dict['deliveryDate'] = order_dict.pop('delivery_date').isoformat() if order_dict.get('delivery_date') else None
        order_dict['createdAt'] = order_dict.pop('created_at').isoformat() if order_dict.get('created_at') else None
        order_dict['updatedAt'] = order_dict.pop('updated_at').isoformat() if order_dict.get('updated_at') else None
        
        order_dict = decimal_to_float(order_dict)
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
    
    order_id_escaped = order_id.replace("'", "''")
    schema = get_schema()
    
    # Простой запрос без JOIN
    sql = f"SELECT * FROM {schema}.orders WHERE id = '{order_id_escaped}'"
    
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
    
    # Добавляем поля из самого заказа
    order_dict['offer_title'] = order_dict.get('title', '')
    order_dict['buyer_full_name'] = order_dict.get('buyer_name', 'Покупатель')
    order_dict['seller_full_name'] = order_dict.get('seller_name', 'Продавец')
    
    order_dict['orderDate'] = order_dict.pop('order_date').isoformat() if order_dict.get('order_date') else None
    order_dict['deliveryDate'] = order_dict.pop('delivery_date').isoformat() if order_dict.get('delivery_date') else None
    order_dict['createdAt'] = order_dict.pop('created_at').isoformat() if order_dict.get('created_at') else None
    order_dict['updatedAt'] = order_dict.pop('updated_at').isoformat() if order_dict.get('updated_at') else None
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
    
    sql = f"""
        INSERT INTO {schema}.orders (
            order_number, buyer_id, seller_id, offer_id,
            title, quantity, unit, price_per_unit, total_amount,
            has_vat, vat_amount,
            delivery_type, delivery_address, district,
            buyer_name, buyer_phone, buyer_email, buyer_company, buyer_inn, buyer_comment,
            seller_name, seller_phone, seller_email,
            status
        ) VALUES (
            '{order_number}', {int(user_id)}, {seller_id}, '{offer_id_escaped}',
            '{title_escaped}', {body['quantity']}, '{unit_escaped}', {body['pricePerUnit']}, {total_amount},
            {body.get('hasVAT', False)}, {vat_amount if vat_amount else 'NULL'},
            '{delivery_type_escaped}', '{delivery_address_escaped}', '{district_escaped}',
            '{buyer_name_escaped}', '{buyer_phone_escaped}', '{buyer_email_escaped}', '{buyer_company_escaped}', '{buyer_inn_escaped}', '{buyer_comment_escaped}',
            '{seller_name_escaped}', '{seller_phone_escaped}', '{seller_email_escaped}',
            'new'
        )
        RETURNING id, order_number, order_date
    """
    
    cur.execute(sql)
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
    '''Обновить статус заказа'''
    body = json.loads(event.get('body', '{}'))
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    updates = []
    
    if 'status' in body:
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
    
    schema = get_schema()
    order_id_escaped = order_id.replace("'", "''")
    sql = f"UPDATE {schema}.orders SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = '{order_id_escaped}'"
    
    cur.execute(sql)
    conn.commit()
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
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'User ID required'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    order_id_escaped = body['orderId'].replace("'", "''")
    sender_type_escaped = body['senderType'].replace("'", "''")
    message_escaped = body['message'].replace("'", "''")
    
    schema = get_schema()
    sql = f"""
        INSERT INTO {schema}.order_messages (order_id, sender_id, sender_type, message)
        VALUES ('{order_id_escaped}', {body['senderId']}, '{sender_type_escaped}', '{message_escaped}')
        RETURNING id, created_at
    """
    
    cur.execute(sql)
    result = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    
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