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

        # Топ продавцов по завершённым сделкам
        cur.execute("""
            SELECT
                o.seller_id,
                COALESCE(NULLIF(TRIM(u.company_name), ''),
                         TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')),
                         'Пользователь') AS name,
                COUNT(*) AS deals,
                COALESCE(SUM(o.total_amount), 0) AS revenue
            FROM t_p42562714_web_app_creation_1.orders o
            LEFT JOIN t_p42562714_web_app_creation_1.users u ON u.id = o.seller_id
            WHERE o.status = 'completed'
            GROUP BY o.seller_id, u.company_name, u.first_name, u.last_name
            ORDER BY deals DESC
            LIMIT 5
        """)
        top_sellers = [
            {'name': r['name'], 'deals': r['deals'], 'revenue': float(r['revenue'])}
            for r in cur.fetchall()
        ]

        # Популярные категории по завершённым сделкам
        cur.execute("""
            SELECT
                COALESCE(NULLIF(offer_category, ''), 'Другое') AS category,
                COUNT(*) AS count
            FROM t_p42562714_web_app_creation_1.orders
            WHERE status = 'completed'
            GROUP BY category
            ORDER BY count DESC
            LIMIT 6
        """)
        rows = cur.fetchall()
        total_cat = sum(r['count'] for r in rows) or 1
        top_categories = [
            {'name': r['category'], 'count': r['count'], 'percentage': round(r['count'] / total_cat * 100)}
            for r in rows
        ]

        stats = {
            'totalUsers': total_users,
            'activeUsers': active_users,
            'verifiedUsers': verified_users,
            'activeOffers': active_offers,
            'activeRequests': active_requests,
            'activeAuctions': active_auctions,
            'completedOrders': completed_orders,
            'pendingVerifications': pending_verifications,
            'topSellers': top_sellers,
            'topCategories': top_categories,
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