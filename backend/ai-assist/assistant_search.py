'''Поиск для ассистента: Яндекс Поиск по интернету и объявления площадки ЕРТТП.'''

import base64
import os
import re
import html
from typing import Any, Dict, List
from xml.etree import ElementTree
import requests
from concurrent.futures import ThreadPoolExecutor, wait

SITE = 'https://erttp.ru'
GREETING = re.compile(r'^(привет|здравствуй\w*|добр\w+ (утро|день|вечер)|спасибо|благодарю|ок|хорошо|пока|ага|да|нет)[\s!.,?]*$', re.I)
MARKET_WORDS = re.compile(r'купить|куплю|продать|продаю|поставщик|поставк|закуп|найди|найти|ищу|нужен|нужна|нужно|предложени|запрос|аукцион|лот|цена|стоимост|заказать|услуг', re.I)
STOP = {'как', 'что', 'где', 'когда', 'почему', 'какой', 'какая', 'какие', 'это', 'для', 'мне', 'нам', 'есть', 'или', 'найди', 'найти', 'купить', 'нужен', 'нужна', 'нужно', 'ищу', 'хочу', 'можно', 'сколько', 'стоит', 'пожалуйста', 'расскажи', 'подскажи'}


def needs_search(message: str) -> bool:
    text = message.strip()
    return len(text) > 3 and not GREETING.match(text)


def _clean(node) -> str:
    if node is None:
        return ''
    return html.unescape(re.sub(r'\s+', ' ', ''.join(node.itertext()))).strip()


def yandex_web_search(query: str, limit: int = 6) -> List[Dict[str, str]]:
    '''Яндекс Search API v2: возвращает список {title, url, text}.'''
    resp = requests.post(
        'https://searchapi.api.cloud.yandex.net/v2/web/search',
        headers={'Authorization': f"Api-Key {os.environ['YANDEX_API_KEY']}", 'Content-Type': 'application/json'},
        json={
            'query': {'searchType': 'SEARCH_TYPE_RU', 'queryText': query[:400], 'familyMode': 'FAMILY_MODE_MODERATE'},
            'groupSpec': {'groupMode': 'GROUP_MODE_DEEP', 'groupsOnPage': str(limit), 'docsInGroup': '1'},
            'maxPassages': '3',
            'region': '225',
            'l10N': 'LOCALIZATION_RU',
            'folderId': os.environ['YANDEX_FOLDER_ID'],
            'responseFormat': 'FORMAT_XML',
        },
        timeout=12,
    )
    if resp.status_code >= 400:
        raise RuntimeError(f'Yandex Search HTTP {resp.status_code}: {resp.text[:300]}')
    raw = base64.b64decode(resp.json()['rawData'])
    root = ElementTree.fromstring(raw)
    items = []
    for doc in root.iter('doc'):
        url = (doc.findtext('url') or '').strip()
        if not url:
            continue
        passages = ' … '.join(_clean(p) for p in doc.iter('passage'))
        text = passages or _clean(doc.find('headline'))
        items.append({'title': _clean(doc.find('title'))[:120], 'url': url, 'text': text[:700]})
        if len(items) >= limit:
            break
    return items


def make_search_query(message: str, history: List[Dict[str, str]]) -> str:
    '''Короткие уточнения («а цена?») дополняем последним вопросом пользователя.'''
    text = message.strip()
    if len(text.split()) <= 3:
        prev = [h['text'] for h in history if h['role'] == 'user']
        if prev:
            text = f'{prev[-1][:200]} {text}'
    return text[:400]


def site_listings(cur, schema: str, message: str, limit: int = 5) -> List[Dict[str, Any]]:
    '''Ищет активные предложения, запросы и аукционы площадки по словам из вопроса.'''
    if not MARKET_WORDS.search(message):
        return []
    words = [w for w in re.findall(r'[A-Za-zА-Яа-яЁё0-9]{3,}', message.lower()) if w not in STOP][:5]
    if not words:
        return []
    stems = [w[:-2] if len(w) > 5 else w for w in words]
    cond = ' OR '.join(["title ILIKE %s"] * len(stems))
    args = [f'%{s}%' for s in stems]
    cur.execute(
        f'''(SELECT 'offer' AS kind, id::text AS id, title, price_per_unit AS price, unit FROM {schema}.offers
              WHERE status = 'active' AND ({cond}) ORDER BY created_at DESC LIMIT {limit})
            UNION ALL
            (SELECT 'request', id::text, title, price_per_unit, unit FROM {schema}.requests
              WHERE status = 'active' AND ({cond}) ORDER BY created_at DESC LIMIT {limit})
            UNION ALL
            (SELECT 'auction', id::text, title, starting_price, unit FROM {schema}.auctions
              WHERE status IN ('active', 'ending-soon', 'upcoming') AND ({cond}) ORDER BY created_at DESC LIMIT {limit})''',
        args * 3,
    )
    return [dict(r) for r in cur.fetchall()]


KIND_NAMES = {'offer': 'Предложение', 'request': 'Запрос', 'auction': 'Аукцион'}


def listings_context(items: List[Dict[str, Any]]) -> str:
    lines = []
    for it in items:
        price = f", {float(it['price']):,.0f} ₽/{it.get('unit') or 'ед.'}".replace(',', ' ') if it.get('price') else ''
        lines.append(f"- {KIND_NAMES[it['kind']]}: {it['title']}{price} — {SITE}/{it['kind']}/{it['id']}")
    return '\n'.join(lines)


def web_context(results: List[Dict[str, str]]) -> str:
    return '\n\n'.join(
        f"[{i}] {r['title']}\n{r['url']}\nФрагмент: {r['text']}" + (f"\nТекст страницы: {r['page']}" if r.get('page') else '')
        for i, r in enumerate(results, 1)
    )


UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36', 'Accept-Language': 'ru-RU,ru;q=0.9'}


def _page_text(url: str) -> str:
    r = requests.get(url, headers=UA, timeout=4)
    if r.status_code >= 400 or 'html' not in r.headers.get('Content-Type', 'html'):
        return ''
    r.encoding = r.apparent_encoding if not r.encoding or r.encoding.lower() == 'iso-8859-1' else r.encoding
    body = re.sub(r'(?is)<(script|style|noscript|svg|header|footer|nav)[^>]*>.*?</\1>', ' ', r.text[:600000])
    body = re.sub(r'(?s)<[^>]+>', ' ', body)
    return re.sub(r'\s+', ' ', html.unescape(body)).strip()


def _relevant(text: str, query: str, size: int = 1800) -> str:
    words = [w[:6] for w in re.findall(r'[A-Za-zА-Яа-яЁё0-9]{3,}', query.lower()) if w not in STOP]
    if not words:
        return text[:size]
    low = text.lower()
    best, best_score = 0, -1
    for start in range(0, max(1, len(text) - 300), 300):
        chunk = low[start:start + size]
        score = sum(chunk.count(w) for w in words) + len(re.findall(r'\d', chunk)) * 0.05
        if score > best_score:
            best, best_score = start, score
    return text[best:best + size]


def enrich_with_pages(results: List[Dict[str, str]], query: str, top: int = 3) -> None:
    '''Параллельно читает первые страницы выдачи и добавляет самый релевантный фрагмент текста.'''
    pool = ThreadPoolExecutor(max_workers=top)
    futures = {pool.submit(_page_text, r['url']): r for r in results[:top]}
    done, _ = wait(futures, timeout=5)
    for f in done:
        try:
            text = f.result()
        except Exception:
            continue
        if len(text) > 200:
            futures[f]['page'] = _relevant(text, query)
    pool.shutdown(wait=False, cancel_futures=True)
