'''API для публичного просмотра запросов'''

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
    Публичное API для просмотра запросов
    GET / - список активных запросов с изображениями
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
                    r.id,
                    r.title,
                    r.description,
                    r.price_per_unit,
                    r.quantity,
                    r.unit,
                    r.status,
                    r.created_at,
                    r.user_id as buyer_id,
                    r.district,
                    CASE 
                        WHEN u.company_name IS NOT NULL AND u.company_name != '' THEN u.company_name
                        WHEN u.first_name IS NOT NULL OR u.last_name IS NOT NULL THEN 
                            TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')))
                        ELSE 'ID: ' || r.user_id::text
                    END as buyer_name
                FROM t_p42562714_web_app_creation_1.requests r
                LEFT JOIN t_p42562714_web_app_creation_1.users u ON r.user_id = u.id
                WHERE r.status = 'active'
                ORDER BY r.created_at DESC
                LIMIT 100
            """)
            requests_data = cur.fetchall()
            
            requests_list = []
            for req in requests_data:
                req_dict = dict(req)
                req_dict = decimal_to_float(req_dict)
                
                request_id = str(req_dict['id'])
                
                cur.execute("""
                    SELECT oi.url, oi.alt
                    FROM t_p42562714_web_app_creation_1.request_image_relations rir
                    JOIN t_p42562714_web_app_creation_1.offer_images oi ON rir.image_id = oi.id
                    WHERE rir.request_id = %s
                    ORDER BY rir.sort_order
                """, (request_id,))
                images_data = cur.fetchall()
                images = [img['url'] for img in images_data]
                
                buyer_id = req_dict.get('buyer_id')
                buyer_name = req_dict.get('buyer_name') or f'ID: {buyer_id}' if buyer_id else 'Неизвестный'
                
                requests_list.append({
                    'id': request_id,
                    'title': req_dict['title'],
                    'description': req_dict['description'],
                    'buyer': buyer_name,
                    'buyerId': str(buyer_id) if buyer_id else None,
                    'pricePerUnit': req_dict['price_per_unit'],
                    'budget': req_dict['price_per_unit'] * req_dict['quantity'],
                    'quantity': req_dict['quantity'],
                    'unit': req_dict['unit'],
                    'status': req_dict['status'],
                    'createdAt': req_dict['created_at'].isoformat() if req_dict['created_at'] else None,
                    'images': images,
                    'district': req_dict.get('district')
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'requests': requests_list, 'total': len(requests_list)}),
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
