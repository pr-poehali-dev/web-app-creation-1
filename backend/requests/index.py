import json
import os
from typing import Dict, Any, List
from datetime import datetime
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Подключение к базе данных"""
    return psycopg2.connect(os.environ['DATABASE_URL'])

def decimal_default(obj):
    """JSON serializer для Decimal"""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    API для работы с запросами (requests)
    GET / - получить список запросов с фильтрами
    GET /{id} - получить запрос по ID
    POST / - создать новый запрос
    PUT /{id} - обновить запрос
    DELETE /{id} - удалить запрос (мягкое удаление)
    """
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
            # Проверяем query параметр id для получения одного запроса
            query_params = event.get('queryStringParameters', {}) or {}
            request_id = query_params.get('id')
            
            if request_id:
                return get_request_by_id(request_id, headers)
            else:
                return get_requests_list(event, headers)
        
        elif method == 'POST':
            return create_request(event, headers)
        
        elif method == 'PUT':
            path_params = event.get('pathParams', {})
            request_id = path_params.get('id')
            if not request_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Request ID required'}),
                    'isBase64Encoded': False
                }
            return update_request(request_id, event, headers)
        
        elif method == 'DELETE':
            query_params = event.get('queryStringParameters', {}) or {}
            request_id = query_params.get('id')
            if not request_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Request ID required'}),
                    'isBase64Encoded': False
                }
            return delete_request(request_id, headers)
        
        else:
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }

def get_requests_list(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Получить список запросов с фильтрами"""
    params = event.get('queryStringParameters', {}) or {}
    
    category = params.get('category', '')
    subcategory = params.get('subcategory', '')
    district = params.get('district', '')
    query = params.get('query', '')
    status = params.get('status', 'active')
    limit = min(int(params.get('limit', '10')), 20)
    offset = int(params.get('offset', '0'))
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    sql = """
        SELECT 
            r.*,
            '[]'::json as images
        FROM t_p42562714_web_app_creation_1.requests r
        WHERE r.status != 'deleted' AND r.status != 'archived'
    """
    
    query_params = []
    
    # Если передан конкретный статус (не 'all'), добавляем фильтр
    if status and status != 'all':
        sql += " AND r.status = %s"
        query_params.append(status)
    
    if category:
        sql += " AND r.category = %s"
        query_params.append(category)
    
    if subcategory:
        sql += " AND r.subcategory = %s"
        query_params.append(subcategory)
    
    if district:
        sql += " AND r.district = %s"
        query_params.append(district)
    
    if query:
        sql += " AND (r.title ILIKE %s OR r.description ILIKE %s)"
        search_term = f'%{query}%'
        query_params.extend([search_term, search_term])
    
    sql += " ORDER BY r.created_at DESC LIMIT %s OFFSET %s"
    query_params.extend([limit, offset])
    
    cur.execute(sql, query_params)
    requests_data = cur.fetchall()
    
    result = []
    for req in requests_data:
        req_dict = dict(req)
        if isinstance(req_dict.get('price_per_unit'), Decimal):
            req_dict['price_per_unit'] = float(req_dict['price_per_unit'])
        
        # Преобразуем snake_case в camelCase для фронтенда
        req_dict['userId'] = req_dict.pop('user_id', None)
        req_dict['pricePerUnit'] = req_dict.pop('price_per_unit', None)
        req_dict['fullAddress'] = req_dict.pop('full_address', None)
        req_dict['createdAt'] = req_dict.pop('created_at').isoformat() if req_dict.get('created_at') else None
        req_dict['updatedAt'] = req_dict.pop('updated_at').isoformat() if req_dict.get('updated_at') else None
        
        result.append(req_dict)
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'requests': result, 'total': len(result)}),
        'isBase64Encoded': False
    }

def get_request_by_id(request_id: str, headers: Dict[str, str]) -> Dict[str, Any]:
    """Получить запрос по ID"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    sql = """
        SELECT 
            r.*,
            COALESCE(
                json_agg(
                    json_build_object('id', ri.id, 'url', ri.url, 'alt', ri.alt)
                    ORDER BY rir.sort_order
                ) FILTER (WHERE ri.id IS NOT NULL),
                '[]'
            ) as images
        FROM t_p42562714_web_app_creation_1.requests r
        LEFT JOIN t_p42562714_web_app_creation_1.request_image_relations rir ON r.id = rir.request_id
        LEFT JOIN t_p42562714_web_app_creation_1.offer_images ri ON rir.image_id = ri.id
        WHERE r.id = %s AND r.status != 'deleted'
        GROUP BY r.id
    """
    
    cur.execute(sql, (request_id,))
    req = cur.fetchone()
    
    cur.close()
    conn.close()
    
    if not req:
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': 'Request not found'}),
            'isBase64Encoded': False
        }
    
    req_dict = dict(req)
    if isinstance(req_dict.get('price_per_unit'), Decimal):
        req_dict['price_per_unit'] = float(req_dict['price_per_unit'])
    
    # Преобразуем snake_case в camelCase для фронтенда
    req_dict['userId'] = req_dict.pop('user_id', None)
    req_dict['pricePerUnit'] = req_dict.pop('price_per_unit', None)
    req_dict['fullAddress'] = req_dict.pop('full_address', None)
    req_dict['createdAt'] = req_dict.pop('created_at').isoformat() if req_dict.get('created_at') else None
    req_dict['updatedAt'] = req_dict.pop('updated_at').isoformat() if req_dict.get('updated_at') else None
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(req_dict),
        'isBase64Encoded': False
    }

def create_request(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Создать новый запрос"""
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
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    sql = """
        INSERT INTO t_p42562714_web_app_creation_1.requests (
            user_id, title, description, category, subcategory,
            quantity, unit, price_per_unit, has_vat, vat_rate,
            district, delivery_address, available_districts,
            is_premium, status
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, created_at
    """
    
    cur.execute(sql, (
        user_id,
        body['title'],
        body['description'],
        body['category'],
        body.get('subcategory'),
        body['quantity'],
        body['unit'],
        body['pricePerUnit'],
        body.get('hasVAT', False),
        body.get('vatRate'),
        body['district'],
        body.get('deliveryAddress'),
        body['availableDistricts'],
        body.get('isPremium', False),
        body.get('status', 'active')
    ))
    
    result = cur.fetchone()
    request_id = result['id']
    
    if body.get('images'):
        for idx, img in enumerate(body['images']):
            cur.execute(
                "INSERT INTO t_p42562714_web_app_creation_1.offer_images (url, alt) VALUES (%s, %s) RETURNING id",
                (img['url'], img.get('alt', ''))
            )
            image_id = cur.fetchone()['id']
            cur.execute(
                "INSERT INTO t_p42562714_web_app_creation_1.request_image_relations (request_id, image_id, sort_order) VALUES (%s, %s, %s)",
                (request_id, image_id, idx)
            )
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 201,
        'headers': headers,
        'body': json.dumps({'id': str(request_id), 'message': 'Request created successfully'}),
        'isBase64Encoded': False
    }

def update_request(request_id: str, event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Обновить запрос"""
    body = json.loads(event.get('body', '{}'))
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    sql = """
        UPDATE requests SET
            title = %s,
            description = %s,
            quantity = %s,
            price_per_unit = %s,
            status = %s,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
    """
    
    cur.execute(sql, (
        body.get('title'),
        body.get('description'),
        body.get('quantity'),
        body.get('pricePerUnit'),
        body.get('status'),
        request_id
    ))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'message': 'Request updated successfully'}),
        'isBase64Encoded': False
    }

def delete_request(request_id: str, headers: Dict[str, str]) -> Dict[str, Any]:
    """Мягкое удаление запроса (меняем статус на deleted)"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        sql = """
            UPDATE t_p42562714_web_app_creation_1.requests 
            SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """
        
        cur.execute(sql, (request_id,))
        
        if cur.rowcount == 0:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'Request not found'}),
                'isBase64Encoded': False
            }
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'Request deleted successfully'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        print(f"Error deleting request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Failed to delete request: {str(e)}'}),
            'isBase64Encoded': False
        }