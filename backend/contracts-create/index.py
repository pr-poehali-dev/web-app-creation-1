'''
Business: Create new trading contract (futures or forward)
Args: event - dict with httpMethod, body, headers
      context - object with request_id
Returns: HTTP response dict with created contract
'''

import json
import os
from typing import Dict, Any
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
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
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        user_id = event.get('headers', {}).get('X-User-Id')
        
        if not user_id:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Требуется авторизация'}),
                'isBase64Encoded': False
            }
        
        body = json.loads(event.get('body', '{}'))
        
        contract_type = body.get('contractType')
        title = body.get('title')
        description = body.get('description', '')
        category = body.get('category')
        product_name = body.get('productName')
        quantity = body.get('quantity')
        unit = body.get('unit')
        price_per_unit = body.get('pricePerUnit')
        total_amount = body.get('totalAmount')
        delivery_date = body.get('deliveryDate')
        contract_start_date = body.get('contractStartDate')
        contract_end_date = body.get('contractEndDate')
        delivery_address = body.get('deliveryAddress', '')
        delivery_method = body.get('deliveryMethod', '')
        prepayment_percent = body.get('prepaymentPercent', 0)
        prepayment_amount = body.get('prepaymentAmount', 0)
        financing_available = body.get('financingAvailable', False)
        terms_conditions = body.get('termsConditions', '')
        min_purchase_quantity = body.get('minPurchaseQuantity', 0)
        discount_percent = body.get('discountPercent', 0)
        product_images = body.get('productImages', [])
        product_video_url = body.get('productVideoUrl', '')
        
        if not all([contract_type, title, category, product_name, quantity, unit, price_per_unit, 
                   delivery_date, contract_start_date, contract_end_date]):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Заполните все обязательные поля'}),
                'isBase64Encoded': False
            }
        
        conn = get_db_connection()
        
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT id, role FROM users WHERE id = %s", (int(user_id),))
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пользователь не найден'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    """INSERT INTO contracts (
                        contract_type, title, description, category, product_name, 
                        quantity, unit, price_per_unit, total_amount, delivery_date,
                        contract_start_date, contract_end_date, seller_id, delivery_address,
                        delivery_method, prepayment_percent, prepayment_amount, 
                        financing_available, terms_conditions, min_purchase_quantity, discount_percent,
                        product_images, product_video_url
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    ) RETURNING id, created_at""",
                    (contract_type, title, description, category, product_name, quantity, unit,
                     price_per_unit, total_amount, delivery_date, contract_start_date, 
                     contract_end_date, int(user_id), delivery_address, delivery_method,
                     prepayment_percent, prepayment_amount, financing_available, 
                     terms_conditions, min_purchase_quantity or None, discount_percent,
                     product_images if product_images else None, product_video_url or None)
                )
                
                result = cur.fetchone()
                contract_id = result['id']
                
                cur.execute(
                    """INSERT INTO contract_history (contract_id, user_id, action, description, new_status)
                       VALUES (%s, %s, %s, %s, %s)""",
                    (contract_id, int(user_id), 'created', 'Контракт создан', 'open')
                )
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'contractId': contract_id,
                        'message': 'Контракт успешно создан'
                    }),
                    'isBase64Encoded': False
                }
        finally:
            conn.close()
            
    except ValueError as e:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Internal server error: {str(e)}'}),
            'isBase64Encoded': False
        }