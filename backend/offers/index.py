import json
import os
import base64
from typing import Dict, Any, Optional, List
from datetime import datetime
from decimal import Decimal
from io import BytesIO
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3
from PIL import Image


def decimal_default(obj):
    """Конвертер для json.dumps - преобразует Decimal в float"""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


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
            action = query_params.get('action')
            
            # Специальный эндпоинт для миграции изображений
            if action == 'migrate-images':
                return migrate_images_to_s3(headers)
            elif action == 'migration-status':
                return get_migration_status(headers)
            elif offer_id:
                return get_offer_by_id(offer_id, headers)
            else:
                return get_offers_list(event, headers)
        
        elif method == 'POST':
            return create_offer(event, headers)
        
        elif method == 'PUT':
            query_params = event.get('queryStringParameters', {}) or {}
            offer_id = query_params.get('id')
            if not offer_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Offer ID required in query params'}),
                    'isBase64Encoded': False
                }
            return update_offer(offer_id, event, headers)
        
        else:
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'}, default=decimal_default),
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
            'body': json.dumps({'error': str(e)}, default=decimal_default),
            'isBase64Encoded': False
        }

def get_offers_list(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Получить список предложений с фильтрами"""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        sql = "SELECT id, title, description, category, district, price_per_unit, quantity, unit, created_at FROM t_p42562714_web_app_creation_1.offers WHERE status = 'active' ORDER BY created_at DESC LIMIT 100"
        
        cur.execute(sql)
        offers = cur.fetchall()
        
        images_map = {}
        if len(offers) > 0:
            offer_ids = [str(offer['id']) for offer in offers]
            ids_list = ','.join([f"'{oid}'" for oid in offer_ids])
            # Загружаем только CDN изображения (которые уже мигрированы в S3)
            images_sql = f"SELECT DISTINCT ON (oir.offer_id) oir.offer_id, oi.id, oi.url FROM t_p42562714_web_app_creation_1.offer_image_relations oir JOIN t_p42562714_web_app_creation_1.offer_images oi ON oir.image_id = oi.id WHERE oir.offer_id IN ({ids_list}) AND oi.url LIKE 'https://%' ORDER BY oir.offer_id, oir.sort_order"
            
            cur.execute(images_sql)
            images_results = cur.fetchall()
            
            for img_row in images_results:
                images_map[img_row['offer_id']] = [{'id': str(img_row['id']), 'url': img_row['url'], 'alt': ''}]
        
        result = []
        for offer in offers:
            result.append({
                'id': str(offer['id']),
                'title': offer['title'],
                'description': offer.get('description', ''),
                'category': offer.get('category'),
                'district': offer.get('district'),
                'quantity': offer.get('quantity'),
                'unit': offer.get('unit'),
                'pricePerUnit': float(offer['price_per_unit']) if offer.get('price_per_unit') else None,
                'createdAt': offer['created_at'].isoformat() if offer.get('created_at') else None,
                'images': images_map.get(offer['id'], [])
            })
        
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
            'body': json.dumps({'error': str(e), 'trace': error_trace}, default=decimal_default),
            'isBase64Encoded': False
        }

def get_offer_by_id(offer_id: str, headers: Dict[str, str]) -> Dict[str, Any]:
    """Получить предложение по ID"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    offer_id_escaped = offer_id.replace("'", "''")
    sql = f"""
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
        WHERE o.id = '{offer_id_escaped}'
        GROUP BY o.id, u.id
    """
    
    cur.execute(sql)
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
    
    # Конвертация дат
    created_at = offer_dict.pop('created_at', None)
    offer_dict['createdAt'] = created_at.isoformat() if created_at else None
    
    updated_at = offer_dict.pop('updated_at', None)
    offer_dict['updatedAt'] = updated_at.isoformat() if updated_at else None
    
    offer_dict['userId'] = offer_dict.pop('user_id', None)
    
    # Конвертация Decimal в float
    price_per_unit = offer_dict.pop('price_per_unit', None)
    offer_dict['pricePerUnit'] = float(price_per_unit) if price_per_unit is not None else None
    
    offer_dict['minOrderQuantity'] = offer_dict.pop('min_order_quantity', None)
    offer_dict['hasVAT'] = offer_dict.pop('has_vat', False)
    
    vat_rate = offer_dict.pop('vat_rate', None)
    offer_dict['vatRate'] = float(vat_rate) if vat_rate is not None else None
    
    offer_dict['fullAddress'] = offer_dict.pop('full_address', None)
    offer_dict['availableDistricts'] = offer_dict.pop('available_districts', [])
    offer_dict['availableDeliveryTypes'] = offer_dict.pop('available_delivery_types', [])
    offer_dict['isPremium'] = offer_dict.pop('is_premium', False)
    seller_name = offer_dict.pop('seller_name', None)
    seller_type = offer_dict.pop('seller_type', None)
    seller_phone = offer_dict.pop('seller_phone', None)
    seller_email = offer_dict.pop('seller_email', None)
    
    seller_rating = offer_dict.pop('seller_rating', None)
    seller_rating = float(seller_rating) if seller_rating is not None else None
    
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
        'body': json.dumps(offer_dict, default=decimal_default),
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
            'body': json.dumps({'error': 'User ID required'}, default=decimal_default),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Escape strings
    user_id_esc = str(user_id).replace("'", "''")
    title_esc = body['title'].replace("'", "''")
    description_esc = body['description'].replace("'", "''")
    category_esc = body['category'].replace("'", "''")
    subcategory_esc = body.get('subcategory', '').replace("'", "''") if body.get('subcategory') else None
    unit_esc = body['unit'].replace("'", "''")
    location_esc = body.get('location', '').replace("'", "''") if body.get('location') else None
    district_esc = body['district'].replace("'", "''")
    full_address_esc = body.get('fullAddress', '').replace("'", "''") if body.get('fullAddress') else None
    
    # Arrays to JSON strings
    available_districts_json = json.dumps(body['availableDistricts']).replace("'", "''")
    available_delivery_types_json = json.dumps(body.get('availableDeliveryTypes', ['pickup'])).replace("'", "''")
    
    sql = f"""
        INSERT INTO t_p42562714_web_app_creation_1.offers (
            user_id, title, description, category, subcategory,
            quantity, unit, price_per_unit, has_vat, vat_rate,
            location, district, full_address, available_districts,
            available_delivery_types, is_premium, status
        ) VALUES (
            '{user_id_esc}', 
            '{title_esc}', 
            '{description_esc}', 
            '{category_esc}', 
            {'NULL' if subcategory_esc is None else f"'{subcategory_esc}'"},
            {body['quantity']}, 
            '{unit_esc}', 
            {body['pricePerUnit']}, 
            {body.get('hasVAT', False)}, 
            {body.get('vatRate') if body.get('vatRate') is not None else 'NULL'},
            {'NULL' if location_esc is None else f"'{location_esc}'"},
            '{district_esc}', 
            {'NULL' if full_address_esc is None else f"'{full_address_esc}'"},
            '{available_districts_json}'::jsonb,
            '{available_delivery_types_json}'::jsonb,
            {body.get('isPremium', False)}, 
            '{body.get('status', 'active')}'
        )
        RETURNING id, created_at
    """
    
    cur.execute(sql)
    
    result = cur.fetchone()
    offer_id = result['id']
    
    if body.get('images'):
        for idx, img in enumerate(body['images']):
            url_esc = img['url'].replace("'", "''")
            alt_esc = img.get('alt', '').replace("'", "''")
            cur.execute(
                f"INSERT INTO t_p42562714_web_app_creation_1.offer_images (url, alt) VALUES ('{url_esc}', '{alt_esc}') RETURNING id"
            )
            image_id = cur.fetchone()['id']
            cur.execute(
                f"INSERT INTO t_p42562714_web_app_creation_1.offer_image_relations (offer_id, image_id, sort_order) VALUES ('{offer_id}', '{image_id}', {idx})"
            )
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 201,
        'headers': headers,
        'body': json.dumps({'id': str(offer_id), 'message': 'Offer created successfully'}, default=decimal_default),
        'isBase64Encoded': False
    }

def update_offer(offer_id: str, event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Обновить предложение"""
    body = json.loads(event.get('body', '{}'))
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    updates = []
    
    if 'title' in body:
        title_esc = body['title'].replace("'", "''")
        updates.append(f"title = '{title_esc}'")
    
    if 'description' in body:
        desc_esc = body['description'].replace("'", "''")
        updates.append(f"description = '{desc_esc}'")
    
    if 'quantity' in body:
        updates.append(f"quantity = {body['quantity']}")
    
    if 'pricePerUnit' in body:
        updates.append(f"price_per_unit = {body['pricePerUnit']}")
    
    if 'status' in body:
        status_esc = body['status'].replace("'", "''")
        updates.append(f"status = '{status_esc}'")
    
    if not updates:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'No fields to update'}, default=decimal_default),
            'isBase64Encoded': False
        }
    
    updates.append("updated_at = CURRENT_TIMESTAMP")
    offer_id_esc = offer_id.replace("'", "''")
    
    sql = f"UPDATE t_p42562714_web_app_creation_1.offers SET {', '.join(updates)} WHERE id = '{offer_id_esc}'"
    
    cur.execute(sql)
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'message': 'Offer updated successfully'}, default=decimal_default),
        'isBase64Encoded': False
    }

def optimize_image(image_data: bytes, max_width: int = 800, quality: int = 85) -> bytes:
    """Оптимизация изображения: resize + сжатие"""
    img = Image.open(BytesIO(image_data))
    
    if img.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'P':
            img = img.convert('RGBA')
        background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
        img = background
    
    if img.width > max_width:
        ratio = max_width / img.width
        new_height = int(img.height * ratio)
        img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
    
    output = BytesIO()
    img.save(output, format='JPEG', quality=quality, optimize=True)
    return output.getvalue()

def migrate_images_to_s3(headers: Dict[str, str]) -> Dict[str, Any]:
    """Миграция base64 изображений в S3 с оптимизацией"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    s3 = boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    
    cur.execute("SELECT id, url FROM t_p42562714_web_app_creation_1.offer_images WHERE url LIKE 'data:image%' LIMIT 10")
    images = cur.fetchall()
    
    migrated_count = 0
    errors = []
    
    for img in images:
        try:
            data_url = img['url']
            header, base64_data = data_url.split(',', 1)
            image_data = base64.b64decode(base64_data)
            optimized_data = optimize_image(image_data)
            
            s3_key = f"offer-images/{img['id']}.jpg"
            s3.put_object(Bucket='files', Key=s3_key, Body=optimized_data, ContentType='image/jpeg')
            
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{s3_key}"
            cdn_url_esc = cdn_url.replace("'", "''")
            img_id_esc = str(img['id']).replace("'", "''")
            
            cur.execute(f"UPDATE t_p42562714_web_app_creation_1.offer_images SET url = '{cdn_url_esc}' WHERE id = '{img_id_esc}'")
            migrated_count += 1
            
        except Exception as e:
            errors.append({'id': str(img['id']), 'error': str(e)})
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'migrated': migrated_count, 'errors': errors}),
        'isBase64Encoded': False
    }

def get_migration_status(headers: Dict[str, str]) -> Dict[str, Any]:
    """Получить статус миграции изображений"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("SELECT COUNT(*) as count FROM t_p42562714_web_app_creation_1.offer_images WHERE url LIKE 'data:image%'")
    base64_count = cur.fetchone()['count']
    
    cur.execute("SELECT COUNT(*) as count FROM t_p42562714_web_app_creation_1.offer_images WHERE url LIKE 'https://%'")
    cdn_count = cur.fetchone()['count']
    
    cur.close()
    conn.close()
    
    total = base64_count + cdn_count
    progress = (cdn_count / total * 100) if total > 0 else 0
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'total': total,
            'base64': base64_count,
            'cdn': cdn_count,
            'progress': round(progress, 2)
        }),
        'isBase64Encoded': False
    }