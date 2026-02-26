'''API для работы с запросами - обновлено для JWT'''
import json
import os
import http.client
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
            query_params = event.get('queryStringParameters', {}) or {}
            request_id = query_params.get('id')
            if not request_id:
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

    # Авто-архивация истёкших запросов
    cur.execute("""
        UPDATE t_p42562714_web_app_creation_1.requests
        SET status = 'archived', updated_at = NOW()
        WHERE status = 'active'
          AND expiry_date IS NOT NULL
          AND expiry_date < NOW()
        RETURNING user_id, title
    """)
    expired_requests = cur.fetchall()
    conn.commit()

    # Авто-закрытие запросов принятых в работу
    cur.execute("""
        UPDATE t_p42562714_web_app_creation_1.requests
        SET status = 'closed', updated_at = NOW()
        WHERE status = 'active'
          AND EXISTS (
              SELECT 1 FROM t_p42562714_web_app_creation_1.orders o
              WHERE o.offer_id = requests.id
                AND o.status = 'accepted'
          )
        RETURNING user_id, title
    """)
    accepted_requests = cur.fetchall()
    conn.commit()

    # Уведомляем владельцев о закрытии принятых запросов
    for row in accepted_requests:
        try:
            payload = json.dumps({
                'userId': row['user_id'],
                'title': 'Запрос закрыт — исполнитель найден',
                'message': f'Запрос «{row["title"]}» скрыт из публичного списка, так как по нему принят исполнитель.',
                'url': '/my-orders?tab=my-requests'
            })
            for endpoint in ['/d49f8584-6ef9-47c0-9661-02560166e10f', '/3c4b3e64-cb71-4b82-abd5-e67393be3d43']:
                try:
                    conn2 = http.client.HTTPSConnection('functions.poehali.dev', timeout=3)
                    conn2.request('POST', endpoint, payload, {'Content-Type': 'application/json'})
                    conn2.getresponse().read()
                    conn2.close()
                except Exception:
                    pass
        except Exception as e:
            print(f'[ACCEPTED] Notification error: {e}')

    # Уведомляем владельцев об архивации
    for row in expired_requests:
        try:
            payload = json.dumps({
                'userId': row['user_id'],
                'title': 'Запрос снят с публикации',
                'message': f'Срок публикации запроса «{row["title"]}» истёк. Перейдите в «Мои запросы» чтобы опубликовать снова.',
                'url': '/my-requests'
            })
            for endpoint in ['/d49f8584-6ef9-47c0-9661-02560166e10f', '/3c4b3e64-cb71-4b82-abd5-e67393be3d43']:
                try:
                    conn2 = http.client.HTTPSConnection('functions.poehali.dev', timeout=3)
                    conn2.request('POST', endpoint, payload, {'Content-Type': 'application/json'})
                    conn2.getresponse().read()
                    conn2.close()
                except Exception:
                    pass
        except Exception as e:
            print(f'[EXPIRY] Notification error: {e}')
    
    sql = """
        SELECT 
            r.*,
            '[]'::json as images,
            (SELECT COUNT(*) FROM t_p42562714_web_app_creation_1.orders o 
             WHERE o.offer_id = r.id AND o.status NOT IN ('cancelled')
            ) as responses
        FROM t_p42562714_web_app_creation_1.requests r
        WHERE r.status != 'deleted' AND r.status != 'archived' AND r.status != 'closed'
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
        if isinstance(req_dict.get('budget'), Decimal):
            req_dict['budget'] = float(req_dict['budget'])
        
        # Преобразуем snake_case в camelCase для фронтенда
        created_at = req_dict.pop('created_at', None)
        updated_at = req_dict.pop('updated_at', None)
        expiry_date = req_dict.pop('expiry_date', None)
        deadline_start = req_dict.pop('deadline_start', None)
        deadline_end = req_dict.pop('deadline_end', None)
        
        req_dict['userId'] = str(req_dict.pop('user_id', None))
        req_dict['pricePerUnit'] = req_dict.pop('price_per_unit', None)
        req_dict['fullAddress'] = req_dict.pop('full_address', None)
        req_dict['deliveryAddress'] = req_dict.pop('delivery_address', None)
        req_dict['negotiableDeadline'] = req_dict.pop('negotiable_deadline', None)
        req_dict['negotiableBudget'] = req_dict.pop('negotiable_budget', None)
        req_dict['negotiableQuantity'] = req_dict.pop('negotiable_quantity', None)
        req_dict['negotiablePrice'] = req_dict.pop('negotiable_price', None)
        req_dict['createdAt'] = created_at.isoformat() if created_at else None
        req_dict['updatedAt'] = updated_at.isoformat() if updated_at else None
        req_dict['expiryDate'] = expiry_date.isoformat() if expiry_date else None
        req_dict['deadlineStart'] = deadline_start.isoformat() if deadline_start else None
        req_dict['deadlineEnd'] = deadline_end.isoformat() if deadline_end else None
        
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
            ) as images,
            v.id as video_db_id,
            v.url as video_url,
            v.thumbnail as video_thumbnail,
            (SELECT COUNT(*) FROM t_p42562714_web_app_creation_1.orders o 
             WHERE o.offer_id = r.id AND o.status NOT IN ('cancelled')
            ) as responses,
            COALESCE(u.company_name, TRIM(CONCAT(u.first_name, ' ', u.last_name))) as author_name,
            u.is_verified as author_is_verified
        FROM t_p42562714_web_app_creation_1.requests r
        LEFT JOIN t_p42562714_web_app_creation_1.request_image_relations rir ON r.id = rir.request_id
        LEFT JOIN t_p42562714_web_app_creation_1.offer_images ri ON rir.image_id = ri.id
        LEFT JOIN t_p42562714_web_app_creation_1.offer_videos v ON r.video_id = v.id
        LEFT JOIN t_p42562714_web_app_creation_1.users u ON r.user_id = u.id
        WHERE r.id = %s AND r.status != 'deleted'
        GROUP BY r.id, v.id, v.url, v.thumbnail, u.company_name, u.first_name, u.last_name, u.is_verified
    """
    
    cur.execute(sql, (request_id,))
    req = cur.fetchone()
    
    if req:
        cur.execute(
            "UPDATE t_p42562714_web_app_creation_1.requests SET views = COALESCE(views, 0) + 1 WHERE id = %s",
            (request_id,)
        )
        conn.commit()
    
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
    
    video_url = req_dict.pop('video_url', None)
    video_thumbnail = req_dict.pop('video_thumbnail', None)
    video_db_id = req_dict.pop('video_db_id', None)
    if video_url:
        req_dict['video'] = {'id': str(video_db_id), 'url': video_url, 'thumbnail': video_thumbnail}
    else:
        req_dict['video'] = None
    if isinstance(req_dict.get('price_per_unit'), Decimal):
        req_dict['price_per_unit'] = float(req_dict['price_per_unit'])
    if isinstance(req_dict.get('budget'), Decimal):
        req_dict['budget'] = float(req_dict['budget'])
    
    # Преобразуем snake_case в camelCase для фронтенда
    created_at = req_dict.pop('created_at', None)
    updated_at = req_dict.pop('updated_at', None)
    expiry_date = req_dict.pop('expiry_date', None)
    deadline_start = req_dict.pop('deadline_start', None)
    deadline_end = req_dict.pop('deadline_end', None)
    
    req_dict['userId'] = str(req_dict.pop('user_id', None))
    req_dict['authorName'] = req_dict.pop('author_name', None)
    req_dict['authorIsVerified'] = req_dict.pop('author_is_verified', False)
    req_dict['pricePerUnit'] = req_dict.pop('price_per_unit', None)
    req_dict['fullAddress'] = req_dict.pop('full_address', None)
    req_dict['deliveryAddress'] = req_dict.pop('delivery_address', None)
    req_dict['negotiableDeadline'] = req_dict.pop('negotiable_deadline', None)
    req_dict['negotiableBudget'] = req_dict.pop('negotiable_budget', None)
    req_dict['negotiableQuantity'] = req_dict.pop('negotiable_quantity', None)
    req_dict['negotiablePrice'] = req_dict.pop('negotiable_price', None)
    req_dict['createdAt'] = created_at.isoformat() if created_at else None
    req_dict['updatedAt'] = updated_at.isoformat() if updated_at else None
    req_dict['expiryDate'] = expiry_date.isoformat() if expiry_date else None
    req_dict['deadlineStart'] = deadline_start.isoformat() if deadline_start else None
    req_dict['deadlineEnd'] = deadline_end.isoformat() if deadline_end else None
    
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
            is_premium, status,
            deadline_start, deadline_end, negotiable_deadline, budget, negotiable_budget,
            negotiable_quantity, negotiable_price
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
        body.get('status', 'active'),
        body.get('deadlineStart'),
        body.get('deadlineEnd'),
        body.get('negotiableDeadline', False),
        body.get('budget'),
        body.get('negotiableBudget', False),
        body.get('negotiableQuantity', False),
        body.get('negotiablePrice', False)
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
    """Обновить запрос (только автор может редактировать)"""
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

    cur.execute(
        "SELECT user_id FROM t_p42562714_web_app_creation_1.requests WHERE id = %s AND status != 'deleted'",
        (request_id,)
    )
    row = cur.fetchone()
    if not row:
        cur.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': 'Request not found'}),
            'isBase64Encoded': False
        }

    if str(row['user_id']) != str(user_id):
        cur.close()
        conn.close()
        return {
            'statusCode': 403,
            'headers': headers,
            'body': json.dumps({'error': 'Access denied'}),
            'isBase64Encoded': False
        }

    updates = []
    params: List[Any] = []

    field_map = {
        'description': 'description',
        'pricePerUnit': 'price_per_unit',
        'negotiablePrice': 'negotiable_price',
        'hasVAT': 'has_vat',
        'vatRate': 'vat_rate',
        'title': 'title',
        'status': 'status',
        'quantity': 'quantity',
        'unit': 'unit',
        'budget': 'budget',
        'negotiableBudget': 'negotiable_budget',
    }

    for js_key, db_col in field_map.items():
        if js_key in body:
            updates.append(f"{db_col} = %s")
            params.append(body[js_key])

    images_changed = 'images' in body
    video_changed = 'video' in body

    if not updates and not images_changed and not video_changed:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'No fields to update'}),
            'isBase64Encoded': False
        }

    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(request_id)
        sql = f"UPDATE t_p42562714_web_app_creation_1.requests SET {', '.join(updates)} WHERE id = %s"
        cur.execute(sql, params)

    SCHEMA = 't_p42562714_web_app_creation_1'

    if images_changed:
        cur.execute(
            f"DELETE FROM {SCHEMA}.request_image_relations WHERE request_id = %s",
            (request_id,)
        )
        new_images = body.get('images') or []
        for idx, img in enumerate(new_images):
            url = img.get('url', '') if isinstance(img, dict) else str(img)
            alt = img.get('alt', '') if isinstance(img, dict) else ''
            if not url:
                continue
            cur.execute(
                f"SELECT id FROM {SCHEMA}.offer_images WHERE url = %s",
                (url,)
            )
            existing = cur.fetchone()
            if existing:
                image_id = existing['id']
            else:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.offer_images (url, alt) VALUES (%s, %s) RETURNING id",
                    (url, alt)
                )
                image_id = cur.fetchone()['id']
            cur.execute(
                f"INSERT INTO {SCHEMA}.request_image_relations (request_id, image_id, sort_order) VALUES (%s, %s, %s)",
                (request_id, image_id, idx)
            )

    if video_changed:
        video_data = body.get('video')
        if video_data and isinstance(video_data, dict) and video_data.get('url'):
            cur.execute(
                f"SELECT id FROM {SCHEMA}.offer_videos WHERE url = %s",
                (video_data['url'],)
            )
            existing_vid = cur.fetchone()
            if existing_vid:
                video_id = existing_vid['id']
            else:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.offer_videos (url, thumbnail) VALUES (%s, %s) RETURNING id",
                    (video_data['url'], video_data.get('thumbnail', ''))
                )
                video_id = cur.fetchone()['id']
            cur.execute(
                f"UPDATE {SCHEMA}.requests SET video_id = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                (video_id, request_id)
            )
        else:
            cur.execute(
                f"UPDATE {SCHEMA}.requests SET video_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                (request_id,)
            )

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