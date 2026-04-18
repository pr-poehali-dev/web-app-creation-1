'''
Трекинг посетителей сайта.
POST / — зафиксировать визит (session_id, page, referrer, user_id опционально)
GET /?action=stats — статистика для админа (день/неделя/месяц/всего)
'''

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

DATABASE_URL = os.environ.get('DATABASE_URL')
RESP_HEADERS = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}


def get_db():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''Фиксирует визиты на сайт и возвращает статистику посещаемости'''
    method = (event.get('httpMethod') or '').upper()

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    params = event.get('queryStringParameters') or {}
    req_headers = event.get('headers') or {}
    user_id_raw = req_headers.get('X-User-Id') or req_headers.get('x-user-id')
    user_id = int(user_id_raw) if user_id_raw and str(user_id_raw).isdigit() else None

    # ── GET stats — только для авторизованных ─────────────────────────────────
    if method == 'GET' and params.get('action') == 'stats':
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute('''
                    SELECT
                        COUNT(*) FILTER (WHERE visited_at >= NOW() - INTERVAL '1 day') AS today,
                        COUNT(DISTINCT session_id) FILTER (WHERE visited_at >= NOW() - INTERVAL '1 day') AS today_uniq,
                        COUNT(*) FILTER (WHERE visited_at >= NOW() - INTERVAL '7 days') AS week,
                        COUNT(DISTINCT session_id) FILTER (WHERE visited_at >= NOW() - INTERVAL '7 days') AS week_uniq,
                        COUNT(*) FILTER (WHERE visited_at >= NOW() - INTERVAL '30 days') AS month,
                        COUNT(DISTINCT session_id) FILTER (WHERE visited_at >= NOW() - INTERVAL '30 days') AS month_uniq,
                        COUNT(*) AS total,
                        COUNT(DISTINCT session_id) AS total_uniq
                    FROM site_visits
                ''')
                totals = dict(cur.fetchone())

                cur.execute('''
                    SELECT DATE(visited_at) AS day, COUNT(*) AS visits, COUNT(DISTINCT session_id) AS unique_visitors
                    FROM site_visits
                    WHERE visited_at >= NOW() - INTERVAL '30 days'
                    GROUP BY DATE(visited_at)
                    ORDER BY day ASC
                ''')
                daily = [dict(r) for r in cur.fetchall()]
                for d in daily:
                    d['day'] = str(d['day'])

                cur.execute('''
                    SELECT page, COUNT(*) AS visits
                    FROM site_visits
                    WHERE visited_at >= NOW() - INTERVAL '7 days'
                    GROUP BY page
                    ORDER BY visits DESC
                    LIMIT 10
                ''')
                top_pages = [dict(r) for r in cur.fetchall()]

            return {
                'statusCode': 200,
                'headers': RESP_HEADERS,
                'body': json.dumps({'totals': totals, 'daily': daily, 'topPages': top_pages}),
                'isBase64Encoded': False
            }
        finally:
            conn.close()

    # ── POST — фиксируем визит ─────────────────────────────────────────────────
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        session_id = (body.get('sessionId') or '').strip()[:64]
        page = (body.get('page') or '/').strip()[:500]
        referrer = (body.get('referrer') or None)
        if referrer:
            referrer = referrer[:500]
        ip = (req_headers.get('X-Forwarded-For') or req_headers.get('x-forwarded-for') or
              req_headers.get('X-Real-IP') or '').split(',')[0].strip()[:64] or None
        ua = (req_headers.get('User-Agent') or req_headers.get('user-agent') or None)

        if not session_id:
            return {'statusCode': 400, 'headers': RESP_HEADERS,
                    'body': json.dumps({'error': 'sessionId обязателен'}), 'isBase64Encoded': False}

        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    'INSERT INTO site_visits (session_id, user_id, page, referrer, user_agent, ip) VALUES (%s, %s, %s, %s, %s, %s)',
                    (session_id, user_id, page, referrer, ua, ip)
                )
                conn.commit()
            return {'statusCode': 200, 'headers': RESP_HEADERS,
                    'body': json.dumps({'ok': True}), 'isBase64Encoded': False}
        finally:
            conn.close()

    return {'statusCode': 405, 'headers': RESP_HEADERS,
            'body': json.dumps({'error': 'Method not allowed'}), 'isBase64Encoded': False}
