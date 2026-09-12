"""
Единая функция управления аукционами (объединяет бывшие
auctions-list, auctions-my, auctions-create, auctions-place-bid, auctions-update)
— чтобы сэкономить лимит backend-функций проекта.

GET  /                              — список активных аукционов (+фильтр status, id)
GET  /?scope=my                     — аукционы текущего пользователя (X-User-Id)
POST / action=contact_*             — обмен контактами/жалобы/чат победителя (бывший auctions-list POST)
POST / action=create                — создание аукциона (бывший auctions-create)
POST / action=place_bid             — ставка (бывший auctions-place-bid)
POST / action=update|reduce-price|stop — редактирование (бывший auctions-update)
DELETE /                            — отмена аукциона (бывший auctions-my DELETE)
"""
import json
import os
import base64
import uuid
import threading
import http.client
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import psycopg2
import boto3
from typing import Dict, Any

SCHEMA = 't_p42562714_web_app_creation_1'
CORS_BASE = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}


def convert_decimals(obj: Any) -> Any:
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, dict):
        return {k: convert_decimals(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [convert_decimals(i) for i in obj]
    return obj


def json_response(status: int, body: dict, extra_headers: dict = None) -> Dict[str, Any]:
    headers = {**CORS_BASE, **(extra_headers or {})}
    return {'statusCode': status, 'headers': headers, 'body': json.dumps(body, default=str), 'isBase64Encoded': False}


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def update_auction_statuses(cur, tz_offset: int):
    """Общая логика перевода аукционов между статусами по времени (раньше дублировалась)."""
    user_tz = timezone(timedelta(hours=tz_offset))
    now = datetime.now(user_tz).replace(tzinfo=None)

    cur.execute(f"""
        UPDATE {SCHEMA}.auctions SET status = 'active'
        WHERE status IN ('upcoming', 'pending') AND start_date <= %s
    """, (now,))
    cur.execute(f"""
        UPDATE {SCHEMA}.auctions SET status = 'ended'
        WHERE status IN ('active', 'ending-soon') AND end_date <= %s
    """, (now,))
    cur.execute(f"""
        UPDATE {SCHEMA}.auctions SET status = 'archived'
        WHERE status = 'ended' AND bid_count = 0
    """)
    cur.execute(f"""
        UPDATE {SCHEMA}.auctions SET status = 'ending-soon'
        WHERE status = 'active' AND end_date > %s AND end_date <= %s + INTERVAL '24 hours'
    """, (now, now))
    return now


# ──────────────────────────────────────────────────────────────────────────
# GET: список / один аукцион / мои аукционы
# ──────────────────────────────────────────────────────────────────────────

def handle_get(event: Dict[str, Any]) -> Dict[str, Any]:
    params = event.get('queryStringParameters') or {}
    scope = params.get('scope')
    tz_offset = int(params.get('timezoneOffset', 9))

    conn = get_db()
    cur = conn.cursor()
    try:
        update_auction_statuses(cur, tz_offset)
        conn.commit()

        if scope == 'my':
            headers = event.get('headers', {})
            user_id = headers.get('x-user-id') or headers.get('X-User-Id')
            if not user_id:
                return json_response(401, {'error': 'Unauthorized'})
            return _get_my_auctions(cur, user_id)

        return _get_auctions_list(cur, params)
    finally:
        cur.close()
        conn.close()


def _get_auctions_list(cur, params: dict) -> Dict[str, Any]:
    auction_id = params.get('id')
    status_filter = params.get('status')

    query = f"""
        SELECT
            a.id, a.user_id, a.title, a.description, a.category, a.subcategory,
            a.quantity, a.unit, a.starting_price, a.current_bid, a.min_bid_step,
            a.buy_now_price, a.has_vat, a.vat_rate, a.district, a.full_address,
            a.gps_coordinates, a.available_districts, a.available_delivery_types,
            a.start_date, a.end_date, a.duration_days, a.status, a.is_premium,
            a.bid_count, a.view_count, a.created_at,
            COALESCE(json_agg(
                json_build_object('url', ai.url, 'alt', ai.alt) ORDER BY ai.sort_order
            ) FILTER (WHERE ai.id IS NOT NULL), '[]') as images,
            a.video_url
        FROM {SCHEMA}.auctions a
        LEFT JOIN {SCHEMA}.auction_images ai ON a.id = ai.auction_id
    """

    if auction_id:
        query += " WHERE a.id = %s AND a.status NOT IN ('cancelled', 'deleted', 'archived') GROUP BY a.id"
        cur.execute(query, (auction_id,))
    elif status_filter and status_filter not in ('cancelled', 'deleted', 'archived'):
        query += " WHERE a.status = %s GROUP BY a.id ORDER BY a.is_premium DESC, a.created_at DESC"
        cur.execute(query, (status_filter,))
    else:
        query += " WHERE a.status NOT IN ('cancelled', 'deleted', 'archived') GROUP BY a.id ORDER BY a.is_premium DESC, a.created_at DESC"
        cur.execute(query)

    rows = cur.fetchall()
    yakutsk_tz = timezone(timedelta(hours=9))
    utc_tz = timezone(timedelta(hours=0))

    def utc_to_yakutsk(dt):
        if dt is None:
            return None
        return dt.replace(tzinfo=utc_tz).astimezone(yakutsk_tz).isoformat()

    auctions = []
    for row in rows:
        auctions.append({
            'id': row[0], 'userId': row[1], 'title': row[2], 'description': row[3],
            'category': row[4], 'subcategory': row[5],
            'quantity': float(row[6]) if row[6] else None, 'unit': row[7],
            'startingPrice': float(row[8]), 'currentBid': float(row[9]),
            'minBidStep': float(row[10]), 'buyNowPrice': float(row[11]) if row[11] else None,
            'hasVAT': row[12], 'vatRate': float(row[13]) if row[13] else None,
            'district': row[14], 'fullAddress': row[15], 'gpsCoordinates': row[16],
            'availableDistricts': row[17], 'availableDeliveryTypes': row[18],
            'startDate': utc_to_yakutsk(row[19]), 'endDate': utc_to_yakutsk(row[20]),
            'durationDays': row[21], 'status': row[22], 'isPremium': row[23],
            'bidCount': row[24], 'viewCount': row[25], 'createdAt': utc_to_yakutsk(row[26]),
            'images': json.loads(row[27]) if isinstance(row[27], str) else row[27],
            'videoUrl': row[28],
        })

    if auction_id and auctions:
        cur.execute(f"""
            SELECT b.id, b.user_id, b.amount, b.created_at,
                   COALESCE(u.company_name, CONCAT(u.first_name, ' ', u.last_name)) as user_name
            FROM {SCHEMA}.bids b
            LEFT JOIN {SCHEMA}.users u ON b.user_id = u.id
            WHERE b.auction_id = %s
            ORDER BY b.created_at DESC
        """, (auction_id,))
        bids_rows = cur.fetchall()
        bids = []
        for i, br in enumerate(bids_rows):
            ts = br[3]
            ts_str = ts.replace(tzinfo=utc_tz).astimezone(yakutsk_tz).isoformat() if ts else None
            bids.append({
                'id': br[0], 'userId': br[1], 'amount': float(br[2]),
                'timestamp': ts_str, 'userName': br[4] or 'Участник', 'isWinning': i == 0
            })
        auctions[0]['bids'] = bids

    auctions = convert_decimals(auctions)
    cache_headers = {'Cache-Control': 'public, max-age=30, s-maxage=30'}

    if auction_id:
        if auctions:
            return json_response(200, auctions[0], cache_headers)
        return json_response(404, {'error': 'Auction not found'}, cache_headers)

    return json_response(200, {'auctions': auctions}, cache_headers)


def _get_my_auctions(cur, user_id: str) -> Dict[str, Any]:
    cur.execute(f"""
        SELECT
            a.id, a.user_id, a.title, a.description, a.category, a.subcategory,
            a.quantity, a.unit, a.starting_price, a.current_bid, a.min_bid_step,
            a.buy_now_price, a.has_vat, a.vat_rate, a.district, a.full_address,
            a.gps_coordinates, a.available_districts, a.available_delivery_types,
            a.start_date, a.end_date, a.duration_days, a.status, a.is_premium,
            a.bid_count, a.view_count, a.created_at,
            COALESCE(json_agg(
                json_build_object('url', ai.url, 'alt', ai.alt) ORDER BY ai.sort_order
            ) FILTER (WHERE ai.id IS NOT NULL), '[]') as images
        FROM {SCHEMA}.auctions a
        LEFT JOIN {SCHEMA}.auction_images ai ON a.id = ai.auction_id
        WHERE a.user_id = %s AND a.status != 'cancelled'
        GROUP BY a.id
        ORDER BY a.created_at DESC
    """, (int(user_id),))
    rows = cur.fetchall()

    auctions = []
    for row in rows:
        auctions.append({
            'id': row[0], 'userId': row[1], 'title': row[2], 'description': row[3],
            'category': row[4], 'subcategory': row[5],
            'quantity': float(row[6]) if row[6] else None, 'unit': row[7],
            'startingPrice': float(row[8]), 'currentBid': float(row[9]),
            'minBidStep': float(row[10]), 'buyNowPrice': float(row[11]) if row[11] else None,
            'hasVAT': row[12], 'vatRate': float(row[13]) if row[13] else None,
            'district': row[14], 'fullAddress': row[15], 'gpsCoordinates': row[16],
            'availableDistricts': row[17], 'availableDeliveryTypes': row[18],
            'startDate': row[19].isoformat() if row[19] else None,
            'endDate': row[20].isoformat() if row[20] else None,
            'durationDays': row[21], 'status': row[22], 'isPremium': row[23],
            'bidCount': row[24], 'viewCount': row[25],
            'createdAt': row[26].isoformat() if row[26] else None,
            'images': json.loads(row[27]) if isinstance(row[27], str) else row[27],
        })
    return json_response(200, {'auctions': convert_decimals(auctions)})


# ──────────────────────────────────────────────────────────────────────────
# DELETE: отмена аукциона (бывший auctions-my DELETE)
# ──────────────────────────────────────────────────────────────────────────

def handle_delete(event: Dict[str, Any]) -> Dict[str, Any]:
    headers = event.get('headers', {})
    user_id = headers.get('x-user-id') or headers.get('X-User-Id')
    if not user_id:
        return json_response(401, {'error': 'Unauthorized'})

    body = json.loads(event.get('body', '{}'))
    auction_id = body.get('auctionId')
    admin_delete = body.get('adminDelete', False)
    if not auction_id:
        return json_response(400, {'error': 'Missing auctionId'})

    conn = get_db()
    cur = conn.cursor()
    try:
        if admin_delete:
            cur.execute(f"UPDATE {SCHEMA}.auctions SET status = 'cancelled' WHERE id = CAST(%s AS INTEGER)", (auction_id,))
        else:
            cur.execute(
                f"UPDATE {SCHEMA}.auctions SET status = 'cancelled' WHERE id = CAST(%s AS INTEGER) AND user_id = CAST(%s AS INTEGER)",
                (auction_id, user_id)
            )
        affected = cur.rowcount
        conn.commit()
        if affected == 0:
            return json_response(404, {'error': 'Auction not found or access denied'})
        return json_response(200, {'success': True})
    finally:
        cur.close()
        conn.close()


# ──────────────────────────────────────────────────────────────────────────
# POST: create / place_bid / update / contact-exchange
# ──────────────────────────────────────────────────────────────────────────

def _send_push_to_user(user_id: int, title: str, message: str, url: str):
    try:
        payload = json.dumps({'userId': user_id, 'type': 'auction_bid', 'title': title, 'message': message, 'url': url})
        conn = http.client.HTTPSConnection('functions.poehali.dev', timeout=8)
        conn.request('POST', '/a1c8fafd-b64f-45e5-b9b9-0a050cca4f7a', payload, {'Content-Type': 'application/json'})
        resp = conn.getresponse()
        resp.read()
        conn.close()
    except Exception as e:
        print(f'[AUCTION_PUSH] Error sending to user {user_id}: {e}')


def _notify_auction_participants(auction_id: str, bidder_id: int, auction_title: str, new_amount: float, owner_id: int):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(f"SELECT DISTINCT user_id FROM {SCHEMA}.bids WHERE auction_id = %s AND user_id != %s", (auction_id, bidder_id))
        participants = [row[0] for row in cur.fetchall()]
        cur.close()
        conn.close()

        url = f'/auction/{auction_id}'
        amount_str = f'{new_amount:,.0f}'.replace(',', ' ')
        title_short = auction_title[:40] + '...' if len(auction_title) > 40 else auction_title

        for uid in participants:
            threading.Thread(target=_send_push_to_user, args=(uid, 'Вас перебили!', f'Новая ставка {amount_str} ₽ на «{title_short}»', url), daemon=True).start()

        if owner_id != bidder_id:
            threading.Thread(target=_send_push_to_user, args=(owner_id, 'Новая ставка на аукционе', f'{amount_str} ₽ на «{title_short}»', url), daemon=True).start()
    except Exception as e:
        print(f'[AUCTION_PUSH] Notify participants error: {e}')


def check_rate_limit(conn, identifier: str, endpoint: str, max_requests: int = 10, window_minutes: int = 1) -> bool:
    with conn.cursor() as cur:
        window_start = datetime.now() - timedelta(minutes=window_minutes)
        cur.execute("SELECT request_count, window_start FROM rate_limits WHERE identifier = %s AND endpoint = %s", (identifier, endpoint))
        result = cur.fetchone()
        if result:
            if result[1] > window_start:
                if result[0] >= max_requests:
                    return False
                cur.execute("UPDATE rate_limits SET request_count = request_count + 1 WHERE identifier = %s AND endpoint = %s", (identifier, endpoint))
            else:
                cur.execute("UPDATE rate_limits SET request_count = 1, window_start = CURRENT_TIMESTAMP WHERE identifier = %s AND endpoint = %s", (identifier, endpoint))
        else:
            cur.execute("INSERT INTO rate_limits (identifier, endpoint, request_count, window_start) VALUES (%s, %s, 1, CURRENT_TIMESTAMP)", (identifier, endpoint))
        conn.commit()
        return True


def handle_create(event: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    body_data = json.loads(event.get('body', '{}'))

    s3 = boto3.client('s3', endpoint_url='https://bucket.poehali.dev',
                       aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                       aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])

    image_urls = []
    if body_data.get('imageUrls'):
        image_urls = body_data['imageUrls']
    else:
        for img_data in body_data.get('images', []):
            img_base64 = img_data.split(',')[1] if ',' in img_data else img_data
            img_bytes = base64.b64decode(img_base64)
            file_ext = 'jpg'
            if 'image/png' in img_data:
                file_ext = 'png'
            elif 'image/webp' in img_data:
                file_ext = 'webp'
            file_name = f'auctions/{uuid.uuid4()}.{file_ext}'
            s3.put_object(Bucket='files', Key=file_name, Body=img_bytes, ContentType=f'image/{file_ext}')
            image_urls.append(f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{file_name}")

    video_url = body_data.get('videoUrl')

    conn = get_db()
    cur = conn.cursor()
    try:
        start_datetime = datetime.fromisoformat(body_data['startDate'] + 'T' + body_data['startTime'])
        duration_days = int(body_data['duration'])
        end_datetime = start_datetime + timedelta(days=duration_days)

        user_tz_offset = body_data.get('timezoneOffset', 9)
        user_tz = timezone(timedelta(hours=user_tz_offset))
        now = datetime.now(user_tz).replace(tzinfo=None)
        initial_status = 'active' if start_datetime <= now else 'upcoming'

        available_districts = body_data.get('availableDistricts', [])
        if not available_districts and body_data['district']:
            available_districts = [body_data['district']]

        cur.execute("""
            INSERT INTO auctions (
                user_id, title, description, category, subcategory,
                quantity, unit, starting_price, current_bid, min_bid_step,
                buy_now_price, has_vat, vat_rate, district, full_address,
                gps_coordinates, available_districts, available_delivery_types,
                start_date, end_date, duration_days, status, video_url
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING id
        """, (
            int(user_id), body_data['title'], body_data['description'], body_data['category'],
            body_data.get('subcategory'), float(body_data['quantity']) if body_data.get('quantity') else None,
            body_data.get('unit'), float(body_data['startingPrice']), float(body_data['startingPrice']),
            float(body_data['minBidStep']), float(body_data['buyNowPrice']) if body_data.get('buyNowPrice') else None,
            body_data.get('hasVAT', False), float(body_data['vatRate']) if body_data.get('vatRate') else None,
            body_data['district'], body_data.get('fullAddress'), body_data.get('gpsCoordinates'),
            available_districts, body_data['availableDeliveryTypes'], start_datetime, end_datetime,
            duration_days, initial_status, video_url
        ))
        auction_id = cur.fetchone()[0]

        for idx, url in enumerate(image_urls):
            cur.execute(
                "INSERT INTO auction_images (auction_id, url, alt, sort_order) VALUES (%s, %s, %s, %s)",
                (auction_id, url, body_data['title'], idx)
            )
        conn.commit()
        return json_response(201, {'auctionId': auction_id, 'message': 'Auction created successfully'})
    finally:
        cur.close()
        conn.close()


def handle_place_bid(event: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    source_ip = event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')
    try:
        conn_rl = get_db()
        if not check_rate_limit(conn_rl, f"{source_ip}:{user_id}", 'place_bid', max_requests=10, window_minutes=1):
            conn_rl.close()
            return json_response(429, {'error': 'Слишком много ставок. Подождите минуту.'})
        conn_rl.close()
    except Exception:
        pass

    body_data = json.loads(event.get('body', '{}'))
    auction_id = body_data.get('auctionId')
    amount = body_data.get('amount')
    if not auction_id or not amount:
        return json_response(400, {'error': 'auctionId and amount are required'})

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT status, current_bid, min_bid_step, starting_price, user_id, end_date FROM {SCHEMA}.auctions WHERE id = %s", (auction_id,))
        auction_data = cur.fetchone()
        if not auction_data:
            return json_response(404, {'error': 'Auction not found'})

        status, current_bid, min_bid_step, starting_price, owner_id, end_date = auction_data
        if status not in ['active', 'ending-soon']:
            return json_response(400, {'error': 'Аукцион не активен'})
        if int(user_id) == int(owner_id):
            return json_response(400, {'error': 'Вы не можете делать ставки на свой аукцион'})

        min_next_bid = float(current_bid or starting_price) + float(min_bid_step)
        if float(amount) < min_next_bid:
            return json_response(400, {'error': f'Минимальная ставка: {min_next_bid} ₽', 'minBid': min_next_bid})

        cur.execute(f"INSERT INTO {SCHEMA}.bids (auction_id, user_id, amount) VALUES (%s, %s, %s) RETURNING id, created_at", (auction_id, user_id, amount))
        bid_id, created_at = cur.fetchone()

        cur.execute(f"UPDATE {SCHEMA}.auctions SET current_bid = %s, bid_count = bid_count + 1 WHERE id = %s", (amount, auction_id))
        conn.commit()

        cur.execute(f"SELECT first_name, last_name, company_name, user_type FROM {SCHEMA}.users WHERE id = %s", (user_id,))
        user_data = cur.fetchone()
        user_name = 'Участник'
        if user_data:
            first_name, last_name, company_name, user_type = user_data
            if user_type == 'legal-entity' and company_name:
                user_name = company_name
            elif first_name and last_name:
                user_name = f"{first_name} {last_name}"

        cur.execute(f"SELECT title FROM {SCHEMA}.auctions WHERE id = %s", (auction_id,))
        title_row = cur.fetchone()
        auction_title = title_row[0] if title_row else ''

        threading.Thread(target=_notify_auction_participants, args=(auction_id, int(user_id), auction_title, float(amount), int(owner_id)), daemon=True).start()

        return json_response(200, {
            'success': True,
            'bid': {
                'id': bid_id, 'auctionId': auction_id, 'userId': int(user_id), 'userName': user_name,
                'amount': float(amount), 'timestamp': created_at.isoformat() if created_at else datetime.now().isoformat(),
                'isWinning': True
            }
        })
    finally:
        cur.close()
        conn.close()


def handle_update(event: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    body_data = json.loads(event.get('body', '{}'))
    auction_id = body_data.get('auctionId')
    action = body_data.get('action')
    if not auction_id or not action:
        return json_response(400, {'error': 'auctionId and action are required'})

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT status, start_date, current_bid, starting_price FROM {SCHEMA}.auctions WHERE id = %s AND user_id = %s", (auction_id, user_id))
        auction_data = cur.fetchone()
        if not auction_data:
            return json_response(404, {'error': 'Auction not found or you are not the owner'})

        status, start_date, current_bid, starting_price = auction_data
        now = datetime.now()
        auction_started = start_date and start_date <= now

        if action == 'update':
            if auction_started:
                return json_response(400, {'error': 'Нельзя редактировать аукцион после его начала'})

            update_fields, update_values = [], []
            field_map = {
                'title': 'title', 'description': 'description', 'buyNowPrice': 'buy_now_price',
                'minBidStep': 'min_bid_step', 'startDate': 'start_date', 'endDate': 'end_date',
            }
            for key, col in field_map.items():
                if key in body_data:
                    update_fields.append(f'{col} = %s')
                    update_values.append(body_data[key])
            if 'startingPrice' in body_data:
                update_fields.append('starting_price = %s')
                update_values.append(body_data['startingPrice'])
                update_fields.append('current_bid = %s')
                update_values.append(body_data['startingPrice'])

            if update_fields:
                update_values.extend([auction_id, user_id])
                cur.execute(f"UPDATE {SCHEMA}.auctions SET {', '.join(update_fields)} WHERE id = %s AND user_id = %s", update_values)
                conn.commit()

            if 'images' in body_data and isinstance(body_data['images'], list):
                cur.execute(f"DELETE FROM {SCHEMA}.auction_images WHERE auction_id = %s", (auction_id,))
                for idx, img in enumerate(body_data['images']):
                    cur.execute(f"INSERT INTO {SCHEMA}.auction_images (auction_id, url, alt, sort_order) VALUES (%s, %s, %s, %s)", (auction_id, img['url'], img.get('alt', ''), idx))
                conn.commit()

        elif action == 'reduce-price':
            if not auction_started:
                return json_response(400, {'error': 'Аукцион еще не начался'})
            if status not in ['active', 'ending-soon']:
                return json_response(400, {'error': 'Можно снижать цену только у активных аукционов'})
            new_price = body_data.get('newPrice')
            if not new_price:
                return json_response(400, {'error': 'newPrice is required'})
            if new_price >= current_bid:
                return json_response(400, {'error': 'Новая цена должна быть ниже текущей'})
            cur.execute(f"UPDATE {SCHEMA}.auctions SET current_bid = %s, starting_price = %s WHERE id = %s AND user_id = %s", (new_price, new_price, auction_id, user_id))
            conn.commit()

        elif action == 'stop':
            if not auction_started:
                return json_response(400, {'error': 'Аукцион еще не начался'})
            if status not in ['active', 'ending-soon', 'upcoming']:
                return json_response(400, {'error': 'Этот аукцион нельзя остановить'})
            cur.execute(f"UPDATE {SCHEMA}.auctions SET status = 'ended', end_date = %s WHERE id = %s AND user_id = %s", (now, auction_id, user_id))
            conn.commit()
        else:
            return json_response(400, {'error': 'Invalid action'})

        return json_response(200, {'success': True, 'message': 'Аукцион обновлен'})
    finally:
        cur.close()
        conn.close()


def handle_contact_exchange(event: Dict[str, Any]) -> Dict[str, Any]:
    """Обмен контактами, жалобы, чат победителя/продавца (бывший auctions-list POST)."""
    user_id = event.get('headers', {}).get('X-User-Id') or event.get('headers', {}).get('x-user-id')
    if not user_id:
        return json_response(401, {'error': 'Требуется авторизация'})

    body_data = json.loads(event.get('body', '{}'))
    action = body_data.get('action')
    auction_id = body_data.get('auctionId')
    if not auction_id:
        return json_response(400, {'error': 'Требуется auctionId'})

    conn = get_db()
    cur = conn.cursor()
    try:
        aid = str(auction_id).replace("'", "''")
        uid = str(user_id).replace("'", "''")

        if action == 'get_complaints':
            cur.execute(f"""
                SELECT ac.id, ac.auction_id, ac.complainant_id, ac.text, ac.file_urls, ac.status, ac.created_at,
                       a.title as auction_title,
                       COALESCE(u.company_name, TRIM(CONCAT(u.first_name, ' ', u.last_name))) as complainant_name
                FROM {SCHEMA}.auction_complaints ac
                LEFT JOIN {SCHEMA}.auctions a ON ac.auction_id = a.id
                LEFT JOIN {SCHEMA}.users u ON ac.complainant_id = u.id
                ORDER BY ac.created_at DESC
            """)
            complaints = []
            for r in cur.fetchall():
                complaints.append({
                    'id': r[0], 'auctionId': r[1], 'complainantId': r[2], 'text': r[3],
                    'fileUrls': r[4] or [], 'status': r[5], 'createdAt': r[6].isoformat() if r[6] else None,
                    'auctionTitle': r[7], 'complainantName': r[8]
                })
            return json_response(200, {'complaints': complaints})

        cur.execute(f"SELECT user_id FROM {SCHEMA}.auctions WHERE id = '{aid}'")
        auction_row = cur.fetchone()
        if not auction_row:
            return json_response(404, {'error': 'Аукцион не найден'})
        seller_id = auction_row[0]

        cur.execute(f"SELECT user_id FROM {SCHEMA}.bids WHERE auction_id = '{aid}' ORDER BY amount DESC, created_at ASC LIMIT 1")
        winner_row = cur.fetchone()
        if not winner_row:
            return json_response(404, {'error': 'Победитель не найден'})
        winner_id = winner_row[0]
        is_winner = str(user_id) == str(winner_id)
        is_seller = str(user_id) == str(seller_id)
        if not is_winner and not is_seller:
            return json_response(403, {'error': 'Доступ запрещен'})

        if action == 'submit':
            phone = body_data.get('phone', '').replace("'", "''")
            if not phone:
                return json_response(400, {'error': 'Требуется phone'})
            role = 'winner' if is_winner else 'seller'
            email = str(body_data.get('email', '') or '').replace("'", "''")
            address = str(body_data.get('address', '') or '').replace("'", "''")
            preferred_time = str(body_data.get('preferredTime', '') or '').replace("'", "''")
            notes = str(body_data.get('notes', '') or '').replace("'", "''")
            cur.execute(f"""
                INSERT INTO {SCHEMA}.auction_contacts (auction_id, user_id, role, phone, email, address, preferred_time, notes)
                VALUES ('{aid}', '{uid}', '{role}', '{phone}', '{email}', '{address}', '{preferred_time}', '{notes}')
                ON CONFLICT (auction_id, role) DO UPDATE SET
                    phone = EXCLUDED.phone, email = EXCLUDED.email, address = EXCLUDED.address,
                    preferred_time = EXCLUDED.preferred_time, notes = EXCLUDED.notes, created_at = CURRENT_TIMESTAMP
            """)
            conn.commit()
            return json_response(200, {'success': True})

        if action == 'get':
            contact_user_id = winner_id if is_seller else seller_id
            cur.execute(f"""
                SELECT phone, email, COALESCE(company_name, TRIM(CONCAT(first_name, ' ', last_name))) as name
                FROM {SCHEMA}.users WHERE id = {int(contact_user_id)}
            """)
            user_row = cur.fetchone()
            if not user_row:
                return json_response(200, {'contacts': None, 'sellerId': seller_id, 'winnerId': winner_id})
            contacts = {'phone': user_row[0] or '', 'email': user_row[1] or '', 'name': user_row[2] or ''}
            return json_response(200, {'contacts': contacts, 'sellerId': seller_id, 'winnerId': winner_id})

        if action == 'send_message':
            message_text = body_data.get('message', '').strip().replace("'", "''")
            if not message_text:
                return json_response(400, {'error': 'Сообщение не может быть пустым'})
            cur.execute(f"SELECT COALESCE(company_name, CONCAT(first_name, ' ', last_name)) FROM {SCHEMA}.users WHERE id = {int(user_id)}")
            name_row = cur.fetchone()
            sender_name = (name_row[0] if name_row else 'Участник').replace("'", "''")
            cur.execute(f"""
                INSERT INTO {SCHEMA}.auction_messages (auction_id, sender_id, sender_name, message)
                VALUES ('{aid}', {int(user_id)}, '{sender_name}', '{message_text}')
                RETURNING id, created_at
            """)
            row = cur.fetchone()
            conn.commit()
            return json_response(200, {'id': row[0], 'created_at': row[1].isoformat()})

        if action == 'get_messages':
            cur.execute(f"""
                SELECT id, sender_id, sender_name, message, created_at
                FROM {SCHEMA}.auction_messages WHERE auction_id = '{aid}' ORDER BY created_at ASC
            """)
            msgs = [{'id': r[0], 'senderId': r[1], 'senderName': r[2] or 'Участник', 'message': r[3], 'createdAt': r[4].isoformat()} for r in cur.fetchall()]
            return json_response(200, {'messages': msgs, 'sellerId': seller_id, 'winnerId': winner_id})

        if action == 'complete':
            if not is_winner:
                return json_response(403, {'error': 'Только победитель может подтвердить получение'})
            cur.execute(f"UPDATE {SCHEMA}.auctions SET status = 'completed' WHERE id = '{aid}'")
            conn.commit()
            return json_response(200, {'success': True})

        if action == 'complain':
            if not is_winner:
                return json_response(403, {'error': 'Только победитель может подать жалобу'})
            complaint_text = str(body_data.get('text', '')).replace("'", "''")
            if not complaint_text:
                return json_response(400, {'error': 'Текст жалобы обязателен'})
            file_urls = body_data.get('fileUrls', [])
            file_urls_str = "ARRAY[" + ",".join(f"'{str(u).replace(chr(39), chr(39)+chr(39))}'" for u in file_urls) + "]" if file_urls else "ARRAY[]::text[]"
            cur.execute(f"""
                INSERT INTO {SCHEMA}.auction_complaints (auction_id, complainant_id, text, file_urls, status)
                VALUES ('{aid}', {int(uid)}, '{complaint_text}', {file_urls_str}, 'new')
            """)
            conn.commit()
            return json_response(200, {'success': True})

        return json_response(400, {'error': 'Неизвестное действие'})
    finally:
        cur.close()
        conn.close()


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '', 'isBase64Encoded': False
        }

    try:
        if method == 'GET':
            return handle_get(event)

        if method == 'DELETE':
            return handle_delete(event)

        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')

            # Действия обмена контактами имеют свою внутреннюю проверку авторизации
            if action in ('get_complaints', 'submit', 'get', 'send_message', 'get_messages', 'complete', 'complain'):
                return handle_contact_exchange(event)

            if not user_id:
                return json_response(401, {'error': 'Unauthorized'})

            if action == 'create':
                return handle_create(event, user_id)
            if action == 'place_bid':
                return handle_place_bid(event, user_id)
            if action in ('update', 'reduce-price', 'stop'):
                return handle_update(event, user_id)

            return json_response(400, {'error': 'Unknown action'})

        return json_response(405, {'error': 'Method not allowed'})
    except Exception as e:
        return json_response(500, {'error': str(e)})
