import json
import os
import string
import random
import psycopg2

SCHEMA = 't_p42562714_web_app_creation_1'
SITE_URL = 'https://erttp.ru'

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

HTML_HEADERS = {
    **CORS_HEADERS,
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def gen_code(length=7):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=length))

def escape_html(s: str) -> str:
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')

def extract_offer_id(url: str) -> str | None:
    """Извлекаем UUID оффера из URL вида /offer/{uuid}"""
    import re
    m = re.search(r'/offer/([0-9a-f-]{36})', url)
    return m.group(1) if m else None

def extract_request_id(url: str) -> str | None:
    import re
    m = re.search(r'/request/([0-9a-f-]{36})', url)
    return m.group(1) if m else None

def get_offer_og(offer_id: str, conn) -> dict:
    cur = conn.cursor()
    safe_id = offer_id.replace("'", "''")
    cur.execute(f"""
        SELECT o.title, o.description, o.category,
               o.transport_route, o.transport_price, o.transport_negotiable,
               o.transport_date_time, o.price_per_unit, o.unit, o.quantity,
               o.sold_quantity, o.transport_waypoints,
               (SELECT i.url FROM {SCHEMA}.offer_images i
                JOIN {SCHEMA}.offer_image_relations r ON r.image_id = i.id
                WHERE r.offer_id = o.id ORDER BY r.position LIMIT 1) as image_url
        FROM {SCHEMA}.offers o
        WHERE o.id = '{safe_id}' AND o.status = 'active'
    """)
    row = cur.fetchone()
    cur.close()
    if not row:
        return {}
    title, desc, category, t_route, t_price, t_neg, t_dt, price_pu, unit, qty, sold, waypoints, img = row

    if category == 'transport' and t_route:
        tp = float(t_price or 0)
        pp = float(price_pu or 0)
        if t_neg:
            price_str = 'Цена договорная'
        elif tp > 0:
            price_str = f"{int(tp):,} ₽".replace(',', '\u00a0')
        elif pp > 0:
            price_str = f"{int(pp):,} ₽".replace(',', '\u00a0')
        else:
            price_str = ''

        date_str = ''
        if t_dt:
            try:
                from datetime import datetime
                d = datetime.fromisoformat(t_dt.replace('Z', '+00:00'))
                months = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек']
                date_str = f"{d.day} {months[d.month-1]}, {d.strftime('%H:%M')}"
            except Exception:
                date_str = t_dt

        remaining = (qty or 0) - (sold or 0)
        seats = remaining if remaining > 0 else qty or 0

        og_title = f"Пассажирские перевозки {t_route}"
        parts = []
        if price_str:
            parts.append(price_str)
        if date_str:
            parts.append(date_str)
        if seats:
            parts.append(f"{seats} мест")

        # Вейпоинты
        wps = waypoints if isinstance(waypoints, list) else []
        for wp in wps:
            if wp.get('isActive') and wp.get('price', 0) > 0:
                from_part = t_route.split(' - ')[0].strip() if ' - ' in t_route else t_route.split(' — ')[0].strip()
                parts.append(f"{from_part} — {wp['address']}: {int(wp['price']):,} ₽".replace(',', '\u00a0'))
                break

        og_desc = ' • '.join(parts)
    else:
        og_title = title
        pp = float(price_pu or 0)
        price_str = f"{int(pp):,} ₽/{unit}".replace(',', '\u00a0') if pp > 0 else ''
        og_desc = ' • '.join(filter(None, [price_str, desc[:120] if desc else '']))

    return {
        'title': og_title,
        'description': og_desc,
        'image': img or '',
        'url': f"{SITE_URL}/offer/{offer_id}",
    }

def build_og_html(og: dict, redirect_url: str) -> str:
    title = escape_html(og.get('title', 'ЕРТТП'))
    desc = escape_html(og.get('description', 'Единая Региональная Товарно-Торговая Площадка'))
    image = escape_html(og.get('image', ''))
    url = escape_html(og.get('url', redirect_url))
    site_name = 'ЕРТТП'
    logo = 'https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/bucket/ac1dbacf-5483-41dc-8ccd-fcd52e894f1b.png'
    og_image = image if image else logo

    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="0;url={escape_html(redirect_url)}">
<title>{title}</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="{site_name}">
<meta property="og:locale" content="ru_RU">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{og_image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{og_image}">
<link rel="canonical" href="{url}">
</head>
<body>
<p>Переходим на <a href="{escape_html(redirect_url)}">{title}</a>...</p>
<script>window.location.replace("{escape_html(redirect_url)}");</script>
</body>
</html>"""

def is_bot(event: dict) -> bool:
    ua = (event.get('headers') or {}).get('User-Agent', '')
    bots = ['TelegramBot', 'WhatsApp', 'facebookexternalhit', 'Twitterbot',
            'LinkedInBot', 'VKShare', 'Viber', 'Slackbot', 'Discordbot', 'curl', 'python-requests']
    return any(b.lower() in ua.lower() for b in bots)

def handler(event: dict, context) -> dict:
    """Создание и разрешение коротких ссылок с OG-превью для мессенджеров."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}

    if method == 'GET':
        code = params.get('code')
        if not code:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'code required'})}

        safe_code = code.replace("'", "''")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT original_url FROM {SCHEMA}.short_urls WHERE code = '{safe_code}'")
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'not found'})}

        original_url = row[0]
        cur.execute(f"UPDATE {SCHEMA}.short_urls SET hits = hits + 1 WHERE code = '{safe_code}'")
        conn.commit()

        # Боты мессенджеров — отдаём HTML с OG-тегами
        if is_bot(event):
            og = {}
            offer_id = extract_offer_id(original_url)
            if offer_id:
                og = get_offer_og(offer_id, conn)
            cur.close()
            conn.close()
            if not og:
                og = {'title': 'ЕРТТП', 'description': 'Единая Региональная Товарно-Торговая Площадка'}
            html = build_og_html(og, original_url)
            return {'statusCode': 200, 'headers': HTML_HEADERS, 'body': html}

        cur.close()
        conn.close()
        # Обычный пользователь (фронтенд) — JSON как раньше
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'url': original_url})}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        original_url = body.get('url', '').strip()
        if not original_url or len(original_url) > 2000:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'invalid url'})}

        conn = get_conn()
        cur = conn.cursor()
        safe_url = original_url.replace("'", "''")
        cur.execute(f"SELECT code FROM {SCHEMA}.short_urls WHERE original_url = '{safe_url}'")
        existing = cur.fetchone()
        if existing:
            code = existing[0]
        else:
            code = gen_code()
            for _ in range(5):
                cur.execute(f"SELECT 1 FROM {SCHEMA}.short_urls WHERE code = '{code}'")
                if not cur.fetchone():
                    break
                code = gen_code()
            cur.execute(f"INSERT INTO {SCHEMA}.short_urls (code, original_url) VALUES ('{code}', '{safe_url}')")
            conn.commit()
        cur.close()
        conn.close()

        short_url = f"{SITE_URL}/s/{code}"
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'short_url': short_url, 'code': code})}

    return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'method not allowed'})}