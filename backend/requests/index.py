'''API для работы с запросами - обновлено для JWT'''
import json
import os
import http.client
import base64
import uuid
from io import BytesIO
from typing import Dict, Any, List
from datetime import datetime
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3

def get_s3_client():
    return boto3.client('s3', endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])

def upload_image_to_s3(img_url: str) -> str:
    """Если base64 — загружает в S3, возвращает CDN URL. Иначе возвращает как есть."""
    if not img_url.startswith('data:image'):
        return img_url
    try:
        from PIL import Image, ImageOps
        header, b64data = img_url.split(',', 1)
        image_data = base64.b64decode(b64data)
        img = Image.open(BytesIO(image_data))
        try:
            img = ImageOps.exif_transpose(img)
        except Exception:
            pass
        if img.mode in ('RGBA', 'LA', 'P'):
            bg = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            bg.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = bg
        if img.width > 800:
            ratio = 800 / img.width
            img = img.resize((800, int(img.height * ratio)), Image.Resampling.LANCZOS)
        output = BytesIO()
        img.save(output, format='JPEG', quality=85, optimize=True)
        optimized = output.getvalue()
        file_id = str(uuid.uuid4())
        s3_key = f"request-images/{file_id}.jpg"
        s3 = get_s3_client()
        s3.put_object(Bucket='files', Key=s3_key, Body=optimized, ContentType='image/jpeg')
        return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{s3_key}"
    except Exception as e:
        print(f"S3 upload failed: {e}")
        return img_url

def get_db_connection():
    """Подключение к базе данных"""
    return psycopg2.connect(os.environ['DATABASE_URL'])

def json_default(obj):
    """JSON serializer для специальных типов"""
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    return str(obj)

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
        import traceback
        print(f'[ERROR] {str(e)}\n{traceback.format_exc()}')
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

    # Авто-архивация истёкших запросов по expiry_date
    cur.execute("""
        UPDATE t_p42562714_web_app_creation_1.requests
        SET status = 'archived', updated_at = NOW()
        WHERE status = 'active'
          AND expiry_date IS NOT NULL
          AND expiry_date < NOW()
        RETURNING user_id, title
    """)
    expired_requests = cur.fetchall()

    # Авто-архивация запросов с истёкшим сроком поставки (deadline_end)
    cur.execute("""
        UPDATE t_p42562714_web_app_creation_1.requests
        SET status = 'archived', updated_at = NOW()
        WHERE status = 'active'
          AND deadline_end IS NOT NULL
          AND deadline_end < CURRENT_DATE
        RETURNING user_id, title
    """)
    expired_requests += cur.fetchall()
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
            COALESCE(
                (SELECT json_agg(json_build_object('id', oi.id, 'url', oi.url, 'alt', oi.alt))
                 FROM t_p42562714_web_app_creation_1.request_image_relations rir
                 JOIN t_p42562714_web_app_creation_1.offer_images oi ON rir.image_id = oi.id
                 WHERE rir.request_id = r.id),
                '[]'::json
            ) as images,
            (SELECT COUNT(*) FROM t_p42562714_web_app_creation_1.orders o 
             WHERE o.offer_id = r.id AND o.status NOT IN ('cancelled')
            ) as responses
        FROM t_p42562714_web_app_creation_1.requests r
        WHERE r.status != 'archived' AND r.status != 'closed' AND (r.is_removed IS NULL OR r.is_removed = FALSE)
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
        
        # Транспортные поля
        req_dict['transportServiceType'] = req_dict.pop('transport_service_type', None)
        req_dict['transportRoute'] = req_dict.pop('transport_route', None)
        req_dict['transportType'] = req_dict.pop('transport_type', None)
        req_dict['transportCapacity'] = req_dict.pop('transport_capacity', None)
        transport_dt = req_dict.pop('transport_date_time', None)
        req_dict['transportDateTime'] = transport_dt.isoformat() if transport_dt else None
        transport_dep_dt = req_dict.pop('transport_departure_date_time', None)
        req_dict['transportDepartureDateTime'] = transport_dep_dt.isoformat() if transport_dep_dt else None
        transport_price = req_dict.pop('transport_price', None)
        req_dict['transportPrice'] = float(transport_price) if transport_price is not None else None
        req_dict['transportPriceType'] = req_dict.pop('transport_price_type', None)
        req_dict['transportNegotiable'] = req_dict.pop('transport_negotiable', False)
        req_dict['transportComment'] = req_dict.pop('transport_comment', None)
        req_dict['transportAllDistricts'] = req_dict.pop('transport_all_districts', False)
        
        result.append(req_dict)
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'requests': result, 'total': len(result)}, default=json_default),
        'isBase64Encoded': False
    }

def get_request_by_id(request_id: str, headers: Dict[str, str]) -> Dict[str, Any]:
    """Получить запрос по ID"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    request_id_escaped = request_id.replace("'", "''")
    sql = f"""
        SELECT 
            r.id, r.user_id, r.title, r.description, r.category, r.subcategory,
            r.quantity, r.unit, r.price_per_unit, r.has_vat, r.vat_rate,
            r.district, r.delivery_address, r.available_districts, r.video_id,
            r.is_premium, r.views, r.status, r.created_at, r.updated_at,
            r.expiry_date, r.deadline_start, r.deadline_end, r.negotiable_deadline,
            r.budget, r.negotiable_budget, r.negotiable_quantity, r.negotiable_price,
            r.responses, r.deadline,
            r.transport_service_type, r.transport_route, r.transport_type, r.transport_capacity,
            r.transport_date_time, r.transport_departure_date_time, r.transport_price, r.transport_price_type,
            r.transport_negotiable, r.transport_comment, r.transport_all_districts,
            COALESCE(
                json_agg(
                    json_build_object('id', ri.id, 'url', ri.url, 'alt', ri.alt)
                ) FILTER (WHERE ri.id IS NOT NULL),
                '[]'::json
            ) as images,
            v.id as video_db_id,
            v.url as video_url,
            v.thumbnail as video_thumbnail,
            COALESCE(u.company_name, TRIM(CONCAT(u.first_name, ' ', u.last_name))) as author_name,
            CASE WHEN u.verification_status = 'approved' THEN TRUE ELSE FALSE END as author_is_verified
        FROM t_p42562714_web_app_creation_1.requests r
        LEFT JOIN t_p42562714_web_app_creation_1.request_image_relations rir ON r.id = rir.request_id
        LEFT JOIN t_p42562714_web_app_creation_1.offer_images ri ON rir.image_id = ri.id
        LEFT JOIN t_p42562714_web_app_creation_1.offer_videos v ON r.video_id = v.id
        LEFT JOIN t_p42562714_web_app_creation_1.users u ON r.user_id = u.id
        WHERE r.id = '{request_id_escaped}' AND r.status != 'deleted'
        GROUP BY r.id, r.user_id, r.title, r.description, r.category, r.subcategory,
            r.quantity, r.unit, r.price_per_unit, r.has_vat, r.vat_rate,
            r.district, r.delivery_address, r.available_districts, r.video_id,
            r.is_premium, r.views, r.status, r.created_at, r.updated_at,
            r.expiry_date, r.deadline_start, r.deadline_end, r.negotiable_deadline,
            r.budget, r.negotiable_budget, r.negotiable_quantity, r.negotiable_price,
            r.responses, r.deadline,
            r.transport_service_type, r.transport_route, r.transport_type, r.transport_capacity,
            r.transport_date_time, r.transport_departure_date_time, r.transport_price, r.transport_price_type,
            r.transport_negotiable, r.transport_comment, r.transport_all_districts,
            v.id, v.url, v.thumbnail, u.company_name, u.first_name, u.last_name, u.verification_status
    """
    
    print(f'[GET_REQUEST] Looking for id={request_id!r}')
    cur.execute(sql)
    req = cur.fetchone()
    print(f'[GET_REQUEST] Found: {req is not None}')
    
    if req:
        try:
            cur.execute(
                f"UPDATE t_p42562714_web_app_creation_1.requests SET views = COALESCE(views, 0) + 1 WHERE id = '{request_id_escaped}'"
            )
            conn.commit()
        except Exception as view_err:
            print(f'[WARN] Could not increment views: {view_err}')
            conn.rollback()
    
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
    
    req_dict['id'] = str(req_dict.get('id', ''))
    req_dict['userId'] = str(req_dict.pop('user_id', None))
    req_dict['authorName'] = req_dict.pop('author_name', None)
    req_dict['authorIsVerified'] = req_dict.pop('author_is_verified', False)
    req_dict['pricePerUnit'] = float(req_dict.pop('price_per_unit', 0) or 0)
    req_dict['hasVAT'] = req_dict.pop('has_vat', False)
    req_dict['vatRate'] = req_dict.pop('vat_rate', None)
    req_dict['isPremium'] = req_dict.pop('is_premium', False)
    req_dict['availableDistricts'] = req_dict.pop('available_districts', []) or []
    req_dict['deliveryAddress'] = req_dict.pop('delivery_address', None)
    req_dict['negotiableDeadline'] = req_dict.pop('negotiable_deadline', None)
    req_dict['negotiableBudget'] = req_dict.pop('negotiable_budget', None)
    req_dict['negotiableQuantity'] = req_dict.pop('negotiable_quantity', None)
    req_dict['negotiablePrice'] = req_dict.pop('negotiable_price', None)
    req_dict['deadlineStart'] = deadline_start.isoformat() if deadline_start else None
    req_dict['deadlineEnd'] = deadline_end.isoformat() if deadline_end else None
    req_dict['createdAt'] = created_at.isoformat() if created_at else None
    req_dict['updatedAt'] = updated_at.isoformat() if updated_at else None
    req_dict['expiryDate'] = expiry_date.isoformat() if expiry_date else None
    req_dict.pop('video_id', None)
    
    # Транспортные поля
    req_dict['transportServiceType'] = req_dict.pop('transport_service_type', None)
    req_dict['transportRoute'] = req_dict.pop('transport_route', None)
    req_dict['transportType'] = req_dict.pop('transport_type', None)
    req_dict['transportCapacity'] = req_dict.pop('transport_capacity', None)
    transport_dt = req_dict.pop('transport_date_time', None)
    req_dict['transportDateTime'] = transport_dt.isoformat() if transport_dt else None
    transport_dep_dt = req_dict.pop('transport_departure_date_time', None)
    req_dict['transportDepartureDateTime'] = transport_dep_dt.isoformat() if transport_dep_dt else None
    transport_price = req_dict.pop('transport_price', None)
    req_dict['transportPrice'] = float(transport_price) if transport_price is not None else None
    req_dict['transportPriceType'] = req_dict.pop('transport_price_type', None)
    req_dict['transportNegotiable'] = req_dict.pop('transport_negotiable', False)
    req_dict['transportComment'] = req_dict.pop('transport_comment', None)
    req_dict['transportAllDistricts'] = req_dict.pop('transport_all_districts', False)
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(req_dict, default=json_default),
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
            negotiable_quantity, negotiable_price,
            transport_service_type, transport_route, transport_type, transport_capacity,
            transport_date_time, transport_departure_date_time, transport_price, transport_price_type,
            transport_negotiable, transport_comment, transport_all_districts
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                  %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, created_at
    """
    
    transport_dt = body.get('transportDateTime')
    transport_dep_dt = body.get('transportDepartureDateTime')
    transport_price_val = body.get('transportPrice')
    
    cur.execute(sql, (
        user_id,
        body['title'],
        body['description'],
        body['category'],
        body.get('subcategory'),
        body.get('quantity', 1),
        body.get('unit', 'шт'),
        body.get('pricePerUnit', 0),
        body.get('hasVAT', False),
        body.get('vatRate'),
        body.get('district', ''),
        body.get('deliveryAddress'),
        body.get('availableDistricts', []),
        body.get('isPremium', False),
        body.get('status', 'active'),
        body.get('deadlineStart'),
        body.get('deadlineEnd'),
        body.get('negotiableDeadline', False),
        body.get('budget'),
        body.get('negotiableBudget', False),
        body.get('negotiableQuantity', False),
        body.get('negotiablePrice', False),
        body.get('transportServiceType'),
        body.get('transportRoute'),
        body.get('transportType'),
        body.get('transportCapacity'),
        transport_dt if transport_dt else None,
        transport_dep_dt if transport_dep_dt else None,
        float(transport_price_val) if transport_price_val else None,
        body.get('transportPriceType'),
        body.get('transportNegotiable', False),
        body.get('transportComment'),
        body.get('transportAllDistricts', False),
    ))
    
    result = cur.fetchone()
    request_id = result['id']
    
    if body.get('images'):
        for idx, img in enumerate(body['images']):
            img_url = upload_image_to_s3(img['url'])
            cur.execute(
                "INSERT INTO t_p42562714_web_app_creation_1.offer_images (url, alt) VALUES (%s, %s) RETURNING id",
                (img_url, img.get('alt', ''))
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
        'transportServiceType': 'transport_service_type',
        'transportRoute': 'transport_route',
        'transportType': 'transport_type',
        'transportCapacity': 'transport_capacity',
        'transportDateTime': 'transport_date_time',
        'transportDepartureDateTime': 'transport_departure_date_time',
        'transportPrice': 'transport_price',
        'transportPriceType': 'transport_price_type',
        'transportNegotiable': 'transport_negotiable',
        'transportComment': 'transport_comment',
        'transportAllDistricts': 'transport_all_districts',
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
    """Мягкое удаление запроса (флаг is_removed = TRUE)"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        sql = """
            UPDATE t_p42562714_web_app_creation_1.requests 
            SET is_removed = TRUE, updated_at = CURRENT_TIMESTAMP
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