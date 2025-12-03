import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Бэкенд для управления предложениями в админ-панели
    Args: event - dict с httpMethod, body, queryStringParameters
          context - объект с атрибутами request_id, function_name
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'}),
            'isBase64Encoded': False
        }
    
    conn = None
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            query_params = event.get('queryStringParameters', {})
            search = query_params.get('search', '')
            status_filter = query_params.get('status', 'all')
            
            where_clauses = []
            if search:
                where_clauses.append(f"(c.title ILIKE '%{search}%' OR c.product_name ILIKE '%{search}%' OR u.company_name ILIKE '%{search}%' OR u.first_name ILIKE '%{search}%')")
            
            if status_filter != 'all':
                where_clauses.append(f"c.status = '{status_filter}'")
            
            where_sql = ' AND '.join(where_clauses) if where_clauses else '1=1'
            
            query = f"""
                SELECT 
                    c.id,
                    c.title,
                    c.product_name,
                    c.price_per_unit,
                    c.quantity,
                    c.unit,
                    c.status,
                    c.created_at,
                    COALESCE(u.company_name, u.first_name || ' ' || u.last_name) as seller_name
                FROM contracts c
                LEFT JOIN users u ON c.seller_id = u.id
                WHERE {where_sql}
                ORDER BY c.created_at DESC
                LIMIT 100
            """
            
            cur.execute(query)
            offers = cur.fetchall()
            
            offers_list = []
            for offer in offers:
                total_price = float(offer.get('price_per_unit', 0)) * float(offer.get('quantity', 1))
                offers_list.append({
                    'id': str(offer['id']),
                    'title': offer['title'] or offer['product_name'],
                    'seller': offer['seller_name'] or 'Неизвестный продавец',
                    'price': float(offer['price_per_unit']) if offer['price_per_unit'] else 0,
                    'totalPrice': total_price,
                    'quantity': float(offer['quantity']) if offer['quantity'] else 0,
                    'unit': offer['unit'],
                    'status': offer['status'] or 'open',
                    'createdAt': offer['created_at'].isoformat() if offer['created_at'] else None
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'offers': offers_list, 'total': len(offers_list)}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            offer_id = body_data.get('offerId')
            action = body_data.get('action')
            
            if not offer_id or not action:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'offerId and action required'}),
                    'isBase64Encoded': False
                }
            
            if action == 'approve':
                cur.execute("UPDATE contracts SET status = 'open' WHERE id = %s", (offer_id,))
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Offer approved'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'reject':
                cur.execute("UPDATE contracts SET status = 'cancelled' WHERE id = %s", (offer_id,))
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Offer rejected'}),
                    'isBase64Encoded': False
                }
        
        elif method == 'DELETE':
            body_data = json.loads(event.get('body', '{}'))
            offer_id = body_data.get('offerId')
            
            if not offer_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'offerId required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("DELETE FROM contracts WHERE id = %s", (offer_id,))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Offer deleted'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        if conn:
            conn.close()
