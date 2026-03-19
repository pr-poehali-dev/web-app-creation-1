import json
import http.client
from typing import Dict, Any
from decimal import Decimal
from psycopg2.extras import RealDictCursor

from requests_utils import get_db_connection, json_default


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

    # Авто-закрытие запросов только если принятое количество >= запрошенному (и quantity > 0)
    cur.execute("""
        UPDATE t_p42562714_web_app_creation_1.requests
        SET status = 'closed', updated_at = NOW()
        WHERE status = 'active'
          AND requests.quantity > 0
          AND COALESCE((
              SELECT SUM(o.quantity) FROM t_p42562714_web_app_creation_1.orders o
              WHERE o.offer_id = requests.id
                AND o.status = 'accepted'
          ), 0) >= requests.quantity
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
            ) as responses,
            COALESCE(
                (SELECT SUM(o.quantity) FROM t_p42562714_web_app_creation_1.orders o
                 WHERE o.offer_id = r.id AND o.status = 'accepted'),
                0
            ) as accepted_qty
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
        req_dict['acceptedQty'] = float(req_dict.pop('accepted_qty', 0) or 0)

        result.append(req_dict)

    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'requests': result, 'total': len(result)}, default=json_default),
        'isBase64Encoded': False
    }