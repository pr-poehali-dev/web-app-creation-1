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
            path_params = event.get('pathParams', {})
            offer_id = path_params.get('id')
            
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
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }

def get_offers_list(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Получить список предложений с фильтрами"""
    params = event.get('queryStringParameters', {}) or {}
    
    category = params.get('category', '')
    subcategory = params.get('subcategory', '')
    district = params.get('district', '')
    query = params.get('query', '')
    status = params.get('status', 'active')
    limit = int(params.get('limit', '50'))
    offset = int(params.get('offset', '0'))
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    sql = """
        SELECT 
            o.*,
            s.name as seller_name,
            s.type as seller_type,
            s.phone as seller_phone,
            s.email as seller_email,
            s.rating as seller_rating,
            s.reviews_count as seller_reviews_count,
            s.is_verified as seller_is_verified,
            COALESCE(
                json_agg(
                    json_build_object('id', oi.id, 'url', oi.url, 'alt', oi.alt)
                    ORDER BY oir.sort_order
                ) FILTER (WHERE oi.id IS NOT NULL),
                '[]'
            ) as images
        FROM offers o
        LEFT JOIN sellers s ON o.seller_id = s.id
        LEFT JOIN offer_image_relations oir ON o.id = oir.offer_id
        LEFT JOIN offer_images oi ON oir.image_id = oi.id
        WHERE o.status = %s
    """
    
    query_params = [status]
    
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
    
    sql += " GROUP BY o.id, s.id ORDER BY o.created_at DESC LIMIT %s OFFSET %s"
    query_params.extend([limit, offset])
    
    cur.execute(sql, query_params)
    offers = cur.fetchall()
    
    result = []
    for offer in offers:
        offer_dict = dict(offer)
        offer_dict['createdAt'] = offer_dict.pop('created_at').isoformat() if offer_dict.get('created_at') else None
        offer_dict['updatedAt'] = offer_dict.pop('updated_at').isoformat() if offer_dict.get('updated_at') else None
        result.append(offer_dict)
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'offers': result, 'total': len(result)}),
        'isBase64Encoded': False
    }

def get_offer_by_id(offer_id: str, headers: Dict[str, str]) -> Dict[str, Any]:
    """Получить предложение по ID"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    sql = """
        SELECT 
            o.*,
            s.name as seller_name,
            s.type as seller_type,
            s.phone as seller_phone,
            s.email as seller_email,
            s.rating as seller_rating,
            s.reviews_count as seller_reviews_count,
            s.is_verified as seller_is_verified,
            COALESCE(
                json_agg(
                    json_build_object('id', oi.id, 'url', oi.url, 'alt', oi.alt)
                    ORDER BY oir.sort_order
                ) FILTER (WHERE oi.id IS NOT NULL),
                '[]'
            ) as images
        FROM offers o
        LEFT JOIN sellers s ON o.seller_id = s.id
        LEFT JOIN offer_image_relations oir ON o.id = oir.offer_id
        LEFT JOIN offer_images oi ON oir.image_id = oi.id
        WHERE o.id = %s
        GROUP BY o.id, s.id
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
        INSERT INTO offers (
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
                "INSERT INTO offer_images (url, alt) VALUES (%s, %s) RETURNING id",
                (img['url'], img.get('alt', ''))
            )
            image_id = cur.fetchone()['id']
            cur.execute(
                "INSERT INTO offer_image_relations (offer_id, image_id, sort_order) VALUES (%s, %s, %s)",
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
    
    sql = """
        UPDATE offers SET
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
        offer_id
    ))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'message': 'Offer updated successfully'}),
        'isBase64Encoded': False
    }
