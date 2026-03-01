"""
Получение списка аукционов текущего пользователя.
"""
import json
import os
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import psycopg2
from typing import Dict, Any


def decimal_to_float(obj):
    """Рекурсивно конвертирует Decimal в float"""
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_to_float(item) for item in obj]
    return obj

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method not in ['GET', 'DELETE']:
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('x-user-id') or headers.get('X-User-Id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Unauthorized'}),
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        if method == 'DELETE':
            body = json.loads(event.get('body', '{}'))
            auction_id = body.get('auctionId')
            
            if not auction_id:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Missing auctionId'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                UPDATE t_p42562714_web_app_creation_1.auctions
                SET status = 'cancelled'
                WHERE id = CAST(%s AS INTEGER) AND user_id = CAST(%s AS INTEGER)
            """, (auction_id, user_id))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        # Получаем часовой пояс из запроса или используем Якутск по умолчанию
        params = event.get('queryStringParameters') or {}
        tz_offset = int(params.get('timezoneOffset', 9))
        user_tz = timezone(timedelta(hours=tz_offset))
        now = datetime.now(user_tz).replace(tzinfo=None)
        
        # Активируем аукционы, которые должны начаться
        cur.execute(f"""
            UPDATE t_p42562714_web_app_creation_1.auctions 
            SET status = 'active' 
            WHERE status = 'pending' AND start_date <= %s
        """, (now,))
        
        # Завершаем аукционы, время которых истекло
        cur.execute(f"""
            UPDATE t_p42562714_web_app_creation_1.auctions 
            SET status = 'ended' 
            WHERE status IN ('active', 'ending-soon') AND end_date <= %s
        """, (now,))
        
        # Помечаем аукционы как "скоро завершится" (меньше 24 часов)
        cur.execute(f"""
            UPDATE t_p42562714_web_app_creation_1.auctions 
            SET status = 'ending-soon' 
            WHERE status = 'active' 
            AND end_date > %s 
            AND end_date <= %s + INTERVAL '24 hours'
        """, (now, now))
        
        conn.commit()
        
        # Получаем аукционы пользователя (исключаем отмененные)
        query = f"""
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
            WHERE a.user_id = %s AND a.status != 'cancelled'
            GROUP BY a.id
            ORDER BY a.created_at DESC
        """
        
        cur.execute(query, (int(user_id),))
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
                'quantity': decimal_to_float(row[6]) if row[6] else None,
                'unit': row[7],
                'startingPrice': decimal_to_float(row[8]),
                'currentBid': decimal_to_float(row[9]),
                'minBidStep': decimal_to_float(row[10]),
                'buyNowPrice': decimal_to_float(row[11]) if row[11] else None,
                'hasVAT': row[12],
                'vatRate': decimal_to_float(row[13]) if row[13] else None,
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