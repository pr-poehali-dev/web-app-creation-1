"""
Получение списка активных аукционов с фильтрацией
"""
import json
import os
from datetime import datetime
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
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
        
        # Обновляем статусы аукционов
        now = datetime.now()
        
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
        
        # Получаем параметры запроса
        params = event.get('queryStringParameters') or {}
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
            query += " WHERE a.id = %s"
            query += " GROUP BY a.id"
            cur.execute(query, (auction_id,))
        else:
            if status_filter:
                query += " WHERE a.status = %s"
                query += " GROUP BY a.id ORDER BY a.is_premium DESC, a.created_at DESC"
                cur.execute(query, (status_filter,))
            else:
                query += " GROUP BY a.id ORDER BY a.is_premium DESC, a.created_at DESC"
                cur.execute(query)
        rows = cur.fetchall()
        
        auctions = []
        for row in rows:
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
                'startDate': row[19].isoformat() if row[19] else None,
                'endDate': row[20].isoformat() if row[20] else None,
                'durationDays': row[21],
                'status': row[22],
                'isPremium': row[23],
                'bidCount': row[24],
                'viewCount': row[25],
                'createdAt': row[26].isoformat() if row[26] else None,
                'images': json.loads(row[27]) if isinstance(row[27], str) else row[27]
            }
            auctions.append(auction)
        
        cur.close()
        conn.close()
        
        if auction_id:
            if auctions:
                return {
                    'statusCode': 200,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps(auctions[0]),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Auction not found'}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
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