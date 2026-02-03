import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    '''Удаление всех тестовых данных из базы'''
    
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Session'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    # Проверка adminSession из localStorage
    admin_session = event.get('headers', {}).get('X-Admin-Session', '')
    if admin_session != 'true':
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Access denied. Admin session required.'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    schema = 't_p42562714_web_app_creation_1'
    
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor()
    
    try:
        
        # Удаление всех данных (в правильном порядке из-за внешних ключей)
        cursor.execute(f"DELETE FROM {schema}.verification_documents")
        docs_deleted = cursor.rowcount
        
        cursor.execute(f"DELETE FROM {schema}.user_verifications")
        verifications_deleted = cursor.rowcount
        
        cursor.execute(f"DELETE FROM {schema}.bids")
        bids_deleted = cursor.rowcount
        
        cursor.execute(f"DELETE FROM {schema}.reviews")
        reviews_deleted = cursor.rowcount
        
        cursor.execute(f"DELETE FROM {schema}.orders")
        orders_deleted = cursor.rowcount
        
        cursor.execute(f"DELETE FROM {schema}.offer_image_relations")
        offer_relations_deleted = cursor.rowcount
        
        cursor.execute(f"DELETE FROM {schema}.offer_images")
        offer_images_deleted = cursor.rowcount
        
        cursor.execute(f"DELETE FROM {schema}.offer_videos")
        offer_videos_deleted = cursor.rowcount
        
        cursor.execute(f"DELETE FROM {schema}.offers")
        offers_deleted = cursor.rowcount
        
        cursor.execute(f"DELETE FROM {schema}.auction_images")
        auction_images_deleted = cursor.rowcount
        
        cursor.execute(f"DELETE FROM {schema}.auctions")
        auctions_deleted = cursor.rowcount
        
        cursor.execute(f"DELETE FROM {schema}.request_image_relations")
        request_relations_deleted = cursor.rowcount
        
        cursor.execute(f"DELETE FROM {schema}.requests")
        requests_deleted = cursor.rowcount
        
        cursor.execute(f"DELETE FROM {schema}.password_reset_tokens")
        tokens_deleted = cursor.rowcount
        
        cursor.execute(f"DELETE FROM {schema}.push_subscriptions")
        subscriptions_deleted = cursor.rowcount
        
        cursor.execute(f"DELETE FROM {schema}.rate_limits")
        rate_limits_deleted = cursor.rowcount
        
        # Удаляем всех пользователей кроме админов
        cursor.execute(f"DELETE FROM {schema}.users WHERE role != 'admin'")
        users_deleted = cursor.rowcount
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'deleted': {
                    'users': users_deleted,
                    'verifications': verifications_deleted,
                    'documents': docs_deleted,
                    'offers': offers_deleted,
                    'auctions': auctions_deleted,
                    'requests': requests_deleted,
                    'bids': bids_deleted,
                    'orders': orders_deleted,
                    'reviews': reviews_deleted
                }
            })
        }
        
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
    finally:
        cursor.close()
        conn.close()