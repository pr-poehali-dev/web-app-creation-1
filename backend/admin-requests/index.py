import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
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


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''Бэкенд для управления запросами в админ-панели'''
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
        cur = conn.cursor()
        
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            search = query_params.get('search', '') if query_params else ''
            status_filter = query_params.get('status', 'all') if query_params else 'all'
            
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
                    r.district,
                    CASE 
                        WHEN u.company_name IS NOT NULL AND u.company_name != '' THEN u.company_name
                        WHEN u.first_name IS NOT NULL OR u.last_name IS NOT NULL THEN 
                            TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')))
                        ELSE 'ID: ' || r.user_id::text
                    END as buyer_name
                FROM t_p42562714_web_app_creation_1.requests r
                LEFT JOIN t_p42562714_web_app_creation_1.users u ON r.user_id = u.id
                WHERE {where_sql} AND r.status NOT IN ('archived', 'draft')
                ORDER BY r.created_at DESC
                LIMIT 100
            """
            
            cur.execute(query, tuple(params))
            requests_data = cur.fetchall()
            
            requests_list = []
            for req in requests_data:
                req_dict = dict(req)
                req_dict = decimal_to_float(req_dict)
                budget = req_dict.get('price_per_unit', 0) * req_dict.get('quantity', 1)
                buyer_id = req_dict.get('buyer_id')
                buyer_name = req_dict.get('buyer_name') or f'ID: {buyer_id}' if buyer_id else 'Неизвестный пользователь'
                
                request_id = str(req_dict['id'])
                
                cur.execute("""
                    SELECT oi.url, oi.alt
                    FROM t_p42562714_web_app_creation_1.request_image_relations rir
                    JOIN t_p42562714_web_app_creation_1.offer_images oi ON rir.image_id = oi.id
                    WHERE rir.request_id = %s
                    ORDER BY rir.sort_order
                """, (request_id,))
                images_data = cur.fetchall()
                images = [{'url': img['url'], 'alt': img['alt']} for img in images_data]
                
                requests_list.append({
                    'id': request_id,
                    'title': req_dict['title'],
                    'buyer': buyer_name,
                    'buyerId': str(buyer_id) if buyer_id else None,
                    'pricePerUnit': req_dict['price_per_unit'] if req_dict['price_per_unit'] else 0,
                    'budget': budget,
                    'quantity': req_dict['quantity'] if req_dict['quantity'] else 0,
                    'unit': req_dict['unit'],
                    'status': req_dict['status'] or 'open',
                    'createdAt': req_dict['created_at'].isoformat() if req_dict['created_at'] else None,
                    'images': images,
                    'district': req_dict.get('district')
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
            new_status = body_data.get('status')
            
            if not request_id or not new_status:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'requestId and status are required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                """UPDATE t_p42562714_web_app_creation_1.requests 
                   SET status = %s 
                   WHERE id = %s""",
                (new_status, request_id)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'requestId': request_id, 'status': new_status}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            query_params = event.get('queryStringParameters') or {}
            request_id = query_params.get('requestId')
            
            if not request_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'requestId is required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                """UPDATE t_p42562714_web_app_creation_1.requests 
                   SET status = 'archived' 
                   WHERE id = %s""",
                (request_id,)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'requestId': request_id}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        import traceback
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e), 'traceback': traceback.format_exc()}),
            'isBase64Encoded': False
        }
    
    finally:
        if conn:
            conn.close()
