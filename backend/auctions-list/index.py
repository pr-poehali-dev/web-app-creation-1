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
    
    S = 't_p42562714_web_app_creation_1'
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    try:
        aid = str(auction_id).replace("'", "''")
        uid = str(user_id).replace("'", "''")

        # Отдельный обработчик для получения жалоб (только для авторизованных)
        if action == 'get_complaints':
            cur.execute(f"""
                SELECT ac.id, ac.auction_id, ac.complainant_id, ac.text, ac.file_urls, ac.status, ac.created_at,
                       a.title as auction_title,
                       COALESCE(u.company_name, TRIM(CONCAT(u.first_name, ' ', u.last_name))) as complainant_name
                FROM {S}.auction_complaints ac
                LEFT JOIN {S}.auctions a ON ac.auction_id = a.id
                LEFT JOIN {S}.users u ON ac.complainant_id = u.id
                ORDER BY ac.created_at DESC
            """)
            complaints = []
            for r in cur.fetchall():
                complaints.append({
                    'id': r[0], 'auctionId': r[1], 'complainantId': r[2],
                    'text': r[3], 'fileUrls': r[4] or [], 'status': r[5],
                    'createdAt': r[6].isoformat() if r[6] else None,
                    'auctionTitle': r[7], 'complainantName': r[8]
                })
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'complaints': complaints}), 'isBase64Encoded': False}

        cur.execute(f"SELECT user_id FROM {S}.auctions WHERE id = '{aid}'")
        auction_row = cur.fetchone()
        if not auction_row:
            return {'statusCode': 404, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Аукцион не найден'}), 'isBase64Encoded': False}

        seller_id = auction_row[0]

        cur.execute(f"SELECT user_id FROM {S}.bids WHERE auction_id = '{aid}' ORDER BY amount DESC, created_at ASC LIMIT 1")
        winner_row = cur.fetchone()
        if not winner_row:
            return {'statusCode': 404, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Победитель не найден'}), 'isBase64Encoded': False}

        winner_id = winner_row[0]
        is_winner = str(user_id) == str(winner_id)
        is_seller = str(user_id) == str(seller_id)

        if not is_winner and not is_seller:
            return {'statusCode': 403, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Доступ запрещен'}), 'isBase64Encoded': False}

        if action == 'submit':
            phone = body_data.get('phone', '').replace("'", "''")
            if not phone:
                return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется phone'}), 'isBase64Encoded': False}

            role = 'winner' if is_winner else 'seller'
            email = str(body_data.get('email', '') or '').replace("'", "''")
            address = str(body_data.get('address', '') or '').replace("'", "''")
            preferred_time = str(body_data.get('preferredTime', '') or '').replace("'", "''")
            notes = str(body_data.get('notes', '') or '').replace("'", "''")

            cur.execute(f"""
                INSERT INTO {S}.auction_contacts (auction_id, user_id, role, phone, email, address, preferred_time, notes)
                VALUES ('{aid}', '{uid}', '{role}', '{phone}', '{email}', '{address}', '{preferred_time}', '{notes}')
                ON CONFLICT (auction_id, role) DO UPDATE SET
                    phone = EXCLUDED.phone, email = EXCLUDED.email, address = EXCLUDED.address,
                    preferred_time = EXCLUDED.preferred_time, notes = EXCLUDED.notes, created_at = CURRENT_TIMESTAMP
            """)
            conn.commit()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True}), 'isBase64Encoded': False}

        elif action == 'get':
            # Показываем контакты другой стороны прямо из профиля — без формы
            contact_user_id = winner_id if is_seller else seller_id
            cur.execute(f"""
                SELECT phone, email,
                       COALESCE(company_name, TRIM(CONCAT(first_name, ' ', last_name))) as name
                FROM {S}.users WHERE id = {int(contact_user_id)}
            """)
            user_row = cur.fetchone()
            if not user_row:
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'contacts': None, 'sellerId': seller_id, 'winnerId': winner_id}), 'isBase64Encoded': False}

            contacts = {'phone': user_row[0] or '', 'email': user_row[1] or '', 'name': user_row[2] or ''}
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'contacts': contacts, 'sellerId': seller_id, 'winnerId': winner_id}), 'isBase64Encoded': False}

        elif action == 'send_message':
            message_text = body_data.get('message', '').strip().replace("'", "''")
            if not message_text:
                return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Сообщение не может быть пустым'}), 'isBase64Encoded': False}

            cur.execute(f"SELECT COALESCE(company_name, CONCAT(first_name, ' ', last_name)) FROM {S}.users WHERE id = {int(user_id)}")
            name_row = cur.fetchone()
            sender_name = (name_row[0] if name_row else 'Участник').replace("'", "''")

            cur.execute(f"""
                INSERT INTO {S}.auction_messages (auction_id, sender_id, sender_name, message)
                VALUES ('{aid}', {int(user_id)}, '{sender_name}', '{message_text}')
                RETURNING id, created_at
            """)
            row = cur.fetchone()
            conn.commit()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'id': row[0], 'created_at': row[1].isoformat()}), 'isBase64Encoded': False}

        elif action == 'get_messages':
            cur.execute(f"""
                SELECT id, sender_id, sender_name, message, created_at
                FROM {S}.auction_messages
                WHERE auction_id = '{aid}'
                ORDER BY created_at ASC
            """)
            msgs = []
            for r in cur.fetchall():
                msgs.append({'id': r[0], 'senderId': r[1], 'senderName': r[2] or 'Участник', 'message': r[3], 'createdAt': r[4].isoformat()})
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'messages': msgs, 'sellerId': seller_id, 'winnerId': winner_id}), 'isBase64Encoded': False}

        elif action == 'complete':
            if not is_winner:
                return {'statusCode': 403, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Только победитель может подтвердить получение'}), 'isBase64Encoded': False}
            cur.execute(f"UPDATE {S}.auctions SET status = 'completed' WHERE id = '{aid}'")
            conn.commit()
            print(f'[COMPLETE] Auction {aid} marked completed by winner {uid}')
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True}), 'isBase64Encoded': False}

        elif action == 'complain':
            if not is_winner:
                return {'statusCode': 403, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Только победитель может подать жалобу'}), 'isBase64Encoded': False}
            complaint_text = str(body_data.get('text', '')).replace("'", "''")
            if not complaint_text:
                return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Текст жалобы обязателен'}), 'isBase64Encoded': False}
            file_urls = body_data.get('fileUrls', [])
            file_urls_str = "ARRAY[" + ",".join(f"'{str(u).replace(chr(39), chr(39)+chr(39))}'" for u in file_urls) + "]" if file_urls else "ARRAY[]::text[]"
            cur.execute(f"""
                INSERT INTO {S}.auction_complaints (auction_id, complainant_id, text, file_urls, status)
                VALUES ('{aid}', {int(uid)}, '{complaint_text}', {file_urls_str}, 'new')
            """)
            conn.commit()
            print(f'[COMPLAIN] Complaint filed for auction {aid} by user {uid}')
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True}), 'isBase64Encoded': False}

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

        # Архивируем завершённые аукционы без ставок
        cur.execute("""
            UPDATE t_p42562714_web_app_creation_1.auctions 
            SET status = 'archived'
            WHERE status = 'ended' AND bid_count = 0
        """)
        
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
            query += " WHERE a.id = %s AND a.status NOT IN ('cancelled', 'deleted', 'archived')"
            query += " GROUP BY a.id"
            cur.execute(query, (auction_id,))
        else:
            if status_filter and status_filter not in ('cancelled', 'deleted', 'archived'):
                query += " WHERE a.status = %s"
                query += " GROUP BY a.id ORDER BY a.is_premium DESC, a.created_at DESC"
                cur.execute(query, (status_filter,))
            else:
                query += " WHERE a.status NOT IN ('cancelled', 'deleted', 'archived')"
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