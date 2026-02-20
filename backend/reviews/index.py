import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)

def get_schema():
    return os.environ.get('DB_SCHEMA', 'public')

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''API для работы с отзывами о продавцах после завершения заказов'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    path_params = event.get('queryStringParameters') or {}
    
    schema = get_schema()
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        print(f"[REVIEWS] method={method}, schema={schema}, params={path_params}")
        
        if method == 'GET':
            seller_id = path_params.get('seller_id')
            order_id = path_params.get('order_id')
            
            print(f"[GET] seller_id={seller_id}, order_id={order_id}")
            
            if order_id:
                cur.execute(f'''
                    SELECT * FROM {schema}.reviews 
                    WHERE order_id::text = %s
                ''', (order_id,))
                review = cur.fetchone()
                return success_response({'review': dict(review) if review else None})
            
            elif seller_id:
                cur.execute(f'''
                    SELECT 
                        id,
                        order_id,
                        reviewer_id,
                        reviewed_user_id,
                        rating,
                        comment,
                        seller_response,
                        seller_response_date,
                        created_at,
                        updated_at
                    FROM {schema}.reviews
                    WHERE reviewed_user_id = %s AND order_id IS NOT NULL
                    ORDER BY created_at DESC
                ''', (seller_id,))
                
                reviews = cur.fetchall()
                
                if reviews:
                    avg_rating = sum(r['rating'] for r in reviews) / len(reviews)
                else:
                    avg_rating = 0
                
                return success_response({
                    'reviews': [dict(r) for r in reviews],
                    'stats': {
                        'total_reviews': len(reviews),
                        'average_rating': round(avg_rating, 1)
                    }
                })
            
            else:
                return error_response('seller_id or order_id required', 400)
        
        elif method == 'POST':
            if not user_id:
                return error_response('Unauthorized', 401)
            
            body = json.loads(event.get('body', '{}'))
            order_id = body.get('order_id')
            seller_id = body.get('seller_id')
            rating = body.get('rating')
            comment = body.get('comment', '')
            
            if not all([order_id, seller_id, rating]):
                return error_response('order_id, seller_id and rating are required', 400)
            
            if not (1 <= rating <= 5):
                return error_response('rating must be between 1 and 5', 400)
            
            cur.execute(f'''
                SELECT id FROM {schema}.reviews 
                WHERE order_id::text = %s
            ''', (order_id,))
            
            if cur.fetchone():
                return error_response('Review already exists for this order', 400)
            
            cur.execute(f'''
                INSERT INTO {schema}.reviews 
                (order_id, reviewer_id, reviewed_user_id, rating, comment, created_at, updated_at)
                VALUES (%s::uuid, %s, %s, %s, %s, NOW(), NOW())
                RETURNING id, created_at
            ''', (order_id, user_id, seller_id, rating, comment))
            
            result = cur.fetchone()
            conn.commit()
            
            return success_response({
                'id': result['id'],
                'created_at': result['created_at'].isoformat() if result['created_at'] else None
            })
        
        elif method == 'PUT':
            if not user_id:
                return error_response('Unauthorized', 401)
            
            raw_body = event.get('body') or '{}'
            body = json.loads(raw_body) if raw_body else {}
            review_id = body.get('review_id')
            seller_response = body.get('seller_response')
            
            print(f"[PUT] user_id={user_id}, review_id={review_id}, has_response={bool(seller_response)}")
            
            if not review_id or not seller_response:
                return error_response('review_id and seller_response are required', 400)
            
            cur.execute(f'''
                SELECT reviewed_user_id FROM {schema}.reviews 
                WHERE id = %s
            ''', (review_id,))
            
            review = cur.fetchone()
            if not review:
                return error_response('Review not found', 404)
            
            if str(review['reviewed_user_id']) != str(user_id):
                return error_response('You can only respond to your own reviews', 403)
            
            cur.execute(f'''
                UPDATE {schema}.reviews 
                SET seller_response = %s, seller_response_date = NOW(), updated_at = NOW()
                WHERE id = %s
                RETURNING seller_response_date
            ''', (seller_response, review_id))
            
            result = cur.fetchone()
            conn.commit()
            
            return success_response({
                'seller_response_date': result['seller_response_date'].isoformat() if result['seller_response_date'] else None
            })
        
        else:
            return error_response('Method not allowed', 405)
    
    except Exception as e:
        if conn:
            conn.rollback()
        return error_response(str(e), 500)
    
    finally:
        if conn:
            conn.close()


def success_response(data: dict) -> dict:
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data, default=str),
        'isBase64Encoded': False
    }


def error_response(message: str, status_code: int) -> dict:
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': message}),
        'isBase64Encoded': False
    }