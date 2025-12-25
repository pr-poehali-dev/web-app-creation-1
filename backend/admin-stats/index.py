import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Получение статистики для админ-панели
    Возвращает количество активных пользователей, предложений, запросов и других сущностей
    '''
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
        
        # Общее количество пользователей
        cur.execute("SELECT COUNT(*) as total FROM t_p42562714_web_app_creation_1.users WHERE removed_at IS NULL")
        total_users = cur.fetchone()['total']
        
        # Активные пользователи (не заблокированные)
        cur.execute("""
            SELECT COUNT(*) as active 
            FROM t_p42562714_web_app_creation_1.users 
            WHERE removed_at IS NULL 
            AND is_active = true 
            AND (locked_until IS NULL OR locked_until < NOW())
        """)
        active_users = cur.fetchone()['active']
        
        # Верифицированные пользователи
        cur.execute("""
            SELECT COUNT(DISTINCT user_id) as verified 
            FROM t_p42562714_web_app_creation_1.user_verifications 
            WHERE status = 'approved'
        """)
        verified_users = cur.fetchone()['verified']
        
        # Активные предложения
        cur.execute("""
            SELECT COUNT(*) as total 
            FROM t_p42562714_web_app_creation_1.offers 
            WHERE status = 'active'
        """)
        active_offers = cur.fetchone()['total']
        
        # Активные запросы
        cur.execute("""
            SELECT COUNT(*) as total 
            FROM t_p42562714_web_app_creation_1.requests 
            WHERE status = 'active'
        """)
        active_requests = cur.fetchone()['total']
        
        # Активные аукционы
        cur.execute("""
            SELECT COUNT(*) as total 
            FROM t_p42562714_web_app_creation_1.auctions 
            WHERE status = 'active'
        """)
        active_auctions = cur.fetchone()['total']
        
        # Завершенные заказы
        cur.execute("""
            SELECT COUNT(*) as total 
            FROM t_p42562714_web_app_creation_1.orders 
            WHERE status = 'completed'
        """)
        completed_orders = cur.fetchone()['total']
        
        # Ожидающие верификацию
        cur.execute("""
            SELECT COUNT(*) as total 
            FROM t_p42562714_web_app_creation_1.user_verifications 
            WHERE status = 'pending'
        """)
        pending_verifications = cur.fetchone()['total']
        
        stats = {
            'totalUsers': total_users,
            'activeUsers': active_users,
            'verifiedUsers': verified_users,
            'activeOffers': active_offers,
            'activeRequests': active_requests,
            'activeAuctions': active_auctions,
            'completedOrders': completed_orders,
            'pendingVerifications': pending_verifications
        }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(stats),
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
