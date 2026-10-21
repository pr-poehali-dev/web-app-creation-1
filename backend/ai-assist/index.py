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
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Assistant-Token",
}

MOEX_BASE = "https://iss.moex.com/iss"

NEWS_FEEDS = [
    "https://rssexport.rbc.ru/rbcnews/news/30/full.rss",
    "https://www.finmarket.ru/rss/news.asp",
    "https://www.interfax.ru/rss.asp",
]


def call_yandex_gpt(prompt: str, max_tokens: int = 400, model: str = "yandexgpt-lite", timeout: int = 25, temperature: float = 0.7, system: str = "") -> str:
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
            "modelUri": f"gpt://{folder_id}/{model}",
            "completionOptions": {
                "stream": False,
                "temperature": temperature,
                "maxTokens": max_tokens,
            },
            "messages": [
                {
                    "role": "system",
                    "text": system or "Ты помощник для торговой платформы ЕРТТП (Единая Российская Торговая Площадка). Отвечай кратко, строго по заданию, без лишних пояснений."
                },
                {"role": "user", "text": prompt}
            ],
        },
        timeout=timeout,
    )
    response.raise_for_status()
    text = response.json()["result"]["alternatives"][0]["message"]["text"].strip()
    if len(text) > 2 and text[0] in "«\"" and text[-1] in "»\"":
        text = text[1:-1].strip()
    return text


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


def market_quote(ticker: str, market_hint: str = "", days: int = 90) -> dict:
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
    since = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
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
        "capitalization": md.get("ISSUECAPITALIZATION"),
        "openPosition": md.get("OPENPOSITION"),
        "market": market,
        "engine": engine,
    }


FUTURES_BLUE_CHIPS = [
    ("SBRF", "Сбербанк"), ("GAZR", "Газпром"), ("LKOH", "ЛУКОЙЛ"), ("GMKN", "Норильский никель"),
    ("YDEX", "Яндекс"), ("ROSN", "Роснефть"), ("TATN", "Татнефть"), ("SNGR", "Сургутнефтегаз"),
    ("NLMK", "НЛМК"), ("MAGN", "ММК"), ("ALRS", "АЛРОСА"), ("MTSI", "МТС"), ("MOEX", "Московская биржа"),
    ("VTBR", "Банк ВТБ"), ("PHOR", "ФосАгро"), ("OZON", "Ozon"),
    ("BR", "Нефть Brent"), ("GOLD", "Золото"), ("SILV", "Серебро"), ("NG", "Природный газ"),
    ("Si", "Доллар/рубль"), ("RTS", "Индекс РТС"), ("MIX", "Индекс МосБиржи"),
]


def market_futures_list() -> dict:
    """Ближайшие активные фьючерсные контракты по голубым фишкам и основным активам."""
    raw = _moex_get(
        "engines/futures/markets/forts/boards/RFUD/securities",
        {"iss.meta": "off", "iss.only": "securities", "securities.columns": "SECID,SHORTNAME,ASSETCODE,LASTTRADEDATE"},
    )
    today = datetime.now().strftime("%Y-%m-%d")
    nearest = {}
    for r in _rows_to_dicts(raw.get("securities", {})):
        code, last = r.get("ASSETCODE"), r.get("LASTTRADEDATE") or ""
        if not code or last < today:
            continue
        if code not in nearest or last < nearest[code]["LASTTRADEDATE"]:
            nearest[code] = r
    items = []
    for code, title in FUTURES_BLUE_CHIPS:
        r = nearest.get(code)
        if r:
            items.append({"ticker": r["SECID"], "name": title, "shortname": r.get("SHORTNAME"), "expiry": r.get("LASTTRADEDATE")})
    return {"items": items}


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


def _ema(values: list, n: int) -> list:
    k = 2 / (n + 1)
    out = [values[0]]
    for v in values[1:]:
        out.append(v * k + out[-1] * (1 - k))
    return out


def _technical_summary(candles: list) -> str:
    rows = [c for c in candles if c.get("close") is not None]
    closes = [c["close"] for c in rows]
    if len(closes) < 15:
        return ""
    last = closes[-1]
    lines = [f"Последняя цена закрытия: {last}. Дневных свечей: {len(closes)}."]
    sma = []
    for n in (20, 50, 100, 200):
        if len(closes) >= n:
            v = sum(closes[-n:]) / n
            sma.append(f"SMA{n}={v:.2f} (цена {'выше' if last > v else 'ниже'})")
    if sma:
        lines.append("Скользящие средние: " + "; ".join(sma) + ".")
    gains = losses = 0.0
    for i in range(len(closes) - 14, len(closes)):
        d = closes[i] - closes[i - 1]
        if d > 0:
            gains += d
        else:
            losses -= d
    rsi = 100.0 if losses == 0 else 100 - 100 / (1 + gains / losses)
    lines.append(f"RSI(14)={rsi:.0f}.")
    if len(closes) >= 35:
        macd = [a - b for a, b in zip(_ema(closes, 12), _ema(closes, 26))]
        sig = _ema(macd, 9)
        lines.append(f"MACD={macd[-1]:.2f}, сигнальная={sig[-1]:.2f} ({'бычий' if macd[-1] > sig[-1] else 'медвежий'} сигнал).")
    if len(closes) >= 20:
        m = sum(closes[-20:]) / 20
        sd = (sum((x - m) ** 2 for x in closes[-20:]) / 20) ** 0.5
        lines.append(f"Полосы Боллинджера(20): нижняя={m - 2 * sd:.2f}, верхняя={m + 2 * sd:.2f}.")
    highs = [c["high"] for c in rows if c.get("high") is not None]
    lows = [c["low"] for c in rows if c.get("low") is not None]
    if highs and lows:
        lines.append(f"Максимум периода={max(highs):.2f}, минимум периода={min(lows):.2f}.")
        r20, l20 = highs[-20:], lows[-20:]
        lines.append(f"Ближайшее сопротивление (макс 20 дн)={max(r20):.2f}, поддержка (мин 20 дн)={min(l20):.2f}.")
    for label, n in (("за месяц", 21), ("за 3 месяца", 63), ("за полгода", 126), ("за период", len(closes) - 1)):
        if len(closes) > n and closes[-n - 1]:
            lines.append(f"Изменение {label}: {(last / closes[-n - 1] - 1) * 100:.1f}%.")
    vols = [c["volume"] for c in rows if c.get("volume") is not None]
    if len(vols) >= 40:
        v1, v2 = sum(vols[-20:]) / 20, sum(vols[-40:-20]) / 20
        if v2:
            lines.append(f"Средний объём за 20 дн {'вырос' if v1 > v2 else 'снизился'} на {abs(v1 / v2 - 1) * 100:.0f}% к предыдущим 20 дням.")
    return "\n".join(lines)


def _moex_fundamentals(ticker: str, quote: dict) -> str:
    lines = []
    if quote.get("capitalization"):
        lines.append(f"Капитализация эмитента: {float(quote['capitalization']) / 1e9:.1f} млрд руб.")
    if quote.get("openPosition"):
        lines.append(f"Открытый интерес по контракту: {quote['openPosition']}.")
    try:
        raw = _moex_get(f"securities/{ticker}", {"iss.meta": "off"})
        desc = {d.get("name"): d.get("value") for d in _rows_to_dicts(raw.get("description", {}))}
        for key, label in (("NAME", "Полное название"), ("ISIN", "ISIN"), ("ISSUESIZE", "Объём выпуска, акций"),
                           ("FACEVALUE", "Номинал"), ("LISTLEVEL", "Уровень листинга"), ("TYPENAME", "Тип"),
                           ("ASSETCODE", "Базовый актив"), ("LASTTRADEDATE", "Последний день торгов")):
            if desc.get(key):
                lines.append(f"{label}: {desc[key]}.")
    except Exception:
        pass
    try:
        raw = _moex_get(f"securities/{ticker}/dividends", {"iss.meta": "off"})
        divs = _rows_to_dicts(raw.get("dividends", {}))[-6:]
        if divs:
            lines.append("Дивиденды (дата закрытия реестра: размер на акцию, руб): " +
                         "; ".join(f"{d.get('registryclosedate')}: {d.get('value')}" for d in divs) + ".")
    except Exception:
        pass
    return "\n".join(lines)


def _google_news(query: str, limit: int = 15) -> list:
    url = "https://news.google.com/rss/search?" + urllib.parse.urlencode(
        {"q": f"{query} when:30d", "hl": "ru", "gl": "RU", "ceid": "RU:ru"})
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            xml_text = resp.read().decode("utf-8", errors="ignore")
    except Exception:
        return []
    out = []
    for m in re.finditer(r"<item>(.*?)</item>", xml_text, re.S):
        block = m.group(1)
        t = re.search(r"<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</title>", block, re.S)
        d = re.search(r"<pubDate>(.*?)</pubDate>", block, re.S)
        if t:
            out.append(f"{(d.group(1)[5:16] if d else '')} — {_strip_html(t.group(1))}")
        if len(out) >= limit:
            break
    return out


def market_review_generate(ticker: str, name: str, quote: dict, news: list) -> str:
    """Подробный платный обзор: данные MOEX + интернет-новости + технический анализ, генерирует YandexGPT Pro."""
    is_futures = (quote or {}).get("market") == "forts"
    price_line = ""
    if quote and not quote.get("error"):
        price_line = (f"Текущая цена: {quote.get('last')}, изменение за день: {quote.get('changePercent')}%, "
                      f"день: {quote.get('low')}–{quote.get('high')}.")
    tech = _technical_summary((quote or {}).get("candles") or [])
    fundamentals = _moex_fundamentals(ticker, quote or {})

    web = _google_news(f"{name} акции" if not is_futures else f"{name} фьючерс")
    rss = [f"{n['title']}" for n in news[:8]]
    seen, all_news = set(), []
    for n in web + rss:
        key = n[-60:].lower()
        if key not in seen:
            seen.add(key)
            all_news.append(n)
    news_text = "\n".join(f"- {n}" for n in all_news[:20]) or "Свежих новостей не найдено."

    system = ("Ты опытный аналитик российского фондового рынка. Пишешь подробные, конкретные, "
              "профессиональные обзоры на русском языке только на основе переданных данных и общеизвестных "
              "фактов о компании или активе. Не перекладывай работу на читателя: не пиши «изучите отчётность», "
              "«следите за новостями» — сам делай выводы. Не выдумывай цифры, которых нет в данных: если данных нет, "
              "так и скажи, опираясь на то, что известно о бизнесе компании.")
    kind = "фьючерсного контракта" if is_futures else "акции"
    prompt = (
        f"Сделай подробный платный аналитический обзор {kind} «{name}» (тикер {ticker}).\n\n"
        f"ДАННЫЕ БИРЖИ:\n{price_line}\n{fundamentals}\n\n"
        f"ТЕХНИЧЕСКИЕ ПОКАЗАТЕЛИ:\n{tech or 'Недостаточно данных.'}\n\n"
        f"НОВОСТИ ЗА 30 ДНЕЙ (из интернета):\n{news_text}\n\n"
        f"Структура ответа (используй заголовки):\n"
        f"1. КРАТКИЙ ВЫВОД — 2-3 предложения: общая картина и перспектива.\n"
        f"2. ФУНДАМЕНТАЛЬНЫЙ АНАЛИЗ — чем занимается компания/что лежит в основе актива, положение в отрасли, "
        f"финансовое состояние и оценка по известным данным, дивиденды, драйверы роста, риски, "
        f"разбор каждой значимой новости и её влияние на цену.\n"
        f"3. ТЕХНИЧЕСКИЙ АНАЛИЗ — тренд (краткосрочный и долгосрочный), скользящие средние, RSI, MACD, Боллинджер, "
        f"объёмы, конкретные уровни поддержки и сопротивления.\n"
        f"4. СЦЕНАРИИ — бычий и медвежий сценарий с конкретными ценовыми уровнями.\n"
        f"5. ИТОГ — взвешенная оценка (позитивно / нейтрально / негативно) с обоснованием.\n"
        f"Объём 3000–4500 символов. В конце фраза: «Не является индивидуальной инвестиционной рекомендацией»."
    )
    return call_yandex_gpt(prompt, max_tokens=2000, model="yandexgpt", timeout=55, temperature=0.3, system=system)


def market_my_assets(user_id: int, market: str) -> dict:
    """Бумаги, по которым пользователь покупал обзор (последние сверху)."""
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT ticker, MAX(asset_name) AS name, MAX(created_at) AS last_at,
                       BOOL_OR(created_at > NOW() - INTERVAL '24 hours') AS today
                FROM market_review_purchases
                WHERE user_id = %s AND status = 'paid' AND COALESCE(market, 'shares') = %s
                GROUP BY ticker ORDER BY last_at DESC LIMIT 30
                """,
                (user_id, market),
            )
            rows = cur.fetchall()
    finally:
        conn.close()
    return {"items": [{"ticker": r["ticker"], "name": r["name"] or r["ticker"], "reviewToday": bool(r["today"])} for r in rows]}


def market_review_list(user_id: int, ticker: str) -> dict:
    """Оплаченные обзоры пользователя по тикеру: сегодняшний (МСК) и история."""
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, review_text,
                       to_char(created_at + INTERVAL '3 hours', 'YYYY-MM-DD HH24:MI') AS created,
                       created_at > NOW() - INTERVAL '24 hours' AS is_today
                FROM market_review_purchases
                WHERE user_id = %s AND ticker = %s AND status = 'paid'
                ORDER BY created_at DESC LIMIT 30
                """,
                (user_id, ticker),
            )
            rows = cur.fetchall()
    finally:
        conn.close()
    today = next((r for r in rows if r["is_today"]), None)
    history = [
        {"id": r["id"], "createdAt": r["created"], "text": r["review_text"]}
        for r in rows if not r["is_today"] and r["review_text"]
    ]
    return {
        "todayPurchaseId": today["id"] if today else None,
        "todayText": today["review_text"] if today else None,
        "history": history,
    }


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

    if query_action == "assistant_reminders":
        from assistant_reminders import run_reminders
        return run_reminders()

    # ── GET: рыночные данные (бесплатно, без GPT) ──────────────────────────
    if method == "GET" and query_action == "market_search":
        result = market_search(params.get("q", ""))
        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps(result, ensure_ascii=False)}

    if method == "GET" and query_action == "market_futures_list":
        try:
            result = market_futures_list()
        except Exception:
            result = {"items": []}
        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps(result, ensure_ascii=False)}

    if method == "GET" and query_action == "market_my_assets":
        h = event.get("headers", {}) or {}
        uid_raw = h.get("X-User-Id") or h.get("x-user-id")
        if not uid_raw or not str(uid_raw).isdigit():
            return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"items": []})}
        mk = "futures" if params.get("market") == "futures" else "shares"
        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps(market_my_assets(int(uid_raw), mk), ensure_ascii=False)}

    if method == "GET" and query_action == "market_review_list":
        h = event.get("headers", {}) or {}
        uid_raw = h.get("X-User-Id") or h.get("x-user-id")
        if not uid_raw or not str(uid_raw).isdigit():
            return {"statusCode": 401, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"error": "Требуется авторизация"})}
        result = market_review_list(int(uid_raw), (params.get("ticker") or "").strip().upper())
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

    from assistant_app import ASSISTANT_ACTIONS, handle_assistant
    if action in ASSISTANT_ACTIONS:
        return handle_assistant(event, body)

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
                    "SELECT id, user_id, ticker, status, review_text, market FROM market_review_purchases WHERE id = %s",
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

                market_hint = purchase.get("market") or "shares"
                quote = market_quote(ticker, market_hint, 365)
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
    entity = body.get("entity", "offer")
    entity_names = {
        "offer": ("торгового предложения", "предложения"),
        "request": ("запроса на покупку товара или услуги", "запроса"),
        "auction": ("аукционного лота", "лота"),
        "service": ("предложения услуг (работы, ремонт, сервис)", "услуги"),
        "transport": ("транспортной услуги (пассажирские перевозки, грузоперевозки, аренда транспорта, доставка)", "услуги перевозки"),
    }
    no_invent = "Не выдумывай цены, телефоны, адреса и факты, которых нет в исходных данных.\n"
    entity_gen, entity_short = entity_names.get(entity, entity_names["offer"])

    if not action:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "action is required"})}

    # --- Действия для предложений ---
    if action == "improve_title":
        if not title:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "title is required"})}
        prompt = (
            f"Улучши название {entity_gen} для платформы ЕРТТП.\n"
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
            f"Улучши описание {entity_gen} для платформы ЕРТТП.\n"
            f"Категория: {category or 'не указана'}.\n"
            f"{'Название: «' + title + '». ' if title else ''}"
            f"Текущее описание: «{description}».\n"
            f"Исправь орфографию, улучши стиль, сделай текст профессиональным и понятным.\n"
            f"{no_invent}"
            f"Верни ТОЛЬКО улучшенное описание, без пояснений, не более 900 символов."
        )
        max_tokens = 500

    elif action == "suggest_description":
        if not title:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "title is required"})}
        prompt = (
            f"Напиши описание {entity_gen} для платформы ЕРТТП.\n"
            f"Категория: {category or 'не указана'}.\n"
            f"Название: «{title}».\n"
            f"Напиши профессиональное, конкретное описание {entity_short}: характеристики, условия, требования.\n"
            f"{no_invent}"
            f"Верни ТОЛЬКО описание, без пояснений, 150-400 символов."
        )
        max_tokens = 300

    # --- Комментарий / описание перевозки ---
    elif action in ("improve_transport_comment", "suggest_transport_comment"):
        service_type = body.get("serviceType", "").strip()
        route = body.get("route", "").strip()
        vehicle = body.get("vehicleType", "").strip()
        capacity = body.get("capacity", "").strip()
        facts = (
            f"{'Вид услуги: ' + service_type + '. ' if service_type else ''}"
            f"{'Маршрут: ' + route + '. ' if route else ''}"
            f"{'Транспорт: ' + vehicle + '. ' if vehicle else ''}"
            f"{'Вместимость/грузоподъёмность: ' + capacity + '. ' if capacity else ''}"
        )
        if action == "improve_transport_comment":
            if not description:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "description is required"})}
            prompt = (
                f"Улучши комментарий к транспортной услуге на платформе ЕРТТП.\n"
                f"{facts}\n"
                f"Текущий текст: «{description}».\n"
                f"Исправь орфографию, сделай текст понятным и вежливым.\n"
                f"{no_invent}"
                f"Верни ТОЛЬКО улучшенный текст, без пояснений, не более 500 символов."
            )
            max_tokens = 300
        else:
            if not facts:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "route or serviceType is required"})}
            prompt = (
                f"Напиши короткий комментарий к транспортной услуге на платформе ЕРТТП.\n"
                f"{facts}\n"
                f"Опиши условия поездки или перевозки: комфорт, аккуратность, пунктуальность, "
                f"что можно уточнить у водителя. {no_invent}"
                f"Верни ТОЛЬКО текст, без пояснений, 150-350 символов."
            )
            max_tokens = 250

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
