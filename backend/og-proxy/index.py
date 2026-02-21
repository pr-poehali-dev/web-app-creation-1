'''OG-прокси: возвращает HTML с og:image для ботов мессенджеров (Telegram, WhatsApp и др.)'''

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def html_response(title: str, description: str, image_url: str, page_url: str, redirect_url: str) -> dict:
    safe_title = title.replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')
    safe_desc = description.replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')
    safe_image = image_url.replace('"', '&quot;')
    safe_page_url = page_url.replace('"', '&quot;')

    html = f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{safe_title}</title>
<meta name="description" content="{safe_desc}">
<meta property="og:title" content="{safe_title}">
<meta property="og:description" content="{safe_desc}">
<meta property="og:image" content="{safe_image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="{safe_page_url}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="ЕРТТП">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{safe_title}">
<meta name="twitter:description" content="{safe_desc}">
<meta name="twitter:image" content="{safe_image}">
<meta http-equiv="refresh" content="0; url={redirect_url}">
</head>
<body>
<p>Перенаправление... <a href="{redirect_url}">Нажмите здесь</a></p>
</body>
</html>"""
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
        },
        'body': html,
        'isBase64Encoded': False,
    }


def handler(event: dict, context) -> dict:
    '''OG-прокси для ботов мессенджеров. GET /?type=offer&id=... | ?type=request&id=... | ?type=auction&id=...'''

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': ''}

    schema = os.environ.get('DB_SCHEMA', 't_p42562714_web_app_creation_1')
    frontend_url = os.environ.get('FRONTEND_URL', 'https://erttp.ru').rstrip('/')
    default_image = 'https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/files/og-image-1771653741881.png'

    params = event.get('queryStringParameters') or {}
    item_type = params.get('type', '')
    item_id = params.get('id', '').replace("'", "")

    if not item_id or item_type not in ('offer', 'request', 'auction'):
        return {
            'statusCode': 302,
            'headers': {'Location': frontend_url, 'Access-Control-Allow-Origin': '*'},
            'body': '',
        }

    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if item_type == 'offer':
            cur.execute(f"""
                SELECT o.title, o.description, o.price_per_unit, o.unit,
                       (SELECT oi.url FROM {schema}.offer_images oi
                        JOIN {schema}.offer_image_relations oir ON oi.id = oir.image_id
                        WHERE oir.offer_id = o.id ORDER BY oir.sort_order LIMIT 1) as image_url
                FROM {schema}.offers o WHERE o.id = '{item_id}' LIMIT 1
            """)
            row = cur.fetchone()
            if not row:
                return {'statusCode': 302, 'headers': {'Location': f'{frontend_url}/offer/{item_id}', 'Access-Control-Allow-Origin': '*'}, 'body': ''}
            price = f"{float(row['price_per_unit']):,.0f} ₽/{row['unit']}".replace(',', ' ') if row.get('price_per_unit') else ''
            title = row['title']
            desc = f"{price}. {row['description'][:200] if row.get('description') else ''}".strip('. ')
            image = row.get('image_url') or default_image
            redirect = f'{frontend_url}/offer/{item_id}'

        elif item_type == 'request':
            cur.execute(f"""
                SELECT r.title, r.description, r.price_per_unit, r.unit,
                       (SELECT ri.url FROM {schema}.request_images ri
                        JOIN {schema}.request_image_relations rir ON ri.id = rir.image_id
                        WHERE rir.request_id = r.id ORDER BY rir.sort_order LIMIT 1) as image_url
                FROM {schema}.requests r WHERE r.id = '{item_id}' LIMIT 1
            """)
            row = cur.fetchone()
            if not row:
                return {'statusCode': 302, 'headers': {'Location': f'{frontend_url}/request/{item_id}', 'Access-Control-Allow-Origin': '*'}, 'body': ''}
            price = f"Бюджет: {float(row['price_per_unit']):,.0f} ₽/{row['unit']}".replace(',', ' ') if row.get('price_per_unit') else ''
            title = row['title']
            desc = f"{price}. {row['description'][:200] if row.get('description') else ''}".strip('. ')
            image = row.get('image_url') or default_image
            redirect = f'{frontend_url}/request/{item_id}'

        else:  # auction
            cur.execute(f"""
                SELECT a.title, a.description, a.current_bid,
                       (SELECT ai.url FROM {schema}.auction_images ai WHERE ai.auction_id = a.id ORDER BY ai.sort_order LIMIT 1) as image_url
                FROM {schema}.auctions a WHERE a.id = '{item_id}' LIMIT 1
            """)
            row = cur.fetchone()
            if not row:
                return {'statusCode': 302, 'headers': {'Location': f'{frontend_url}/auction/{item_id}', 'Access-Control-Allow-Origin': '*'}, 'body': ''}
            price = f"Текущая ставка: {float(row['current_bid']):,.0f} ₽".replace(',', ' ') if row.get('current_bid') else ''
            title = row['title']
            desc = f"{price}. {row['description'][:200] if row.get('description') else ''}".strip('. ')
            image = row.get('image_url') or default_image
            redirect = f'{frontend_url}/auction/{item_id}'

        page_url = f'{frontend_url}/{item_type}/{item_id}'
        return html_response(title, desc, image, page_url, redirect)

    finally:
        cur.close()
        conn.close()
