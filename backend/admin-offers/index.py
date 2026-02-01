import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
from decimal import Decimal


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
    '''Бэкенд для управления предложениями в админ-панели v4'''
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
        conn = psycopg2.connect(database_url, cursor_factory=RealDictCursor)
        cur = conn.cursor()
        
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            search = query_params.get('search', '') if query_params else ''
            status_filter = query_params.get('status', 'all') if query_params else 'all'
            
            where_clauses = []
            params = []
            
            if search:
                search_pattern = f"%{search}%"
                where_clauses.append("(o.title ILIKE %s OR o.description ILIKE %s OR u.company_name ILIKE %s OR u.first_name ILIKE %s)")
                params.extend([search_pattern, search_pattern, search_pattern, search_pattern])
            
            if status_filter != 'all':
                where_clauses.append("o.status = %s")
                params.append(status_filter)
            
            where_sql = ' AND '.join(where_clauses) if where_clauses else '1=1'
            
            query = f"""
                SELECT 
                    o.id,
                    o.title,
                    o.description as product_name,
                    o.price_per_unit,
                    o.quantity,
                    o.unit,
                    o.status,
                    o.created_at,
                    o.user_id as seller_id,
                    o.district,
                    o.video_id,
                    CASE 
                        WHEN u.company_name IS NOT NULL AND u.company_name != '' THEN u.company_name
                        WHEN u.first_name IS NOT NULL OR u.last_name IS NOT NULL THEN 
                            TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')))
                        ELSE 'ID: ' || o.user_id::text
                    END as seller_name
                FROM t_p42562714_web_app_creation_1.offers o
                LEFT JOIN t_p42562714_web_app_creation_1.users u ON o.user_id = u.id
                WHERE {where_sql} AND o.status NOT IN ('archived', 'draft')
                ORDER BY o.created_at DESC
                LIMIT 100
            """
            
            cur.execute(query, tuple(params))
            offers = cur.fetchall()
            
            offers_list = []
            for offer in offers:
                offer_dict = dict(offer)
                offer_dict = decimal_to_float(offer_dict)
                total_price = offer_dict.get('price_per_unit', 0) * offer_dict.get('quantity', 1)
                seller_id = offer_dict.get('seller_id')
                seller_name = offer_dict.get('seller_name') or f'ID: {seller_id}' if seller_id else 'Неизвестный пользователь'
                
                offer_id = str(offer_dict['id'])
                
                cur.execute("""
                    SELECT oi.url, oi.alt
                    FROM t_p42562714_web_app_creation_1.offer_image_relations oir
                    JOIN t_p42562714_web_app_creation_1.offer_images oi ON oir.image_id = oi.id
                    WHERE oir.offer_id = %s
                    ORDER BY oir.sort_order
                """, (offer_id,))
                images_data = cur.fetchall()
                images = [{'url': img['url'], 'alt': img['alt']} for img in images_data]
                
                videos = []
                if offer_dict.get('video_id'):
                    cur.execute("""
                        SELECT url, thumbnail
                        FROM t_p42562714_web_app_creation_1.offer_videos
                        WHERE id = %s
                    """, (offer_dict.get('video_id'),))
                    video_data = cur.fetchone()
                    if video_data:
                        videos = [{'url': video_data['url'], 'thumbnail': video_data['thumbnail']}]
                
                offers_list.append({
                    'id': offer_id,
                    'title': offer_dict['title'] or offer_dict['product_name'],
                    'seller': seller_name,
                    'sellerId': str(seller_id) if seller_id else None,
                    'price': offer_dict['price_per_unit'] if offer_dict['price_per_unit'] else 0,
                    'totalPrice': total_price,
                    'quantity': offer_dict['quantity'] if offer_dict['quantity'] else 0,
                    'unit': offer_dict['unit'],
                    'status': offer_dict['status'] or 'open',
                    'createdAt': offer_dict['created_at'].isoformat() if offer_dict['created_at'] else None,
                    'images': images,
                    'videos': videos,
                    'district': offer_dict.get('district'),
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
            new_status = body_data.get('status')
            
            if not offer_id or not new_status:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'offerId and status are required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                """UPDATE t_p42562714_web_app_creation_1.offers 
                   SET status = %s 
                   WHERE id = %s""",
                (new_status, offer_id)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'offerId': offer_id, 'status': new_status}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            query_params = event.get('queryStringParameters') or {}
            offer_id = query_params.get('offerId')
            
            if not offer_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'offerId is required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                """UPDATE t_p42562714_web_app_creation_1.offers 
                   SET status = 'archived' 
                   WHERE id = %s""",
                (offer_id,)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'offerId': offer_id}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        import traceback
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e), 'traceback': traceback.format_exc()}),
            'isBase64Encoded': False
        }
    
    finally:
        if conn:
            conn.close()