'''OG-прокси: возвращает HTML с og:image для ботов мессенджеров (Telegram, WhatsApp и др.)'''

import json
import os
import urllib.request
from urllib.parse import quote
from xml.sax.saxutils import escape
import psycopg2
from psycopg2.extras import RealDictCursor


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def html_response(title: str, description: str, image_url: str, page_url: str, redirect_url: str, site_name: str = 'ЕРТТП', og_type: str = 'product') -> dict:
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
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="{site_name}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{safe_title}">
<meta name="twitter:description" content="{safe_desc}">
<meta name="twitter:image" content="{safe_image}">
<script>window.location.replace("{redirect_url}")</script>
</head>
<body>
<p>Перенаправление... <a href="{redirect_url}">Нажмите здесь</a></p>
</body>
</html>"""
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=60',
            'Access-Control-Allow-Origin': '*',
        },
        'body': html,
        'isBase64Encoded': False,
    }


SITEMAP_SITE = 'https://erttp.ru'
SITEMAP_SCHEMA = os.environ.get('DB_SCHEMA', 't_p42562714_web_app_creation_1')

SITEMAP_STATIC = [
    ('/', 'hourly', '1.0'),
    ('/zaprosy', 'hourly', '0.9'),
    ('/auction', 'hourly', '0.9'),
    ('/home', 'weekly', '0.7'),
    ('/trading', 'daily', '0.7'),
    ('/market', 'daily', '0.6'),
    ('/support', 'monthly', '0.5'),
    ('/games', 'weekly', '0.4'),
    ('/terms', 'yearly', '0.3'),
    ('/privacy', 'yearly', '0.3'),
    ('/offer-agreement', 'yearly', '0.3'),
]



def sitemap_response() -> dict:
    '''XML-карта сайта с активными объявлениями'''
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(f"""
        SELECT 'offer', id::text, to_char(COALESCE(updated_at, created_at), 'YYYY-MM-DD')
          FROM {SITEMAP_SCHEMA}.offers WHERE status = 'active'
        UNION ALL
        SELECT 'request', id::text, to_char(COALESCE(updated_at, created_at), 'YYYY-MM-DD')
          FROM {SITEMAP_SCHEMA}.requests WHERE status = 'active'
        UNION ALL
        SELECT 'auction', id::text, to_char(COALESCE(updated_at, created_at), 'YYYY-MM-DD')
          FROM {SITEMAP_SCHEMA}.auctions WHERE status IN ('active', 'ending-soon', 'upcoming')
        LIMIT 45000
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    parts = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path, freq, prio in SITEMAP_STATIC:
        parts.append(f'<url><loc>{SITEMAP_SITE}{path}</loc><changefreq>{freq}</changefreq><priority>{prio}</priority></url>')
    for kind, item_id, lastmod in rows:
        loc = escape(f'{SITEMAP_SITE}/{kind}/{item_id}')
        mod = f'<lastmod>{lastmod}</lastmod>' if lastmod else ''
        parts.append(f'<url><loc>{loc}</loc>{mod}<changefreq>daily</changefreq><priority>0.8</priority></url>')
    parts.append('</urlset>')

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
        },
        'body': '\n'.join(parts),
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

    if item_type == 'sitemap':
        return sitemap_response()
    item_id = params.get('id', '').replace("'", "")

    # Статичные страницы сайта
    STATIC_PAGES = {
        'brain-booster': {
            'title': 'Нейро-звук для стимуляции мозга — ЕРТТП',
            'desc': 'Бинауральные ритмы для фокуса, снятия стресса и бодрости. Выбери режим — Фокус, Энергия, Расслабление — и включи нейростимуляцию прямо в браузере.',
            'image': 'https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/files/og-image-1771653741881.png',
            'path': '/brain-booster',
        },
    }

    GAMES_ORIGIN = 'https://erttp.ru'
    GAME_PAGES = {
        'chess': ('Приглашение в игру «Шахматы»', 'Тебя приглашают на партию в шахматы. Нажми, чтобы присоединиться!', 'games-og-chess.jpg'),
        'checkers': ('Приглашение в игру «Шашки»', 'Тебя приглашают на партию в шашки. Нажми, чтобы присоединиться!', 'games-og-checkers.jpg'),
        'poker': ('Приглашение в игру «Покер»', 'Тебя приглашают за стол в покер. Нажми, чтобы присоединиться!', 'games-og-poker.jpg'),
        'durak': ('Приглашение в карточную игру «Дурак»', 'Тебя приглашают сыграть в переводного дурака. Нажми, чтобы присоединиться!', 'games-og-durak.jpg'),
        'baarys': ('Приглашение в игру «Баарыс»', 'Тебя приглашают на партию в Баарыс. Нажми, чтобы присоединиться!', 'games-og-baarys.jpg'),
        'nardy': ('Приглашение в игру «Длинные нарды»', 'Тебя приглашают на партию в Длинные нарды. Нажми, чтобы присоединиться!', 'games-og-nardy.jpg'),
    }
    short_g = ''.join(ch for ch in params.get('g', '') if ch.isalnum())[:41]
    if short_g:
        letters = {'c': 'chess', 's': 'checkers', 'p': 'poker', 'd': 'durak', 'b': 'baarys', 'n': 'nardy'}
        if short_g[0] in letters and len(short_g) > 1:
            item_type, item_id = 'game', letters[short_g[0]]
            params = {**params, 'c': short_g[1:]}
        elif short_g == 'club':
            item_type, item_id = 'game', 'club'
    if item_type == 'game':
        code = ''.join(ch for ch in params.get('c', '') if ch.isalnum())[:40]
        frm = ''.join(ch for ch in params.get('f', '') if ch.isalnum())[:40]
        if item_id in GAME_PAGES and code:
            title, desc, img = GAME_PAGES[item_id]
            redirect = f"{GAMES_ORIGIN}/games/invite/{code}" + (f"?from={frm}" if frm else '')
            return html_response(title, desc, f"{GAMES_ORIGIN}/{img}", redirect, redirect, 'Игровой клуб ЕРТТП', 'website')
        title = 'Игровой клуб — шахматы, шашки, карты и покер онлайн'
        desc = 'Играй с друзьями онлайн: шахматы, шашки, дурак, Баарыс и покер. Заходи и присоединяйся!'
        return html_response(title, desc, f"{GAMES_ORIGIN}/games-og.jpg", f"{GAMES_ORIGIN}/games", f"{GAMES_ORIGIN}/games", 'Игровой клуб ЕРТТП', 'website')

    if item_type == 'page' and item_id in STATIC_PAGES:
        p = STATIC_PAGES[item_id]
        page_url = f"{frontend_url}{p['path']}"
        return html_response(p['title'], p['desc'], p['image'], page_url, page_url)

    if item_type == 'market':
        ticker = ''.join(ch for ch in params.get('id', '') if ch.isalnum())[:20].upper()
        market = 'futures' if params.get('m') == 'futures' else 'shares'
        name = (params.get('name') or ticker)[:80]
        if not ticker:
            return {'statusCode': 302, 'headers': {'Location': f'{frontend_url}/market', 'Access-Control-Allow-Origin': '*'}, 'body': ''}
        price_line = ''
        if market == 'shares':
            try:
                req = urllib.request.Request(
                    f'https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities/{ticker}.json?iss.meta=off&iss.only=marketdata,securities',
                    headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=3) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                cols = data['marketdata']['columns']
                row = data['marketdata']['data'][0]
                md = dict(zip(cols, row))
                last = md.get('LAST')
                pct = md.get('LASTTOPREVPRICE')
                if last:
                    price_line = f"{float(last):,.2f} ₽".replace(',', '\u00a0')
                    if pct is not None:
                        price_line += f" ({'+' if float(pct) > 0 else ''}{float(pct):.2f}%)"
                    price_line += '. '
                sec = dict(zip(data['securities']['columns'], data['securities']['data'][0]))
                if not params.get('name') and sec.get('SHORTNAME'):
                    name = sec['SHORTNAME']
            except Exception:
                price_line = ''
        title = f'{name} ({ticker}) — котировка и ИИ-обзор'
        desc = f'{price_line}График, новости и ИИ-обзор компании: отчётность, риски и перспективы. Откройте на ЕРТТП.'
        redirect = f'{frontend_url}/market?ticker={quote(ticker)}&name={quote(name)}&tab={market}'
        return html_response(title, desc, default_image, redirect, redirect, 'ЕРТТП — Рынок', 'website')

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
                       o.category, o.transport_route, o.transport_price,
                       o.transport_negotiable, o.transport_date_time,
                       o.quantity, o.sold_quantity,
                       (SELECT oi.url FROM {schema}.offer_images oi
                        JOIN {schema}.offer_image_relations oir ON oi.id = oir.image_id
                        WHERE oir.offer_id = o.id ORDER BY oir.sort_order LIMIT 1) as image_url
                FROM {schema}.offers o WHERE o.id = '{item_id}' LIMIT 1
            """)
            row = cur.fetchone()
            if not row:
                return {'statusCode': 302, 'headers': {'Location': f'{frontend_url}/offer/{item_id}', 'Access-Control-Allow-Origin': '*'}, 'body': ''}

            if row.get('category') == 'transport' and row.get('transport_route'):
                t_price = float(row['transport_price'] or 0)
                p_price = float(row['price_per_unit'] or 0)
                if row.get('transport_negotiable'):
                    price = 'Цена договорная'
                elif t_price > 0:
                    price = f"{t_price:,.0f} ₽".replace(',', '\u00a0')
                elif p_price > 0:
                    price = f"{p_price:,.0f} ₽".replace(',', '\u00a0')
                else:
                    price = ''

                date_str = ''
                if row.get('transport_date_time'):
                    try:
                        from datetime import datetime
                        d = datetime.fromisoformat(str(row['transport_date_time']).replace('Z', '+00:00'))
                        months = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек']
                        date_str = f"{d.day} {months[d.month-1]}, {d.strftime('%H:%M')}"
                    except Exception:
                        date_str = str(row['transport_date_time'])

                remaining = (row.get('quantity') or 0) - (row.get('sold_quantity') or 0)
                seats = f"{remaining} мест" if remaining > 0 else ''

                title = f"Пассажирские перевозки {row['transport_route']}"
                parts = [p for p in [price, date_str, seats] if p]
                desc = ' • '.join(parts)
            elif row.get('category') == 'utilities':
                title = row['title']
                category_label = 'Услуга'
                desc = f"{category_label}. {row['description'][:200] if row.get('description') else ''}".strip('. ')
            else:
                p_price = float(row['price_per_unit'] or 0)
                price = f"{p_price:,.0f} ₽/{row['unit']}".replace(',', '\u00a0') if p_price > 0 else ''
                title = row['title']
                desc = f"{price}. {row['description'][:200] if row.get('description') else ''}".strip('. ')

            image = row.get('image_url') or default_image
            redirect = f'{frontend_url}/offer/{item_id}'

        elif item_type == 'request':
            cur.execute(f"""
                SELECT r.title, r.description, r.price_per_unit, r.unit, r.category,
                       (SELECT oi.url FROM {schema}.offer_images oi
                        JOIN {schema}.request_image_relations rir ON oi.id = rir.image_id
                        WHERE rir.request_id = r.id LIMIT 1) as image_url
                FROM {schema}.requests r WHERE r.id = '{item_id}' LIMIT 1
            """)
            row = cur.fetchone()
            if not row:
                return {'statusCode': 302, 'headers': {'Location': f'{frontend_url}/request/{item_id}', 'Access-Control-Allow-Origin': '*'}, 'body': ''}
            price = f"Бюджет: {float(row['price_per_unit']):,.0f} ₽/{row['unit']}".replace(',', ' ') if row.get('price_per_unit') else ''
            title = row['title']
            desc = f"{price}. {row['description'][:200] if row.get('description') else ''}".strip('. ')
            image = row.get('image_url') or f'{frontend_url}/og-request.png'
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