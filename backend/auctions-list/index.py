"""
Получение списка активных аукционов с фильтрацией + обмен контактами
"""
import json
import os
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import psycopg2
from typing import Dict, Any

def convert_decimals(obj: Any) -> Any:
    """Рекурсивно конвертирует Decimal в float для JSON сериализации"""
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {key: convert_decimals(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_decimals(item) for item in obj]
    return obj

def handle_contact_exchange(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    user_id = event.get('headers', {}).get('X-User-Id')
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Требуется авторизация'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    action = body_data.get('action')
    auction_id = body_data.get('auctionId')
    
    if not auction_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Требуется auctionId'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        cur.execute("SELECT user_id FROM t_p42562714_web_app_creation_1.auctions WHERE id = %s", (auction_id,))
        auction_row = cur.fetchone()
        if not auction_row:
            return {'statusCode': 404, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Аукцион не найден'}), 'isBase64Encoded': False}
        
        seller_id = auction_row[0]
        
        cur.execute("SELECT user_id FROM t_p42562714_web_app_creation_1.bids WHERE auction_id = %s ORDER BY amount DESC, created_at ASC LIMIT 1", (auction_id,))
        winner_row = cur.fetchone()
        if not winner_row:
            return {'statusCode': 404, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Победитель не найден'}), 'isBase64Encoded': False}
        
        winner_id = winner_row[0]
        is_winner = user_id == winner_id
        is_seller = user_id == seller_id
        
        if not is_winner and not is_seller:
            return {'statusCode': 403, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Доступ запрещен'}), 'isBase64Encoded': False}
        
        if action == 'submit':
            phone = body_data.get('phone')
            if not phone:
                return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется phone'}), 'isBase64Encoded': False}
            
            role = 'winner' if is_winner else 'seller'
            cur.execute("""
                INSERT INTO t_p42562714_web_app_creation_1.auction_contacts 
                (auction_id, user_id, role, phone, email, address, preferred_time, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (auction_id, role) DO UPDATE SET 
                    phone = EXCLUDED.phone, email = EXCLUDED.email, address = EXCLUDED.address,
                    preferred_time = EXCLUDED.preferred_time, notes = EXCLUDED.notes, created_at = CURRENT_TIMESTAMP
            """, (auction_id, user_id, role, phone, body_data.get('email', ''), body_data.get('address', ''), body_data.get('preferredTime', ''), body_data.get('notes', '')))
            conn.commit()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True}), 'isBase64Encoded': False}
        
        elif action == 'get':
            role_to_fetch = 'seller' if is_winner else 'winner'
            cur.execute("SELECT phone, email, address, preferred_time, notes, created_at FROM t_p42562714_web_app_creation_1.auction_contacts WHERE auction_id = %s AND role = %s", (auction_id, role_to_fetch))
            contact_row = cur.fetchone()
            
            if not contact_row:
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'contacts': None}), 'isBase64Encoded': False}
            
            contacts = {'phone': contact_row[0], 'email': contact_row[1], 'address': contact_row[2], 'preferredTime': contact_row[3], 'notes': contact_row[4], 'submittedAt': contact_row[5].isoformat() if contact_row[5] else None}
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'contacts': contacts}), 'isBase64Encoded': False}
        
        else:
            return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Неизвестное действие'}), 'isBase64Encoded': False}
    
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
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        return handle_contact_exchange(event, context)
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        # Получаем часовой пояс из запроса или используем Якутск по умолчанию
        params = event.get('queryStringParameters') or {}
        tz_offset = int(params.get('timezoneOffset', 9))
        user_tz = timezone(timedelta(hours=tz_offset))
        now = datetime.now(user_tz).replace(tzinfo=None)
        
        # Активируем предстоящие аукционы, время которых наступило
        cur.execute("""
            UPDATE t_p42562714_web_app_creation_1.auctions 
            SET status = 'active' 
            WHERE status = 'upcoming' AND start_date <= %s
        """, (now,))
        
        # Завершаем аукционы, время которых истекло
        cur.execute("""
            UPDATE t_p42562714_web_app_creation_1.auctions 
            SET status = 'ended' 
            WHERE status IN ('active', 'ending-soon') AND end_date <= %s
        """, (now,))
        
        # Помечаем аукционы как "скоро завершится" (меньше 24 часов)
        cur.execute("""
            UPDATE t_p42562714_web_app_creation_1.auctions 
            SET status = 'ending-soon' 
            WHERE status = 'active' 
            AND end_date > %s 
            AND end_date <= %s + INTERVAL '24 hours'
        """, (now, now))
        
        conn.commit()
        
        # Получаем параметры запроса (params уже определены выше)
        auction_id = params.get('id')
        status_filter = params.get('status')
        
        # Получаем список аукционов
        query = """
            SELECT 
                a.id, a.user_id, a.title, a.description, a.category, a.subcategory,
                a.quantity, a.unit, a.starting_price, a.current_bid, a.min_bid_step,
                a.buy_now_price, a.has_vat, a.vat_rate, a.district, a.full_address,
                a.gps_coordinates, a.available_districts, a.available_delivery_types,
                a.start_date, a.end_date, a.duration_days, a.status, a.is_premium,
                a.bid_count, a.view_count, a.created_at,
                COALESCE(json_agg(
                    json_build_object(
                        'url', ai.url,
                        'alt', ai.alt
                    ) ORDER BY ai.sort_order
                ) FILTER (WHERE ai.id IS NOT NULL), '[]') as images
            FROM t_p42562714_web_app_creation_1.auctions a
            LEFT JOIN t_p42562714_web_app_creation_1.auction_images ai ON a.id = ai.auction_id
        """
        
        if auction_id:
            query += " WHERE a.id = %s AND a.status != 'cancelled' AND a.status != 'deleted'"
            query += " GROUP BY a.id"
            cur.execute(query, (auction_id,))
        else:
            if status_filter and status_filter != 'cancelled' and status_filter != 'deleted':
                query += " WHERE a.status = %s"
                query += " GROUP BY a.id ORDER BY a.is_premium DESC, a.created_at DESC"
                cur.execute(query, (status_filter,))
            else:
                query += " WHERE a.status != 'cancelled' AND a.status != 'deleted'"
                query += " GROUP BY a.id ORDER BY a.is_premium DESC, a.created_at DESC"
                cur.execute(query)
        rows = cur.fetchall()
        
        auctions = []
        # Якутск UTC+9
        yakutsk_tz = timezone(timedelta(hours=9))
        utc_tz = timezone(timedelta(hours=0))
        
        for row in rows:
            # PostgreSQL возвращает timestamp without timezone в UTC
            # Конвертируем UTC → Якутск
            start_date = row[19]
            end_date = row[20]
            created_at = row[26]
            
            # Функция для конвертации UTC → Якутск
            def utc_to_yakutsk(dt):
                if dt is None:
                    return None
                return dt.replace(tzinfo=utc_tz).astimezone(yakutsk_tz).isoformat()
            
            auction = {
                'id': row[0],
                'userId': row[1],
                'title': row[2],
                'description': row[3],
                'category': row[4],
                'subcategory': row[5],
                'quantity': float(row[6]) if row[6] else None,
                'unit': row[7],
                'startingPrice': float(row[8]),
                'currentBid': float(row[9]),
                'minBidStep': float(row[10]),
                'buyNowPrice': float(row[11]) if row[11] else None,
                'hasVAT': row[12],
                'vatRate': float(row[13]) if row[13] else None,
                'district': row[14],
                'fullAddress': row[15],
                'gpsCoordinates': row[16],
                'availableDistricts': row[17],
                'availableDeliveryTypes': row[18],
                'startDate': utc_to_yakutsk(start_date),
                'endDate': utc_to_yakutsk(end_date),
                'durationDays': row[21],
                'status': row[22],
                'isPremium': row[23],
                'bidCount': row[24],
                'viewCount': row[25],
                'createdAt': utc_to_yakutsk(created_at),
                'images': json.loads(row[27]) if isinstance(row[27], str) else row[27]
            }
            auctions.append(auction)
        
        if auction_id and auctions:
            # Получаем ставки для конкретного аукциона
            cur.execute("""
                SELECT b.id, b.user_id, b.amount, b.created_at,
                       COALESCE(u.company_name, CONCAT(u.first_name, ' ', u.last_name)) as user_name
                FROM t_p42562714_web_app_creation_1.bids b
                LEFT JOIN t_p42562714_web_app_creation_1.users u ON b.user_id = u.id
                WHERE b.auction_id = %s
                ORDER BY b.created_at DESC
            """, (auction_id,))
            
            bids_rows = cur.fetchall()
            bids = []
            # Якутск UTC+9
            yakutsk_tz = timezone(timedelta(hours=9))
            utc_tz = timezone(timedelta(hours=0))
            for bid_row in bids_rows:
                # PostgreSQL возвращает наивный datetime в UTC
                # Сначала помечаем как UTC, затем конвертируем в Якутск
                timestamp_naive = bid_row[3]
                if timestamp_naive:
                    # Помечаем что это UTC время
                    timestamp_utc = timestamp_naive.replace(tzinfo=utc_tz)
                    # Конвертируем UTC → Якутск (+9 часов)
                    timestamp_yakutsk = timestamp_utc.astimezone(yakutsk_tz)
                    timestamp_str = timestamp_yakutsk.isoformat()
                else:
                    timestamp_str = None
                
                bids.append({
                    'id': bid_row[0],
                    'userId': bid_row[1],
                    'amount': float(bid_row[2]),
                    'timestamp': timestamp_str,
                    'userName': bid_row[4] or 'Участник',
                    'isWinning': bid_row == bids_rows[0]  # Первая ставка (самая последняя по времени) - выигрышная
                })
            
            auctions[0]['bids'] = bids
        
        cur.close()
        conn.close()
        
        # Конвертируем все Decimal в float перед сериализацией
        auctions = convert_decimals(auctions)
        
        # Добавляем заголовки кэширования для ускорения загрузки
        cache_headers = {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=30, s-maxage=30',  # Кэш на 30 секунд
        }
        
        if auction_id:
            if auctions:
                return {
                    'statusCode': 200,
                    'headers': cache_headers,
                    'body': json.dumps(auctions[0]),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': cache_headers,
                    'body': json.dumps({'error': 'Auction not found'}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 200,
            'headers': cache_headers,
            'body': json.dumps({'auctions': auctions}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }