"""
Размещение ставки на аукционе.
"""
import json
import os
from datetime import datetime
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Unauthorized'}),
            'isBase64Encoded': False
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        auction_id = body_data.get('auctionId')
        amount = body_data.get('amount')
        
        if not auction_id or not amount:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'auctionId and amount are required'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        # Получаем данные аукциона
        cur.execute("""
            SELECT status, current_bid, min_bid_step, starting_price, user_id, end_date
            FROM t_p42562714_web_app_creation_1.auctions 
            WHERE id = %s
        """, (auction_id,))
        
        auction_data = cur.fetchone()
        
        if not auction_data:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Auction not found'}),
                'isBase64Encoded': False
            }
        
        status, current_bid, min_bid_step, starting_price, owner_id, end_date = auction_data
        
        # Проверка что аукцион активен
        if status not in ['active', 'ending-soon']:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Аукцион не активен'}),
                'isBase64Encoded': False
            }
        
        # Проверка что пользователь не владелец
        if int(user_id) == int(owner_id):
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Вы не можете делать ставки на свой аукцион'}),
                'isBase64Encoded': False
            }
        
        # Проверка минимальной ставки
        min_next_bid = float(current_bid or starting_price) + float(min_bid_step)
        if float(amount) < min_next_bid:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({
                    'error': f'Минимальная ставка: {min_next_bid} ₽',
                    'minBid': min_next_bid
                }),
                'isBase64Encoded': False
            }
        
        # Размещаем ставку
        cur.execute("""
            INSERT INTO t_p42562714_web_app_creation_1.bids 
            (auction_id, user_id, amount) 
            VALUES (%s, %s, %s)
            RETURNING id, created_at
        """, (auction_id, user_id, amount))
        
        bid_id, created_at = cur.fetchone()
        
        # Обновляем текущую цену и счётчик ставок
        cur.execute("""
            UPDATE t_p42562714_web_app_creation_1.auctions 
            SET current_bid = %s, bid_count = bid_count + 1
            WHERE id = %s
        """, (amount, auction_id))
        
        conn.commit()
        
        # Получаем имя пользователя
        cur.execute("""
            SELECT first_name, last_name, company_name, user_type 
            FROM t_p42562714_web_app_creation_1.users 
            WHERE id = %s
        """, (user_id,))
        
        user_data = cur.fetchone()
        user_name = 'Участник'
        if user_data:
            first_name, last_name, company_name, user_type = user_data
            if user_type == 'legal-entity' and company_name:
                user_name = company_name
            elif first_name and last_name:
                user_name = f"{first_name} {last_name}"
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({
                'success': True,
                'bid': {
                    'id': bid_id,
                    'auctionId': auction_id,
                    'userId': int(user_id),
                    'userName': user_name,
                    'amount': float(amount),
                    'timestamp': created_at.isoformat() if created_at else datetime.now().isoformat(),
                    'isWinning': True
                }
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }