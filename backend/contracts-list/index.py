'''
Business: Get list of trading contracts with filters
Args: event - dict with httpMethod, queryStringParameters
      context - object with request_id
Returns: HTTP response dict with contracts list
'''

import json
import os
from typing import Dict, Any
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
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        params = event.get('queryStringParameters', {}) or {}
        status = params.get('status', 'open')
        category = params.get('category')
        contract_type = params.get('type')
        limit = int(params.get('limit', '50'))
        offset = int(params.get('offset', '0'))
        
        conn = get_db_connection()
        
        try:
            with conn.cursor() as cur:
                query = """
                    SELECT 
                        c.*,
                        u.first_name as seller_first_name,
                        u.last_name as seller_last_name,
                        COALESCE(AVG(r.rating), 0) as seller_rating
                    FROM contracts c
                    LEFT JOIN users u ON c.seller_id = u.id
                    LEFT JOIN reviews r ON r.reviewed_user_id = c.seller_id
                    WHERE c.status = %s
                """
                
                query_params = [status]
                
                if category:
                    query += " AND c.category = %s"
                    query_params.append(category)
                
                if contract_type:
                    query += " AND c.contract_type = %s"
                    query_params.append(contract_type)
                
                query += " GROUP BY c.id, u.first_name, u.last_name"
                query += " ORDER BY c.created_at DESC"
                query += " LIMIT %s OFFSET %s"
                
                query_params.extend([limit, offset])
                
                cur.execute(query, tuple(query_params))
                contracts = cur.fetchall()
                
                cur.execute("SELECT COUNT(*) as total FROM contracts WHERE status = %s", (status,))
                total = cur.fetchone()['total']
                
                contracts_list = []
                for contract in contracts:
                    contract_dict = dict(contract)
                    contract_dict['sellerFirstName'] = contract_dict.pop('seller_first_name')
                    contract_dict['sellerLastName'] = contract_dict.pop('seller_last_name')
                    contract_dict['sellerRating'] = float(contract_dict.pop('seller_rating'))
                    contract_dict['contractType'] = contract_dict.pop('contract_type')
                    contract_dict['productName'] = contract_dict.pop('product_name')
                    contract_dict['productSpecs'] = contract_dict.pop('product_specs')
                    contract_dict['pricePerUnit'] = float(contract_dict.pop('price_per_unit'))
                    contract_dict['totalAmount'] = float(contract_dict.pop('total_amount'))
                    contract_dict['deliveryDate'] = str(contract_dict.pop('delivery_date'))
                    contract_dict['contractStartDate'] = str(contract_dict.pop('contract_start_date'))
                    contract_dict['contractEndDate'] = str(contract_dict.pop('contract_end_date'))
                    contract_dict['sellerId'] = contract_dict.pop('seller_id')
                    contract_dict['buyerId'] = contract_dict.pop('buyer_id')
                    contract_dict['deliveryAddress'] = contract_dict.pop('delivery_address')
                    contract_dict['deliveryMethod'] = contract_dict.pop('delivery_method')
                    contract_dict['logisticsPartnerId'] = contract_dict.pop('logistics_partner_id')
                    contract_dict['prepaymentPercent'] = float(contract_dict.pop('prepayment_percent') or 0)
                    contract_dict['prepaymentAmount'] = float(contract_dict.pop('prepayment_amount') or 0)
                    contract_dict['financingAvailable'] = contract_dict.pop('financing_available')
                    contract_dict['termsConditions'] = contract_dict.pop('terms_conditions')
                    contract_dict['minPurchaseQuantity'] = float(contract_dict.pop('min_purchase_quantity') or 0)
                    contract_dict['discountPercent'] = float(contract_dict.pop('discount_percent') or 0)
                    contract_dict['viewsCount'] = contract_dict.pop('views_count')
                    contract_dict['createdAt'] = str(contract_dict.pop('created_at'))
                    contract_dict['updatedAt'] = str(contract_dict.pop('updated_at'))
                    contract_dict['quantity'] = float(contract_dict['quantity'])
                    
                    contracts_list.append(contract_dict)
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'contracts': contracts_list,
                        'total': total,
                        'limit': limit,
                        'offset': offset
                    }),
                    'isBase64Encoded': False
                }
        finally:
            conn.close()
            
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Internal server error: {str(e)}'}),
            'isBase64Encoded': False
        }
