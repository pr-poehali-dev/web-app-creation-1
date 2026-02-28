'''Автоматическое архивирование истёкших запросов, предложений и откликов'''
import json
import os
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor


def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    """
    Архивирует запросы, предложения и отклики с истёкшим сроком публикации.
    GET / - запустить архивирование (также принимает POST)
    """
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {**headers, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'},
            'body': ''
        }

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    now = datetime.utcnow()

    # 1. Архивируем запросы с истёкшим expiry_date
    cur.execute("""
        UPDATE requests
        SET status = 'archived', archived_at = %s, updated_at = %s
        WHERE status = 'active'
          AND expiry_date IS NOT NULL
          AND expiry_date < %s
        RETURNING id
    """, (now, now, now))
    archived_requests = [row['id'] for row in cur.fetchall()]

    # 2. Архивируем предложения с истёкшим expiry_date
    cur.execute("""
        UPDATE offers
        SET status = 'archived', archived_at = %s, updated_at = %s
        WHERE status = 'active'
          AND expiry_date IS NOT NULL
          AND expiry_date < %s
        RETURNING id
    """, (now, now, now))
    archived_offers = [row['id'] for row in cur.fetchall()]

    # 3. Архивируем отклики (orders) для архивированных запросов и предложений
    # — статусы не принятых/не завершённых: new, counter_offer, accepted -> archived
    archived_request_ids = archived_requests
    archived_offer_ids = archived_offers

    archived_orders = []

    if archived_offer_ids:
        placeholders = ','.join(['%s'] * len(archived_offer_ids))
        cur.execute(f"""
            UPDATE orders
            SET status = 'archived', archived_at = %s, updated_at = %s
            WHERE offer_id IN ({placeholders})
              AND status IN ('new', 'counter_offer', 'accepted')
            RETURNING id
        """, [now, now] + archived_offer_ids)
        archived_orders += [row['id'] for row in cur.fetchall()]

    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'success': True,
            'archived': {
                'requests': len(archived_requests),
                'offers': len(archived_offers),
                'orders': len(archived_orders)
            },
            'archived_at': now.isoformat()
        })
    }
