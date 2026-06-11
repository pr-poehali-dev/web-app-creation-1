"""
Размещение ставки на аукционе.
"""
import json
import os
import threading
import http.client
from datetime import datetime, timedelta
import psycopg2
from typing import Dict, Any


def _send_push_to_user(user_id: int, title: str, message: str, url: str):
    """Отправка push-уведомления пользователю в фоновом потоке"""
    try:
        payload = json.dumps({
            'userId': user_id,
            'type': 'auction_bid',
            'title': title,
            'message': message,
            'url': url
        })
        conn = http.client.HTTPSConnection('functions.poehali.dev', timeout=8)
        conn.request('POST', '/a1c8fafd-b64f-45e5-b9b9-0a050cca4f7a',
                     payload, {'Content-Type': 'application/json'})
        resp = conn.getresponse()
        resp.read()
        conn.close()
    except Exception as e:
        print(f'[AUCTION_PUSH] Error sending to user {user_id}: {e}')


def _notify_auction_participants(auction_id: str, bidder_id: int, auction_title: str,
                                  new_amount: float, owner_id: int):
    """Уведомляем владельца и всех предыдущих участников аукциона"""
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        schema = 't_p42562714_web_app_creation_1'

        cur.execute(f"""
            SELECT DISTINCT user_id FROM {schema}.bids
            WHERE auction_id = %s AND user_id != %s
        """, (auction_id, bidder_id))
        participants = [row[0] for row in cur.fetchall()]
        cur.close()
        conn.close()

        url = f'/auction/{auction_id}'
        amount_str = f'{new_amount:,.0f}'.replace(',', ' ')
        title_short = auction_title[:40] + '...' if len(auction_title) > 40 else auction_title

        threads = []
        for uid in participants:
            t = threading.Thread(
                target=_send_push_to_user,
                args=(uid, 'Вас перебили!',
                      f'Новая ставка {amount_str} ₽ на «{title_short}»', url),
                daemon=True
            )
            threads.append(t)
            t.start()

        if owner_id != bidder_id:
            t = threading.Thread(
                target=_send_push_to_user,
                args=(owner_id, 'Новая ставка на аукционе',
                      f'{amount_str} ₽ на «{title_short}»', url),
                daemon=True
            )
            threads.append(t)
            t.start()

    except Exception as e:
        print(f'[AUCTION_PUSH] Notify participants error: {e}')


def check_rate_limit(conn, identifier: str, endpoint: str, max_requests: int = 10, window_minutes: int = 1) -> bool:
    with conn.cursor() as cur:
        window_start = datetime.now() - timedelta(minutes=window_minutes)
        cur.execute(
            "SELECT request_count, window_start FROM rate_limits WHERE identifier = %s AND endpoint = %s",
            (identifier, endpoint)
        )
        result = cur.fetchone()
        if result:
            if result[1] > window_start:
                if result[0] >= max_requests:
                    return False
                cur.execute(
                    "UPDATE rate_limits SET request_count = request_count + 1 WHERE identifier = %s AND endpoint = %s",
                    (identifier, endpoint)
                )
            else:
                cur.execute(
                    "UPDATE rate_limits SET request_count = 1, window_start = CURRENT_TIMESTAMP WHERE identifier = %s AND endpoint = %s",
                    (identifier, endpoint)
                )
        else:
            cur.execute(
                "INSERT INTO rate_limits (identifier, endpoint, request_count, window_start) VALUES (%s, %s, 1, CURRENT_TIMESTAMP)",
                (identifier, endpoint)
            )
        conn.commit()
        return True

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
    
    source_ip = event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')

    try:
        conn_rl = psycopg2.connect(os.environ['DATABASE_URL'])
        if not check_rate_limit(conn_rl, f"{source_ip}:{user_id}", 'place_bid', max_requests=10, window_minutes=1):
            conn_rl.close()
            return {
                'statusCode': 429,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Слишком много ставок. Подождите минуту.'}),
                'isBase64Encoded': False
            }
        conn_rl.close()
    except Exception:
        pass

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
        
        auction_title = ''
        cur.execute("""
            SELECT title FROM t_p42562714_web_app_creation_1.auctions WHERE id = %s
        """, (auction_id,))
        title_row = cur.fetchone()
        if title_row:
            auction_title = title_row[0]

        cur.close()
        conn.close()

        threading.Thread(
            target=_notify_auction_participants,
            args=(auction_id, int(user_id), auction_title, float(amount), int(owner_id)),
            daemon=True
        ).start()

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