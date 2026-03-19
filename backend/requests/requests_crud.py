import json
from typing import Dict, Any, List
from psycopg2.extras import RealDictCursor

from requests_utils import get_db_connection, upload_image_to_s3


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
