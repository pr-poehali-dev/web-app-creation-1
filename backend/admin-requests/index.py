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
    Бэкенд для управления запросами в админ-панели
    Args: event - dict с httpMethod, body, queryStringParameters
          context - объект с атрибутами request_id, function_name
    Returns: HTTP response dict с данными запросов
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
        
        if not check_rate_limit(conn, user_id, 'admin_requests', max_requests=30, window_minutes=1):
            return {
                'statusCode': 429,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Слишком много запросов. Попробуйте через минуту.'}),
                'isBase64Encoded': False
            }
        
        cur = conn.cursor()
        
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            search = query_params.get('search', '') if query_params else ''
            status_filter = query_params.get('status', 'all') if query_params else 'all'
            
            print(f"GET: query_params={query_params}, search={search}, status_filter={status_filter}")
            
            where_clauses = []
            params = []
            
            if search:
                search_pattern = f"%{search}%"
                where_clauses.append("(r.title ILIKE %s OR r.description ILIKE %s OR u.company_name ILIKE %s OR u.first_name ILIKE %s)")
                params.extend([search_pattern, search_pattern, search_pattern, search_pattern])
            
            if status_filter != 'all':
                where_clauses.append("r.status = %s")
                params.append(status_filter)
            
            where_sql = ' AND '.join(where_clauses) if where_clauses else '1=1'
            
            query = f"""
                SELECT 
                    r.id,
                    r.title,
                    r.description,
                    r.price_per_unit,
                    r.quantity,
                    r.unit,
                    r.status,
                    r.created_at,
                    r.user_id as buyer_id,
                    CASE 
                        WHEN u.company_name IS NOT NULL AND u.company_name != '' THEN u.company_name
                        WHEN u.first_name IS NOT NULL OR u.last_name IS NOT NULL THEN 
                            TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')))
                        ELSE 'ID: ' || r.user_id::text
                    END as buyer_name
                FROM t_p42562714_web_app_creation_1.requests r
                LEFT JOIN t_p42562714_web_app_creation_1.users u ON r.user_id = u.id
                WHERE {where_sql}
                ORDER BY r.created_at DESC
                LIMIT 100
            """
            
            print(f"GET: Executing query with where_sql='{where_sql}', params={params}")
            cur.execute(query, tuple(params))
            requests_data = cur.fetchall()
            print(f"GET: Found {len(requests_data)} requests")
            
            requests_list = []
            for req in requests_data:
                req_dict = dict(req)
                req_dict = decimal_to_float(req_dict)
                budget = req_dict.get('price_per_unit', 0) * req_dict.get('quantity', 1)
                buyer_id = req_dict.get('buyer_id')
                buyer_name = req_dict.get('buyer_name') or f'ID: {buyer_id}' if buyer_id else 'Неизвестный пользователь'
                
                requests_list.append({
                    'id': str(req_dict['id']),
                    'title': req_dict['title'],
                    'buyer': buyer_name,
                    'buyerId': str(buyer_id) if buyer_id else None,
                    'pricePerUnit': req_dict['price_per_unit'] if req_dict['price_per_unit'] else 0,
                    'budget': budget,
                    'quantity': req_dict['quantity'] if req_dict['quantity'] else 0,
                    'unit': req_dict['unit'],
                    'status': req_dict['status'] or 'open',
                    'createdAt': req_dict['created_at'].isoformat() if req_dict['created_at'] else None
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'requests': requests_list, 'total': len(requests_list)}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            request_id = body_data.get('requestId')
            action = body_data.get('action')
            
            if not request_id or not action:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'requestId and action required'}),
                    'isBase64Encoded': False
                }
            
            if action == 'approve':
                cur.execute(f"UPDATE t_p42562714_web_app_creation_1.requests SET status = 'active' WHERE id = %s", (request_id,))
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Request approved'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'reject':
                cur.execute(f"UPDATE t_p42562714_web_app_creation_1.requests SET status = 'rejected' WHERE id = %s", (request_id,))
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Request rejected'}),
                    'isBase64Encoded': False
                }
        
        elif method == 'DELETE':
            body_data = json.loads(event.get('body', '{}'))
            request_id = body_data.get('requestId')
            
            if not request_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'requestId required'}),
                    'isBase64Encoded': False
                }
            
            print(f"DELETE: Attempting to delete request with ID: {request_id}")
            cur.execute("DELETE FROM t_p42562714_web_app_creation_1.requests WHERE id = %s::uuid", (request_id,))
            deleted_count = cur.rowcount
            conn.commit()
            print(f"DELETE: Deleted {deleted_count} rows")
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Request deleted', 'deleted_count': deleted_count}),
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
