import json
from typing import Dict, Any
from decimal import Decimal
from psycopg2.extras import RealDictCursor

from requests_utils import get_db_connection, json_default


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
            r.deadline,
            (SELECT COUNT(*) FROM t_p42562714_web_app_creation_1.orders o
             WHERE o.offer_id = r.id AND o.status NOT IN ('cancelled')
            ) as responses,
            r.transport_service_type, r.transport_route, r.transport_type, r.transport_capacity,
            r.transport_date_time, r.transport_departure_date_time, r.transport_price, r.transport_price_type,
            r.transport_negotiable, r.transport_comment, r.transport_all_districts,
            COALESCE(
                (SELECT SUM(o.quantity) FROM t_p42562714_web_app_creation_1.orders o
                 WHERE o.offer_id = r.id AND o.status = 'accepted'),
                0
            ) as accepted_qty,
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
            CASE WHEN u.verification_status = 'approved' THEN TRUE ELSE FALSE END as author_is_verified,
            COALESCE(u.rating, 0) as author_rating,
            (SELECT COUNT(*) FROM t_p42562714_web_app_creation_1.reviews rv WHERE rv.reviewed_user_id = u.id) as author_reviews_count
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
            r.deadline,
            r.transport_service_type, r.transport_route, r.transport_type, r.transport_capacity,
            r.transport_date_time, r.transport_departure_date_time, r.transport_price, r.transport_price_type,
            r.transport_negotiable, r.transport_comment, r.transport_all_districts,
            v.id, v.url, v.thumbnail, u.company_name, u.first_name, u.last_name, u.verification_status, u.rating, u.id
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
    req_dict['authorRating'] = float(req_dict.pop('author_rating', 0) or 0)
    req_dict['authorReviewsCount'] = int(req_dict.pop('author_reviews_count', 0) or 0)
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
    req_dict['acceptedQty'] = float(req_dict.pop('accepted_qty', 0) or 0)

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(req_dict, default=json_default),
        'isBase64Encoded': False
    }
