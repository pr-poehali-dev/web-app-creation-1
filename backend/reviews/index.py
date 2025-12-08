import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Бизнес: Управление отзывами и рейтингами пользователей
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
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
            query_params = event.get('queryStringParameters', {}) or {}
            action = query_params.get('action', '')
            
            if action == 'stats':
                user_id = query_params.get('userId')
                if not user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'userId required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    SELECT 
                        COUNT(*) as total_reviews,
                        COALESCE(AVG(rating), 0) as average_rating,
                        COALESCE(AVG(quality_rating), 0) as quality_average,
                        COALESCE(AVG(delivery_rating), 0) as delivery_average,
                        COALESCE(AVG(communication_rating), 0) as communication_average,
                        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as rating_1,
                        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as rating_2,
                        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as rating_3,
                        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as rating_4,
                        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as rating_5
                    FROM reviews
                    WHERE reviewed_user_id = CAST(%s AS INTEGER)
                """, (user_id,))
                
                stats_row = cur.fetchone()
                
                avg_rating = float(stats_row['average_rating']) if stats_row['average_rating'] else 0.0
                quality_avg = float(stats_row['quality_average']) if stats_row['quality_average'] and float(stats_row['quality_average']) > 0 else None
                delivery_avg = float(stats_row['delivery_average']) if stats_row['delivery_average'] and float(stats_row['delivery_average']) > 0 else None
                comm_avg = float(stats_row['communication_average']) if stats_row['communication_average'] and float(stats_row['communication_average']) > 0 else None
                
                stats = {
                    'averageRating': avg_rating,
                    'totalReviews': int(stats_row['total_reviews']),
                    'ratingDistribution': {
                        '1': int(stats_row['rating_1'] or 0),
                        '2': int(stats_row['rating_2'] or 0),
                        '3': int(stats_row['rating_3'] or 0),
                        '4': int(stats_row['rating_4'] or 0),
                        '5': int(stats_row['rating_5'] or 0),
                    },
                    'qualityAverage': quality_avg,
                    'deliveryAverage': delivery_avg,
                    'communicationAverage': comm_avg,
                }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'stats': stats}),
                    'isBase64Encoded': False
                }
            
            elif action == 'can-review':
                contract_id = query_params.get('contractId')
                if not contract_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'contractId required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("SELECT id FROM reviews WHERE contract_id = CAST(%s AS INTEGER)", (contract_id,))
                existing_review = cur.fetchone()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'canReview': existing_review is None}),
                    'isBase64Encoded': False
                }
            
            else:
                user_id = query_params.get('userId')
                if not user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'userId required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    SELECT 
                        r.id,
                        r.contract_id,
                        r.reviewer_id,
                        r.reviewed_user_id,
                        r.rating,
                        r.title,
                        r.comment,
                        r.quality_rating,
                        r.delivery_rating,
                        r.communication_rating,
                        r.is_verified_purchase,
                        r.created_at,
                        r.updated_at,
                        u.first_name || ' ' || u.last_name as reviewer_name,
                        u.user_type as reviewer_type,
                        '' as offer_title
                    FROM reviews r
                    LEFT JOIN users u ON r.reviewer_id = u.id
                    WHERE r.reviewed_user_id = CAST(%s AS INTEGER)
                    ORDER BY r.created_at DESC
                    LIMIT 100
                """, (user_id,))
                
                reviews_data = cur.fetchall()
                
                reviews = []
                for review in reviews_data:
                    reviews.append({
                        'id': str(review['id']),
                        'contractId': str(review['contract_id']),
                        'reviewerId': str(review['reviewer_id']),
                        'reviewedUserId': str(review['reviewed_user_id']),
                        'rating': review['rating'],
                        'title': review['title'],
                        'comment': review['comment'],
                        'qualityRating': review['quality_rating'],
                        'deliveryRating': review['delivery_rating'],
                        'communicationRating': review['communication_rating'],
                        'isVerifiedPurchase': review['is_verified_purchase'],
                        'createdAt': review['created_at'].isoformat() if review['created_at'] else None,
                        'updatedAt': review['updated_at'].isoformat() if review['updated_at'] else None,
                        'reviewerName': review['reviewer_name'],
                        'reviewerType': review['reviewer_type'],
                        'offerTitle': review['offer_title'],
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'reviews': reviews}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            contract_id = body_data.get('contractId')
            reviewer_id = body_data.get('reviewerId')
            reviewed_user_id = body_data.get('reviewedUserId')
            rating = body_data.get('rating')
            title = body_data.get('title')
            comment = body_data.get('comment')
            
            if not all([contract_id, reviewer_id, reviewed_user_id, rating, title, comment]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing required fields'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("SELECT id FROM reviews WHERE contract_id = %s", (contract_id,))
            existing_review = cur.fetchone()
            
            if existing_review:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Review already exists for this contract'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                SELECT c.id, c.status, c.buyer_id, o.user_id as seller_id
                FROM contracts c
                LEFT JOIN offers o ON c.offer_id = o.id
                WHERE c.id = %s
            """, (contract_id,))
            
            contract = cur.fetchone()
            
            if not contract:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Contract not found'}),
                    'isBase64Encoded': False
                }
            
            if contract['status'] != 'completed':
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Can only review completed contracts'}),
                    'isBase64Encoded': False
                }
            
            is_verified_purchase = (str(contract['buyer_id']) == str(reviewer_id))
            
            cur.execute("""
                INSERT INTO reviews (
                    contract_id,
                    reviewer_id,
                    reviewed_user_id,
                    rating,
                    title,
                    comment,
                    quality_rating,
                    delivery_rating,
                    communication_rating,
                    is_verified_purchase,
                    created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                RETURNING id, created_at
            """, (
                contract_id,
                reviewer_id,
                reviewed_user_id,
                rating,
                title,
                comment,
                body_data.get('qualityRating'),
                body_data.get('deliveryRating'),
                body_data.get('communicationRating'),
                is_verified_purchase
            ))
            
            new_review = cur.fetchone()
            conn.commit()
            
            review = {
                'id': str(new_review['id']),
                'contractId': str(contract_id),
                'reviewerId': str(reviewer_id),
                'reviewedUserId': str(reviewed_user_id),
                'rating': rating,
                'title': title,
                'comment': comment,
                'qualityRating': body_data.get('qualityRating'),
                'deliveryRating': body_data.get('deliveryRating'),
                'communicationRating': body_data.get('communicationRating'),
                'isVerifiedPurchase': is_verified_purchase,
                'createdAt': new_review['created_at'].isoformat(),
            }
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'review': review}),
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