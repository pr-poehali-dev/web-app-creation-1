"""
Обновление аукциона пользователем.
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
                'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method not in ['POST', 'PUT']:
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
        action = body_data.get('action')  # 'update', 'reduce-price', 'stop'
        
        if not auction_id or not action:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'auctionId and action are required'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        # Проверяем принадлежность аукциона пользователю и его статус
        cur.execute("""
            SELECT status, start_date, current_bid, starting_price 
            FROM t_p42562714_web_app_creation_1.auctions 
            WHERE id = %s AND user_id = %s
        """, (auction_id, user_id))
        
        auction_data = cur.fetchone()
        
        if not auction_data:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Auction not found or you are not the owner'}),
                'isBase64Encoded': False
            }
        
        status, start_date, current_bid, starting_price = auction_data
        now = datetime.now()
        auction_started = start_date and start_date <= now
        
        # Полное редактирование (до начала аукциона)
        if action == 'update':
            if auction_started:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Нельзя редактировать аукцион после его начала'}),
                    'isBase64Encoded': False
                }
            
            # Обновляем все поля
            update_fields = []
            update_values = []
            
            if 'title' in body_data:
                update_fields.append('title = %s')
                update_values.append(body_data['title'])
            
            if 'description' in body_data:
                update_fields.append('description = %s')
                update_values.append(body_data['description'])
            
            if 'startingPrice' in body_data:
                update_fields.append('starting_price = %s')
                update_values.append(body_data['startingPrice'])
                update_fields.append('current_bid = %s')
                update_values.append(body_data['startingPrice'])
            
            if 'buyNowPrice' in body_data:
                update_fields.append('buy_now_price = %s')
                update_values.append(body_data['buyNowPrice'])
            
            if 'minBidStep' in body_data:
                update_fields.append('min_bid_step = %s')
                update_values.append(body_data['minBidStep'])
            
            if update_fields:
                update_values.extend([auction_id, user_id])
                query = f"""
                    UPDATE t_p42562714_web_app_creation_1.auctions 
                    SET {', '.join(update_fields)}
                    WHERE id = %s AND user_id = %s
                """
                cur.execute(query, update_values)
                conn.commit()
            
            # Обновляем изображения если предоставлены
            if 'images' in body_data and isinstance(body_data['images'], list):
                # Удаляем старые изображения
                cur.execute("""
                    DELETE FROM t_p42562714_web_app_creation_1.auction_images 
                    WHERE auction_id = %s
                """, (auction_id,))
                
                # Добавляем новые
                for idx, img in enumerate(body_data['images']):
                    cur.execute("""
                        INSERT INTO t_p42562714_web_app_creation_1.auction_images 
                        (auction_id, url, alt, sort_order) 
                        VALUES (%s, %s, %s, %s)
                    """, (auction_id, img['url'], img.get('alt', ''), idx))
                
                conn.commit()
        
        # Снижение цены (после начала аукциона)
        elif action == 'reduce-price':
            if not auction_started:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Аукцион еще не начался'}),
                    'isBase64Encoded': False
                }
            
            if status not in ['active', 'ending-soon']:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Можно снижать цену только у активных аукционов'}),
                    'isBase64Encoded': False
                }
            
            new_price = body_data.get('newPrice')
            
            if not new_price:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'newPrice is required'}),
                    'isBase64Encoded': False
                }
            
            # Проверяем что новая цена ниже текущей
            if new_price >= current_bid:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Новая цена должна быть ниже текущей'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                UPDATE t_p42562714_web_app_creation_1.auctions 
                SET current_bid = %s, starting_price = %s
                WHERE id = %s AND user_id = %s
            """, (new_price, new_price, auction_id, user_id))
            conn.commit()
        
        # Остановка аукциона (после начала)
        elif action == 'stop':
            if not auction_started:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Аукцион еще не начался'}),
                    'isBase64Encoded': False
                }
            
            if status not in ['active', 'ending-soon', 'upcoming']:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Этот аукцион нельзя остановить'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                UPDATE t_p42562714_web_app_creation_1.auctions 
                SET status = 'ended', end_date = %s
                WHERE id = %s AND user_id = %s
            """, (now, auction_id, user_id))
            conn.commit()
        
        else:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Invalid action'}),
                'isBase64Encoded': False
            }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'success': True, 'message': 'Аукцион обновлен'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }