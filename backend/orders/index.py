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
from typing import Dict, Any
from rate_limiter import rate_limiter

from orders_utils import get_schema, get_db_connection
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
