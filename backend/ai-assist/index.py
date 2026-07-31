"""
ИИ-помощник для улучшения текстов в предложениях и контрактах через YandexGPT API. v3
Также содержит раздел "Рынок" (фондовый/фьючерсный): котировки MOEX, новости, платный ИИ-обзор.

POST /ai-assist
Body: { action: string, title?: string, description?: string, category?: string,
        productName?: string, termsConditions?: string, contractType?: string }
Возвращает: { result: string }

Действия раздела "Рынок" (не требуют GPT, кроме market_review):
GET  /?action=market_search&q=... — поиск тикера/инструмента на MOEX
GET  /?action=market_quote&ticker=...&engine=stock|futures&market=shares|index|forts&board=... — котировка + свечи
GET  /?action=market_news&ticker=...&name=... — новости по активу из RSS
POST /  { action: 'market_review', ticker, name, purchaseId } — платный ИИ-обзор (после оплаты)
"""
import json
import os
import re
import urllib.request
import urllib.parse
from datetime import datetime, timedelta
import requests
import psycopg2
from psycopg2.extras import RealDictCursor


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
}

MOEX_BASE = "https://iss.moex.com/iss"

NEWS_FEEDS = [
    "https://rssexport.rbc.ru/rbcnews/news/30/full.rss",
    "https://www.finmarket.ru/rss/news.asp",
    "https://www.interfax.ru/rss.asp",
]


def call_yandex_gpt(prompt: str, max_tokens: int = 400) -> str:
    api_key = os.environ["YANDEX_API_KEY"]
    folder_id = os.environ["YANDEX_FOLDER_ID"]
    response = requests.post(
        "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Api-Key {api_key}",
            "x-folder-id": folder_id,
        },
        json={
            "modelUri": f"gpt://{folder_id}/yandexgpt-lite",
            "completionOptions": {
                "stream": False,
                "temperature": 0.7,
                "maxTokens": max_tokens,
            },
            "messages": [
                {
                    "role": "system",
                    "text": "Ты помощник для торговой платформы ЕРТТП (Единая Российская Торговая Площадка). Отвечай кратко, строго по заданию, без лишних пояснений."
                },
                {"role": "user", "text": prompt}
            ],
        },
        timeout=25,
    )
    response.raise_for_status()
    return response.json()["result"]["alternatives"][0]["message"]["text"].strip()


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"], cursor_factory=RealDictCursor)


def _moex_get(path: str, params: dict) -> dict:
    qs = urllib.parse.urlencode(params)
    url = f"{MOEX_BASE}/{path}.json?{qs}"
    req = urllib.request.Request(url, headers={"User-Agent": "erttp-market/1.0"})
    with urllib.request.urlopen(req, timeout=12) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _rows_to_dicts(block: dict) -> list:
    cols = block.get("columns", [])
    data = block.get("data", [])
    return [dict(zip(cols, row)) for row in data]


def market_search(query: str) -> dict:
    """Поиск тикера/инструмента по названию или коду на MOEX."""
    if not query or len(query.strip()) < 1:
        return {"results": []}
    raw = _moex_get("securities", {"q": query.strip(), "iss.meta": "off"})
    items = _rows_to_dicts(raw.get("securities", {}))
    results = []
    seen = set()
    for it in items:
        secid = it.get("secid")
        if not secid or secid in seen:
            continue
        if not it.get("is_traded"):
            continue
        seen.add(secid)
        results.append({
            "ticker": secid,
            "name": it.get("name") or it.get("shortname") or secid,
            "shortname": it.get("shortname"),
            "type": it.get("group"),
        })
        if len(results) >= 15:
            break
    return {"results": results}


# Пресеты популярных инструментов — engine/market/board для быстрого доступа
KNOWN_BOARDS = {
    "shares": {"engine": "stock", "market": "shares", "board": "TQBR"},
    "index": {"engine": "stock", "market": "index", "board": "SNDX"},
    "futures": {"engine": "futures", "market": "forts", "board": "RFUD"},
}


def _detect_board(ticker: str, market_hint: str) -> dict:
    if market_hint in KNOWN_BOARDS:
        return KNOWN_BOARDS[market_hint]
    # Фьючерсы MOEX почти всегда заканчиваются буквой месяца + цифрой года
    if re.match(r"^[A-Z]{2,4}[FGHJKMNQUVXZ]\d$", ticker or ""):
        return KNOWN_BOARDS["futures"]
    if ticker in ("IMOEX", "RTSI", "MOEXBC"):
        return KNOWN_BOARDS["index"]
    return KNOWN_BOARDS["shares"]


def market_quote(ticker: str, market_hint: str = "") -> dict:
    """Текущая котировка + свечи за последний квартал для графика."""
    ticker = (ticker or "").strip().upper()
    if not ticker:
        return {"error": "ticker обязателен"}

    board_info = _detect_board(ticker, market_hint)
    engine, market, board = board_info["engine"], board_info["market"], board_info["board"]

    try:
        raw = _moex_get(
            f"engines/{engine}/markets/{market}/boards/{board}/securities/{ticker}",
            {"iss.meta": "off", "iss.only": "marketdata,securities"},
        )
    except Exception as e:
        return {"error": f"Не удалось получить котировку: {e}"}

    md_rows = _rows_to_dicts(raw.get("marketdata", {}))
    sec_rows = _rows_to_dicts(raw.get("securities", {}))
    if not md_rows:
        return {"error": "Инструмент не найден или рынок закрыт"}

    md = md_rows[0]
    sec = sec_rows[0] if sec_rows else {}

    last = md.get("LAST") or md.get("LASTVALUE") or md.get("CURRENTVALUE")
    change = md.get("LASTCHANGE") or md.get("LASTCHANGETOOPEN")
    change_pct = md.get("LASTCHANGEPRCNT") or md.get("LASTCHANGETOOPENPRC") or md.get("LASTCHANGEPRC")

    till = datetime.now().strftime("%Y-%m-%d")
    since = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
    candles = []
    try:
        craw = _moex_get(
            f"engines/{engine}/markets/{market}/boards/{board}/securities/{ticker}/candles",
            {"iss.meta": "off", "interval": "24", "from": since, "till": till},
        )
        crows = _rows_to_dicts(craw.get("candles", {}))
        candles = [
            {
                "date": (c.get("begin") or "")[:10],
                "open": c.get("open"),
                "close": c.get("close"),
                "high": c.get("high"),
                "low": c.get("low"),
                "volume": c.get("volume"),
            }
            for c in crows
        ]
    except Exception:
        candles = []

    return {
        "ticker": ticker,
        "name": sec.get("SECNAME") or sec.get("SHORTNAME") or ticker,
        "last": last,
        "change": change,
        "changePercent": change_pct,
        "open": md.get("OPEN") or md.get("OPENVALUE"),
        "high": md.get("HIGH"),
        "low": md.get("LOW"),
        "updateTime": md.get("UPDATETIME") or md.get("TIME"),
        "candles": candles,
        "market": market,
        "engine": engine,
    }


def _strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text or "").strip()


def market_news(ticker: str, name: str) -> dict:
    """Ищем свежие новости в RSS-лентах, фильтруя по тикеру/названию актива."""
    keywords = [k.strip().lower() for k in [ticker, name] if k and len(k.strip()) > 1]
    if not keywords:
        return {"news": []}

    items = []
    for feed_url in NEWS_FEEDS:
        try:
            req = urllib.request.Request(feed_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=8) as resp:
                raw_bytes = resp.read()
            # Определяем кодировку по XML-декларации (не все ленты в UTF-8, напр. Windows-1251)
            enc_match = re.search(rb'encoding=["\']([\w-]+)["\']', raw_bytes[:200])
            encoding = enc_match.group(1).decode("ascii").lower() if enc_match else "utf-8"
            try:
                xml_text = raw_bytes.decode(encoding, errors="ignore")
            except LookupError:
                xml_text = raw_bytes.decode("utf-8", errors="ignore")
        except Exception:
            continue

        for match in re.finditer(r"<item>(.*?)</item>", xml_text, re.S):
            block = match.group(1)
            title_m = re.search(r"<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</title>", block, re.S)
            link_m = re.search(r"<link>(.*?)</link>", block, re.S)
            date_m = re.search(r"<pubDate>(.*?)</pubDate>", block, re.S)
            desc_m = re.search(r"<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</description>", block, re.S)

            title = _strip_html(title_m.group(1)) if title_m else ""
            desc = _strip_html(desc_m.group(1)) if desc_m else ""
            haystack = f"{title} {desc}".lower()

            if not any(kw in haystack for kw in keywords):
                continue

            items.append({
                "title": title,
                "link": link_m.group(1).strip() if link_m else "",
                "date": date_m.group(1).strip() if date_m else "",
                "description": desc[:200],
            })
            if len(items) >= 20:
                break
        if len(items) >= 20:
            break

    return {"news": items[:10]}


def market_review_generate(ticker: str, name: str, quote: dict, news: list) -> str:
    """Формирует промпт и вызывает YandexGPT для фундаментального обзора."""
    news_lines = "\n".join(f"- {n['title']}" for n in news[:5]) or "Свежих новостей не найдено."
    quote_line = ""
    if quote and not quote.get("error"):
        quote_line = f"Текущая цена: {quote.get('last')}, изменение: {quote.get('changePercent')}%."

    prompt = (
        f"Напиши краткий фундаментальный обзор финансового инструмента «{name}» (тикер {ticker}) "
        f"для российского инвестора.\n"
        f"{quote_line}\n"
        f"Последние новости:\n{news_lines}\n\n"
        f"Структура ответа: 1) краткий вывод по текущей динамике, 2) ключевые факторы влияния, "
        f"3) на что обратить внимание в ближайшее время. "
        f"Пиши нейтрально, без прямых инвестиционных советов, в конце обязательно добавь фразу "
        f"«Не является индивидуальной инвестиционной рекомендацией». "
        f"Не более 900 символов."
    )
    return call_yandex_gpt(prompt, max_tokens=500)


def handler(event: dict, context) -> dict:
    """
    ИИ-помощник для улучшения текстов (YandexGPT) + раздел "Рынок":
    котировки/новости MOEX (бесплатно) и платный ИИ-обзор.
    """
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "POST")
    params = event.get("queryStringParameters") or {}
    query_action = params.get("action", "")

    # ── GET: рыночные данные (бесплатно, без GPT) ──────────────────────────
    if method == "GET" and query_action == "market_search":
        result = market_search(params.get("q", ""))
        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps(result, ensure_ascii=False)}

    if method == "GET" and query_action == "market_quote":
        result = market_quote(params.get("ticker", ""), params.get("market", ""))
        status = 400 if result.get("error") else 200
        return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps(result, ensure_ascii=False)}

    if method == "GET" and query_action == "market_news":
        result = market_news(params.get("ticker", ""), params.get("name", ""))
        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps(result, ensure_ascii=False)}

    if method != "POST":
        return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}

    body = json.loads(event.get("body") or "{}")
    action = body.get("action", "")

    # ── POST: платный ИИ-обзор рынка (только после подтверждённой оплаты) ──
    if action == "market_review":
        req_headers = event.get("headers", {}) or {}
        user_id_raw = req_headers.get("X-User-Id") or req_headers.get("x-user-id")
        user_id = int(user_id_raw) if user_id_raw and str(user_id_raw).isdigit() else None
        purchase_id = body.get("purchaseId")
        ticker = (body.get("ticker") or "").strip().upper()
        name = (body.get("name") or ticker).strip()

        if not user_id or not purchase_id or not ticker:
            return {"statusCode": 400, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"error": "user_id, purchaseId и ticker обязательны"})}

        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, user_id, ticker, status, review_text FROM market_review_purchases WHERE id = %s",
                    (purchase_id,),
                )
                purchase = cur.fetchone()
                if not purchase:
                    return {"statusCode": 404, "headers": {**CORS, "Content-Type": "application/json"},
                            "body": json.dumps({"error": "Покупка не найдена"})}
                if purchase["user_id"] != user_id:
                    return {"statusCode": 403, "headers": {**CORS, "Content-Type": "application/json"},
                            "body": json.dumps({"error": "Нет доступа"})}
                if purchase["status"] != "paid":
                    return {"statusCode": 402, "headers": {**CORS, "Content-Type": "application/json"},
                            "body": json.dumps({"error": "Оплата ещё не подтверждена", "status": purchase["status"]})}

                # Обзор уже сгенерирован ранее — отдаём сохранённый текст, не тратим GPT повторно
                if purchase.get("review_text"):
                    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                            "body": json.dumps({"result": purchase["review_text"]}, ensure_ascii=False)}

                quote = market_quote(ticker)
                news = market_news(ticker, name).get("news", [])
                result = market_review_generate(ticker, name, quote, news)

                cur.execute(
                    "UPDATE market_review_purchases SET review_text = %s, updated_at = NOW() WHERE id = %s",
                    (result, purchase_id),
                )
                conn.commit()
        finally:
            conn.close()

        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"result": result}, ensure_ascii=False)}

    # ── POST: существующий ИИ-помощник для текстов предложений/контрактов ──
    title = body.get("title", "").strip()
    description = body.get("description", "").strip()
    category = body.get("category", "")
    product_name = body.get("productName", "").strip()
    terms = body.get("termsConditions", "").strip()
    contract_type = body.get("contractType", "")

    if not action:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "action is required"})}

    # --- Действия для предложений ---
    if action == "improve_title":
        if not title:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "title is required"})}
        prompt = (
            f"Улучши название торгового предложения для платформы ЕРТТП.\n"
            f"Категория: {category or 'не указана'}.\n"
            f"Текущее название: «{title}».\n"
            f"Сделай название чётким, конкретным и привлекательным.\n"
            f"Верни ТОЛЬКО улучшенное название, без пояснений и кавычек, не более 80 символов."
        )
        max_tokens = 60

    elif action == "improve_description":
        if not description:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "description is required"})}
        prompt = (
            f"Улучши описание торгового предложения для платформы ЕРТТП.\n"
            f"Категория: {category or 'не указана'}.\n"
            f"{'Название: «' + title + '». ' if title else ''}"
            f"Текущее описание: «{description}».\n"
            f"Исправь орфографию, улучши стиль, сделай текст профессиональным и понятным.\n"
            f"Верни ТОЛЬКО улучшенное описание, без пояснений, не более 900 символов."
        )
        max_tokens = 500

    elif action == "suggest_description":
        if not title:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "title is required"})}
        prompt = (
            f"Напиши описание торгового предложения для платформы ЕРТТП.\n"
            f"Категория: {category or 'не указана'}.\n"
            f"Название: «{title}».\n"
            f"Напиши профессиональное, конкретное описание: характеристики, условия, преимущества.\n"
            f"Верни ТОЛЬКО описание, без пояснений, 150-400 символов."
        )
        max_tokens = 300

    # --- Действия для контрактов ---
    elif action == "improve_contract_title":
        if not title:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "title is required"})}
        contract_type_label = {"forward": "форвардный контракт", "forward-request": "заявка на форвард", "barter": "бартер"}.get(contract_type, "контракт")
        prompt = (
            f"Улучши название контракта для платформы ЕРТТП ({contract_type_label}).\n"
            f"{'Товар: ' + product_name + '. ' if product_name else ''}"
            f"Категория: {category or 'не указана'}.\n"
            f"Текущее название: «{title}».\n"
            f"Сделай название конкретным, информативным (товар, объём, срок).\n"
            f"Верни ТОЛЬКО улучшенное название, без кавычек, не более 100 символов."
        )
        max_tokens = 80

    elif action == "suggest_contract_title":
        if not product_name:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "productName is required"})}
        contract_type_label = {"forward": "форвардный контракт", "forward-request": "заявка на форвард", "barter": "бартер"}.get(contract_type, "контракт")
        prompt = (
            f"Придумай название контракта для платформы ЕРТТП ({contract_type_label}).\n"
            f"Товар: {product_name}.\n"
            f"Категория: {category or 'не указана'}.\n"
            f"Название должно быть конкретным и информативным (что поставляется, тип сделки).\n"
            f"Верни ТОЛЬКО название, без кавычек и пояснений, не более 100 символов."
        )
        max_tokens = 80

    elif action == "improve_contract_terms":
        if not terms:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "termsConditions is required"})}
        prompt = (
            f"Улучши текст дополнительных условий контракта для платформы ЕРТТП.\n"
            f"{'Товар: ' + product_name + '. ' if product_name else ''}"
            f"Текущий текст: «{terms}».\n"
            f"Исправь орфографию, сделай текст юридически корректным и понятным.\n"
            f"Верни ТОЛЬКО улучшенный текст условий, без пояснений, не более 600 символов."
        )
        max_tokens = 400

    elif action == "suggest_contract_terms":
        if not product_name:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "productName is required"})}
        contract_type_label = {"forward": "форвардный контракт", "forward-request": "заявка", "barter": "бартер"}.get(contract_type, "контракт")
        prompt = (
            f"Напиши типовые дополнительные условия для контракта на платформе ЕРТТП ({contract_type_label}).\n"
            f"Товар: {product_name}.\n"
            f"Категория: {category or 'не указана'}.\n"
            f"Укажи требования к качеству, упаковке, документации, форс-мажорным обстоятельствам.\n"
            f"Верни ТОЛЬКО текст условий, без заголовков и пояснений, 150-500 символов."
        )
        max_tokens = 400

    else:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "unknown action"})}

    result = call_yandex_gpt(prompt, max_tokens)

    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps({"result": result}, ensure_ascii=False),
    }
