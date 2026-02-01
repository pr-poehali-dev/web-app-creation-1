'''API для публичного просмотра предложений товаров'''

import json
import os
from typing import Dict, Any
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor


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
    '''
    Публичное API для просмотра предложений
    GET / - список активных предложений с изображениями
    '''
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
            cur.execute("""
                SELECT 
                    o.id,
                    o.title,
                    o.description,
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
                WHERE o.status = 'active'
                ORDER BY o.created_at DESC
                LIMIT 100
            """)
            offers = cur.fetchall()
            
            offers_list = []
            for offer in offers:
                offer_dict = dict(offer)
                offer_dict = decimal_to_float(offer_dict)
                
                offer_id = str(offer_dict['id'])
                
                cur.execute("""
                    SELECT oi.url, oi.alt
                    FROM t_p42562714_web_app_creation_1.offer_image_relations oir
                    JOIN t_p42562714_web_app_creation_1.offer_images oi ON oir.image_id = oi.id
                    WHERE oir.offer_id = %s
                    ORDER BY oir.sort_order
                """, (offer_id,))
                images_data = cur.fetchall()
                images = [img['url'] for img in images_data]
                
                video_id = offer_dict.get('video_id')
                videos = []
                if video_id:
                    cur.execute("""
                        SELECT url, thumbnail
                        FROM t_p42562714_web_app_creation_1.offer_videos
                        WHERE id = %s
                    """, (str(video_id),))
                    video_data = cur.fetchone()
                    if video_data:
                        videos = [{'url': video_data['url'], 'thumbnail': video_data['thumbnail']}]
                
                seller_id = offer_dict.get('seller_id')
                seller_name = offer_dict.get('seller_name') or f'ID: {seller_id}' if seller_id else 'Неизвестный'
                
                offers_list.append({
                    'id': offer_id,
                    'title': offer_dict['title'],
                    'description': offer_dict['description'],
                    'seller': seller_name,
                    'sellerId': str(seller_id) if seller_id else None,
                    'pricePerUnit': offer_dict['price_per_unit'],
                    'price': offer_dict['price_per_unit'],
                    'quantity': offer_dict['quantity'],
                    'unit': offer_dict['unit'],
                    'status': offer_dict['status'],
                    'createdAt': offer_dict['created_at'].isoformat() if offer_dict['created_at'] else None,
                    'images': images,
                    'videos': videos,
                    'district': offer_dict.get('district')
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'offers': offers_list, 'total': len(offers_list)}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        if conn:
            conn.close()
