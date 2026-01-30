'''Автоматическая очистка старых архивных данных для оптимизации производительности'''

import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any
import psycopg2


def get_db_connection():
    """Подключение к базе данных"""
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    API для очистки старых архивных данных (автоматизация для масштабирования)
    
    Удаляет:
    - Архивные предложения старше 1 месяца
    - Завершенные/отмененные заказы старше 1 месяца  
    - Архивные запросы старше 1 месяца
    
    Защищает от переполнения БД при масштабировании до 100,000+ пользователей
    """
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    # Проверка admin ключа для безопасности
    request_headers = event.get('headers', {})
    admin_key = request_headers.get('X-Admin-Key') or request_headers.get('x-admin-key')
    expected_key = os.environ.get('ADMIN_CLEANUP_KEY', 'default-key-change-me')
    
    if admin_key != expected_key:
        return {
            'statusCode': 403,
            'headers': headers,
            'body': json.dumps({'error': 'Unauthorized - invalid admin key'}),
            'isBase64Encoded': False
        }
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Дата отсечения - 1 месяц назад (30 дней)
        cutoff_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        
        stats = {
            'offers_deleted': 0,
            'orders_deleted': 0,
            'requests_deleted': 0,
            'cutoff_date': cutoff_date
        }
        
        # 1. Удаляем старые архивные предложения
        cur.execute(f"""
            DELETE FROM t_p42562714_web_app_creation_1.offers
            WHERE status = 'archived' 
            AND created_at < '{cutoff_date}'::timestamp
        """)
        stats['offers_deleted'] = cur.rowcount
        
        # 2. Удаляем старые завершенные/отмененные заказы
        cur.execute(f"""
            DELETE FROM t_p42562714_web_app_creation_1.orders
            WHERE status IN ('completed', 'cancelled')
            AND order_date < '{cutoff_date}'::timestamp
        """)
        stats['orders_deleted'] = cur.rowcount
        
        # 3. Удаляем старые архивные запросы
        cur.execute(f"""
            DELETE FROM t_p42562714_web_app_creation_1.requests
            WHERE status = 'archived'
            AND created_at < '{cutoff_date}'::timestamp
        """)
        stats['requests_deleted'] = cur.rowcount
        
        conn.commit()
        cur.close()
        conn.close()
        
        total_deleted = stats['offers_deleted'] + stats['orders_deleted'] + stats['requests_deleted']
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'message': f'Successfully cleaned up {total_deleted} old records',
                'stats': stats,
                'note': 'Архивные данные старше 1 месяца удалены безвозвратно. Запускайте ежемесячно для оптимизации БД.'
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f'ERROR in cleanup: {str(e)}')
        print(f'Traceback: {error_trace}')
        
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }