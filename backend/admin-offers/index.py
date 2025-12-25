import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal


def decimal_to_float(obj):
    """Рекурсивно конвертирует Decimal в float"""
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_to_float(item) for item in obj]
    return obj

def check_rate_limit(conn, identifier: str, endpoint: str, max_requests: int = 30, window_minutes: int = 1) -> bool:
    with conn.cursor() as cur:
        window_start = datetime.now() - timedelta(minutes=window_minutes)
        
        cur.execute(
            """SELECT request_count, window_start 
               FROM rate_limits 
               WHERE identifier = %s AND endpoint = %s""",
            (identifier, endpoint)
        )
        result = cur.fetchone()
        
        if result:
            if result['window_start'] > window_start:
                if result['request_count'] >= max_requests:
                    return False
                cur.execute(
                    """UPDATE rate_limits 
                       SET request_count = request_count + 1 
                       WHERE identifier = %s AND endpoint = %s""",
                    (identifier, endpoint)
                )
            else:
                cur.execute(
                    """UPDATE rate_limits 
                       SET request_count = 1, window_start = CURRENT_TIMESTAMP 
                       WHERE identifier = %s AND endpoint = %s""",
                    (identifier, endpoint)
                )
        else:
            cur.execute(
                """INSERT INTO rate_limits (identifier, endpoint, request_count, window_start) 
                   VALUES (%s, %s, 1, CURRENT_TIMESTAMP)""",
                (identifier, endpoint)
            )
        
        conn.commit()
        return True

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Бэкенд для управления предложениями в админ-панели
    Args: event - dict с httpMethod, body, queryStringParameters
          context - объект с атрибутами request_id, function_name
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'}),
            'isBase64Encoded': False
        }
    
    conn = None
    try:
        conn = psycopg2.connect(database_url, cursor_factory=RealDictCursor)
        
        headers = event.get('headers', {})
        user_id = headers.get('X-User-Id') or headers.get('x-user-id', 'anonymous')
        
        if not check_rate_limit(conn, user_id, 'admin_offers', max_requests=30, window_minutes=1):
            return {
                'statusCode': 429,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Слишком много запросов. Попробуйте через минуту.'}),
                'isBase64Encoded': False
            }
        
        cur = conn.cursor()
        
        if method == 'GET':
            query_params = event.get('queryStringParameters', {})
            search = query_params.get('search', '')
            status_filter = query_params.get('status', 'all')
            
            where_clauses = []
            params = []
            
            if search:
                search_pattern = f"%{search}%"
                where_clauses.append("(c.title ILIKE %s OR c.product_name ILIKE %s OR u.company_name ILIKE %s OR u.first_name ILIKE %s)")
                params.extend([search_pattern, search_pattern, search_pattern, search_pattern])
            
            if status_filter != 'all':
                where_clauses.append("c.status = %s")
                params.append(status_filter)
            
            where_sql = ' AND '.join(where_clauses) if where_clauses else '1=1'
            
            query = f"""
                SELECT 
                    c.id,
                    c.title,
                    c.product_name,
                    c.price_per_unit,
                    c.quantity,
                    c.unit,
                    c.status,
                    c.created_at,
                    COALESCE(u.company_name, u.first_name || ' ' || u.last_name) as seller_name
                FROM contracts c
                LEFT JOIN users u ON c.seller_id = u.id
                WHERE {where_sql}
                ORDER BY c.created_at DESC
                LIMIT 100
            """
            
            cur.execute(query, tuple(params))
            offers = cur.fetchall()
            
            offers_list = []
            for offer in offers:
                offer_dict = dict(offer)
                offer_dict = decimal_to_float(offer_dict)
                total_price = offer_dict.get('price_per_unit', 0) * offer_dict.get('quantity', 1)
                offers_list.append({
                    'id': str(offer_dict['id']),
                    'title': offer_dict['title'] or offer_dict['product_name'],
                    'seller': offer_dict['seller_name'] or 'Неизвестный продавец',
                    'price': offer_dict['price_per_unit'] if offer_dict['price_per_unit'] else 0,
                    'totalPrice': total_price,
                    'quantity': offer_dict['quantity'] if offer_dict['quantity'] else 0,
                    'unit': offer_dict['unit'],
                    'status': offer_dict['status'] or 'open',
                    'createdAt': offer_dict['created_at'].isoformat() if offer_dict['created_at'] else None
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'offers': offers_list, 'total': len(offers_list)}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            offer_id = body_data.get('offerId')
            action = body_data.get('action')
            
            if not offer_id or not action:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'offerId and action required'}),
                    'isBase64Encoded': False
                }
            
            if action == 'approve':
                cur.execute(f"UPDATE contracts SET status = 'open' WHERE id = %s", (offer_id,))
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Offer approved'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'reject':
                cur.execute(f"UPDATE contracts SET status = 'cancelled' WHERE id = %s", (offer_id,))
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Offer rejected'}),
                    'isBase64Encoded': False
                }
        
        elif method == 'DELETE':
            body_data = json.loads(event.get('body', '{}'))
            offer_id = body_data.get('offerId')
            
            if not offer_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'offerId required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("DELETE FROM contracts WHERE id = %s", (offer_id,))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Offer deleted'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        import traceback
        error_details = {
            'error': str(e),
            'type': type(e).__name__,
            'traceback': traceback.format_exc()
        }
        print(f"ERROR: {error_details}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e), 'details': error_details}),
            'isBase64Encoded': False
        }
    finally:
        if conn:
            conn.close()