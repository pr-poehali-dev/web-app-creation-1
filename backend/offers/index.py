import json
import os
from typing import Dict, Any, Optional, List
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor


def get_db_connection():
    """Подключение к базе данных"""
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    API для работы с предложениями (offers)
    GET / - получить список предложений с фильтрами
    GET /{id} - получить предложение по ID
    POST / - создать новое предложение
    PUT /{id} - обновить предложение
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
            # Проверяем query параметр id для получения одного предложения
            query_params = event.get('queryStringParameters', {}) or {}
            offer_id = query_params.get('id')
            
            if offer_id:
                return get_offer_by_id(offer_id, headers)
            else:
                return get_offers_list(event, headers)
        
        elif method == 'POST':
            return create_offer(event, headers)
        
        elif method == 'PUT':
            path_params = event.get('pathParams', {})
            offer_id = path_params.get('id')
            if not offer_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Offer ID required'}),
                    'isBase64Encoded': False
                }
            return update_offer(offer_id, event, headers)
        
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
        print(f'ERROR in offers handler: {str(e)}')
        print(f'Traceback: {error_trace}')
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }

def get_offers_list(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Получить список предложений с фильтрами"""
    try:
        params = event.get('queryStringParameters', {}) or {}
        
        category = params.get('category', '')
        subcategory = params.get('subcategory', '')
        district = params.get('district', '')
        query = params.get('query', '')
        status = params.get('status', 'active')
        limit = min(int(params.get('limit', '20')), 100)
        offset = int(params.get('offset', '0'))
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        sql = """
            SELECT 
                o.id, o.user_id, o.title, 
                COALESCE(SUBSTRING(o.description, 1, 200), '') as description, 
                o.category, o.subcategory,
                o.quantity, o.unit, o.price_per_unit, o.has_vat, o.vat_rate,
                o.district, o.available_districts, o.available_delivery_types,
                o.is_premium, o.status, o.created_at, o.updated_at,
                '' as seller_name,
                '' as seller_type,
                5.0 as seller_rating,
                0 as seller_reviews_count,
                false as seller_is_verified
            FROM t_p42562714_web_app_creation_1.offers o
            WHERE 1=1
        """
        
        query_params = []
        
        if status and status != 'all':
            sql += " AND o.status = %s"
            query_params.append(status)
        
        if category:
            sql += " AND o.category = %s"
            query_params.append(category)
        
        if subcategory:
            sql += " AND o.subcategory = %s"
            query_params.append(subcategory)
        
        if district:
            sql += " AND o.district = %s"
            query_params.append(district)
        
        if query:
            sql += " AND (o.title ILIKE %s OR o.description ILIKE %s)"
            search_term = f'%{query}%'
            query_params.extend([search_term, search_term])
        
        sql += " ORDER BY o.created_at DESC LIMIT %s OFFSET %s"
        query_params.extend([limit, offset])
        
        cur.execute(sql, query_params)
        offers = cur.fetchall()
        
        # Получаем ID всех предложений (конвертируем в строки для SQL)
        offer_ids = [str(offer['id']) for offer in offers]
        
        # Загружаем только первое изображение для каждого предложения (для списка)
        images_map = {}
        if offer_ids:
            placeholders = ','.join(['%s'] * len(offer_ids))
            images_sql = f"""
                SELECT DISTINCT ON (oir.offer_id)
                    oir.offer_id,
                    json_build_object('id', oi.id, 'url', oi.url, 'alt', oi.alt) as first_image
                FROM t_p42562714_web_app_creation_1.offer_image_relations oir
                LEFT JOIN t_p42562714_web_app_creation_1.offer_images oi ON oir.image_id = oi.id
                WHERE oir.offer_id IN ({placeholders}) AND oi.id IS NOT NULL
                ORDER BY oir.offer_id, oir.sort_order
            """
            cur.execute(images_sql, offer_ids)
            images_results = cur.fetchall()
            for img_row in images_results:
                images_map[img_row['offer_id']] = [img_row['first_image']]
        
        result = []
        for offer in offers:
            offer_dict = dict(offer)
            offer_dict['createdAt'] = offer_dict.pop('created_at').isoformat() if offer_dict.get('created_at') else None
            offer_dict['updatedAt'] = offer_dict.pop('updated_at').isoformat() if offer_dict.get('updated_at') else None
            offer_dict['userId'] = offer_dict.pop('user_id', None)
            offer_dict['pricePerUnit'] = float(offer_dict.pop('price_per_unit')) if offer_dict.get('price_per_unit') else None
            offer_dict['hasVAT'] = offer_dict.pop('has_vat', False)
            offer_dict['vatRate'] = float(offer_dict.pop('vat_rate')) if offer_dict.get('vat_rate') else None
            # fullAddress убрали из списка для экономии размера ответа
            offer_dict['availableDistricts'] = offer_dict.pop('available_districts', [])
            offer_dict['availableDeliveryTypes'] = offer_dict.pop('available_delivery_types', [])
            offer_dict['isPremium'] = offer_dict.pop('is_premium', False)
            offer_dict['sellerName'] = offer_dict.pop('seller_name', None)
            offer_dict['sellerType'] = offer_dict.pop('seller_type', None)
            # sellerPhone и sellerEmail убрали для экономии размера
            offer_dict['sellerRating'] = float(offer_dict.pop('seller_rating')) if offer_dict.get('seller_rating') else None
            offer_dict['sellerReviewsCount'] = offer_dict.pop('seller_reviews_count', 0)
            offer_dict['sellerIsVerified'] = offer_dict.pop('seller_is_verified', False)
            # Добавляем изображения из карты
            offer_dict['images'] = images_map.get(offer_dict['id'], [])
            result.append(offer_dict)
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'offers': result, 'total': len(result)}),
            'isBase64Encoded': False
        }
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f'ERROR in get_offers_list: {str(e)}')
        print(f'Traceback: {error_trace}')
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e), 'trace': error_trace}),
            'isBase64Encoded': False
        }

def get_offer_by_id(offer_id: str, headers: Dict[str, str]) -> Dict[str, Any]:
    """Получить предложение по ID"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    sql = """
        SELECT 
            o.*,
            CONCAT(u.first_name, ' ', u.last_name) as seller_name,
            u.user_type as seller_type,
            u.phone as seller_phone,
            u.email as seller_email,
            5.0 as seller_rating,
            0 as seller_reviews_count,
            CASE WHEN u.verification_status = 'approved' THEN TRUE ELSE FALSE END as seller_is_verified,
            COALESCE(
                json_agg(
                    json_build_object('id', oi.id, 'url', oi.url, 'alt', oi.alt)
                    ORDER BY oir.sort_order
                ) FILTER (WHERE oi.id IS NOT NULL),
                '[]'
            ) as images
        FROM t_p42562714_web_app_creation_1.offers o
        LEFT JOIN t_p42562714_web_app_creation_1.users u ON o.user_id = u.id
        LEFT JOIN t_p42562714_web_app_creation_1.offer_image_relations oir ON o.id = oir.offer_id
        LEFT JOIN t_p42562714_web_app_creation_1.offer_images oi ON oir.image_id = oi.id
        WHERE o.id = %s
        GROUP BY o.id, u.id
    """
    
    cur.execute(sql, (offer_id,))
    offer = cur.fetchone()
    
    cur.close()
    conn.close()
    
    if not offer:
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': 'Offer not found'}),
            'isBase64Encoded': False
        }
    
    offer_dict = dict(offer)
    offer_dict['createdAt'] = offer_dict.pop('created_at').isoformat() if offer_dict.get('created_at') else None
    offer_dict['updatedAt'] = offer_dict.pop('updated_at').isoformat() if offer_dict.get('updated_at') else None
    offer_dict['userId'] = offer_dict.pop('user_id', None)
    offer_dict['pricePerUnit'] = float(offer_dict.pop('price_per_unit')) if offer_dict.get('price_per_unit') else None
    offer_dict['minOrderQuantity'] = offer_dict.pop('min_order_quantity', None)
    offer_dict['hasVAT'] = offer_dict.pop('has_vat', False)
    offer_dict['vatRate'] = float(offer_dict.pop('vat_rate')) if offer_dict.get('vat_rate') else None
    offer_dict['fullAddress'] = offer_dict.pop('full_address', None)
    offer_dict['availableDistricts'] = offer_dict.pop('available_districts', [])
    offer_dict['availableDeliveryTypes'] = offer_dict.pop('available_delivery_types', [])
    offer_dict['isPremium'] = offer_dict.pop('is_premium', False)
    seller_name = offer_dict.pop('seller_name', None)
    seller_type = offer_dict.pop('seller_type', None)
    seller_phone = offer_dict.pop('seller_phone', None)
    seller_email = offer_dict.pop('seller_email', None)
    seller_rating = float(offer_dict.pop('seller_rating')) if offer_dict.get('seller_rating') else None
    seller_reviews_count = offer_dict.pop('seller_reviews_count', 0)
    seller_is_verified = offer_dict.pop('seller_is_verified', False)
    
    # Создаем объект seller для фронтенда
    offer_dict['seller'] = {
        'name': seller_name,
        'type': seller_type,
        'phone': seller_phone,
        'email': seller_email,
        'rating': seller_rating,
        'reviewsCount': seller_reviews_count,
        'isVerified': seller_is_verified
    }
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(offer_dict),
        'isBase64Encoded': False
    }

def create_offer(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Создать новое предложение"""
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
        INSERT INTO t_p42562714_web_app_creation_1.offers (
            user_id, title, description, category, subcategory,
            quantity, unit, price_per_unit, has_vat, vat_rate,
            location, district, full_address, available_districts,
            available_delivery_types, is_premium, status
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
        body.get('location'),
        body['district'],
        body.get('fullAddress'),
        body['availableDistricts'],
        body.get('availableDeliveryTypes', ['pickup']),
        body.get('isPremium', False),
        body.get('status', 'active')
    ))
    
    result = cur.fetchone()
    offer_id = result['id']
    
    if body.get('images'):
        for idx, img in enumerate(body['images']):
            cur.execute(
                "INSERT INTO t_p42562714_web_app_creation_1.offer_images (url, alt) VALUES (%s, %s) RETURNING id",
                (img['url'], img.get('alt', ''))
            )
            image_id = cur.fetchone()['id']
            cur.execute(
                "INSERT INTO t_p42562714_web_app_creation_1.offer_image_relations (offer_id, image_id, sort_order) VALUES (%s, %s, %s)",
                (offer_id, image_id, idx)
            )
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 201,
        'headers': headers,
        'body': json.dumps({'id': str(offer_id), 'message': 'Offer created successfully'}),
        'isBase64Encoded': False
    }

def update_offer(offer_id: str, event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Обновить предложение"""
    body = json.loads(event.get('body', '{}'))
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    updates = []
    params = []
    
    if 'title' in body:
        updates.append("title = %s")
        params.append(body['title'])
    
    if 'description' in body:
        updates.append("description = %s")
        params.append(body['description'])
    
    if 'quantity' in body:
        updates.append("quantity = %s")
        params.append(body['quantity'])
    
    if 'pricePerUnit' in body:
        updates.append("price_per_unit = %s")
        params.append(body['pricePerUnit'])
    
    if 'status' in body:
        updates.append("status = %s")
        params.append(body['status'])
    
    if not updates:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'No fields to update'}),
            'isBase64Encoded': False
        }
    
    updates.append("updated_at = CURRENT_TIMESTAMP")
    params.append(offer_id)
    
    sql = f"UPDATE t_p42562714_web_app_creation_1.offers SET {', '.join(updates)} WHERE id = %s"
    
    cur.execute(sql, params)
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'message': 'Offer updated successfully'}),
        'isBase64Encoded': False
    }