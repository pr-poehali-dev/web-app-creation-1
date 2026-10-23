import json
import os
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import psycopg2
import requests
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA") or os.environ.get("DB_SCHEMA", "public")
MOEX = "https://iss.moex.com/iss"
MSK = timezone(timedelta(hours=3))
DEDUP_HOURS = 6
HEADERS = {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}


def resp(code: int, data: dict) -> dict:
    return {"statusCode": code, "headers": HEADERS, "body": json.dumps(data, ensure_ascii=False, default=str)}


def db():
    return psycopg2.connect(os.environ["DATABASE_URL"], cursor_factory=RealDictCursor)


def moex(path: str, params: dict) -> dict:
    r = requests.get(f"{MOEX}/{path}.json?{urlencode(params)}", timeout=8, headers={"User-Agent": "erttp-robot/1.0"})
    r.raise_for_status()
    return r.json()


def rows(block: dict) -> list:
    cols = block.get("columns", [])
    return [dict(zip(cols, row)) for row in block.get("data", [])]


def resolve_future(asset_code: str) -> str:
    today = datetime.now(MSK).strftime("%Y-%m-%d")
    raw = moex("engines/futures/markets/forts/boards/RFUD/securities",
               {"iss.meta": "off", "iss.only": "securities", "securities.columns": "SECID,ASSETCODE,LASTTRADEDATE"})
    best = None
    for r in rows(raw.get("securities", {})):
        last = r.get("LASTTRADEDATE") or ""
        if r.get("ASSETCODE") == asset_code and last > today:
            if best is None or last < best["LASTTRADEDATE"]:
                best = r
    return best["SECID"] if best else ""


def hourly_candles(ticker: str, kind: str) -> list:
    if kind == "future":
        path = f"engines/futures/markets/forts/boards/RFUD/securities/{ticker}/candles"
    else:
        path = f"engines/stock/markets/shares/boards/TQBR/securities/{ticker}/candles"
    since = (datetime.now(MSK) - timedelta(days=14)).strftime("%Y-%m-%d")
    raw = moex(path, {"iss.meta": "off", "interval": "60", "from": since})
    out = []
    for c in rows(raw.get("candles", {})):
        if None in (c.get("close"), c.get("high"), c.get("low")):
            continue
        out.append({"begin": c["begin"], "high": float(c["high"]), "low": float(c["low"]), "close": float(c["close"])})
    now = datetime.now(MSK)
    if out and out[-1]["begin"][:13] == now.strftime("%Y-%m-%d %H"):
        out = out[:-1]
    return out


def analyze(candles: list, allow_short: bool):
    closes = [c["close"] for c in candles]
    if len(closes) < 55:
        return None
    last = closes[-1]
    sma20 = sum(closes[-20:]) / 20
    sma50 = sum(closes[-50:]) / 50
    gains = losses = 0.0
    for i in range(len(closes) - 14, len(closes)):
        d = closes[i] - closes[i - 1]
        if d > 0:
            gains += d
        else:
            losses -= d
    rsi = 100.0 if losses == 0 else 100 - 100 / (1 + gains / losses)
    trs = []
    for i in range(len(candles) - 14, len(candles)):
        c, pc = candles[i], candles[i - 1]["close"]
        trs.append(max(c["high"] - c["low"], abs(c["high"] - pc), abs(c["low"] - pc)))
    atr = sum(trs) / len(trs)
    prev = candles[-21:-1]
    hh = max(c["high"] for c in prev)
    ll = min(c["low"] for c in prev)
    up = last > sma50 and sma20 > sma50
    down = last < sma50 and sma20 < sma50

    if up and last > hh:
        return ("ЛОНГ", last, last - 1.5 * atr, last + 1.5 * atr, last + 3 * atr,
                f"Пробой максимума 20 часов {hh:.2f} в восходящем тренде (SMA20>SMA50), RSI {rsi:.0f}", last, atr)
    if up and rsi < 40:
        return ("ЛОНГ", last, min(ll, last - 1.5 * atr), last + 1.5 * atr, last + 3 * atr,
                f"Откат в восходящем тренде, RSI {rsi:.0f}", last, atr)
    if allow_short and down and last < ll:
        return ("ШОРТ", last, last + 1.5 * atr, last - 1.5 * atr, last - 3 * atr,
                f"Пробой минимума 20 часов {ll:.2f} в нисходящем тренде (SMA20<SMA50), RSI {rsi:.0f}", last, atr)
    if allow_short and down and rsi > 60:
        return ("ШОРТ", last, max(hh, last + 1.5 * atr), last - 1.5 * atr, last - 3 * atr,
                f"Отскок в нисходящем тренде, RSI {rsi:.0f}", last, atr)
    return None


def send_whatsapp(text: str) -> bool:
    inst = os.environ.get("GREEN_API_INSTANCE_ID")
    token = os.environ.get("GREEN_API_TOKEN")
    phone = "".join(ch for ch in os.environ.get("ROBOT_WHATSAPP_PHONE", "") if ch.isdigit())
    if not (inst and token and phone):
        return False
    r = requests.post(f"https://api.green-api.com/waInstance{inst}/sendMessage/{token}",
                      json={"chatId": f"{phone}@c.us", "message": text}, timeout=10)
    return r.status_code == 200


def market_open(kind: str, now: datetime) -> bool:
    if now.weekday() >= 5:
        return False
    minutes = now.hour * 60 + now.minute
    if kind == "future":
        return 9 * 60 + 5 <= minutes <= 23 * 60 + 45
    return 10 * 60 + 5 <= minutes <= 18 * 60 + 50


def pnl(direction: str, entry: float, price: float) -> float:
    if not entry:
        return 0.0
    d = (price - entry) / entry * 100
    return d if direction == "ЛОНГ" else -d


def track_exits(conn, now: datetime, force: bool) -> list:
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM {SCHEMA}.robot_signals WHERE status='open' ORDER BY created_at")
    open_items = cur.fetchall()
    if not open_items:
        return []
    cur.execute(f"SELECT ticker FROM {SCHEMA}.robot_watchlist WHERE kind='share'")
    shares = {r["ticker"] for r in cur.fetchall()}
    events = []
    utc_now = datetime.utcnow()
    for s in open_items:
        ticker = s["ticker"]
        kind = "share" if ticker in shares else "future"
        if not force and not market_open(kind, now):
            continue
        try:
            candles = hourly_candles(ticker, kind)
        except Exception as e:
            events.append({"ticker": ticker, "status": f"ошибка данных: {e}"})
            continue
        if not candles:
            continue
        direction = s["direction"]
        is_long = direction == "ЛОНГ"
        entry, stop = float(s["entry"]), float(s["stop_loss"])
        t1, t2 = float(s["target1"]), float(s["target2"])
        was_t1 = bool(s["t1_hit"])
        t1_hit = was_t1
        start = (s["created_at"] + timedelta(hours=3)).strftime("%Y-%m-%d %H:00:00")
        exit_price, reason = None, ""
        for c in candles:
            if c["begin"] < start:
                continue
            cur_stop = entry if t1_hit else stop
            if (c["low"] <= cur_stop) if is_long else (c["high"] >= cur_stop):
                exit_price = cur_stop
                reason = "Цена вернулась ко входу после цели 1 (стоп в безубытке)" if t1_hit else "Сработал стоп"
                break
            if (c["high"] >= t2) if is_long else (c["low"] <= t2):
                exit_price, reason = t2, "Достигнута цель 2"
                break
            if not t1_hit and ((c["high"] >= t1) if is_long else (c["low"] <= t1)):
                t1_hit = True
        last = candles[-1]["close"]
        if exit_price is None:
            closes = [c["close"] for c in candles]
            if len(closes) >= 50:
                sma20 = sum(closes[-20:]) / 20
                sma50 = sum(closes[-50:]) / 50
                if is_long and sma20 < sma50 and last < sma50:
                    exit_price, reason = last, "Тренд развернулся против позиции (SMA20 ниже SMA50)"
                elif not is_long and sma20 > sma50 and last > sma50:
                    exit_price, reason = last, "Тренд развернулся против позиции (SMA20 выше SMA50)"
            if exit_price is None and (utc_now - s["created_at"]).days >= 7:
                exit_price, reason = last, "Прошло 7 дней, сигнал устарел"
        name = f"{s['asset_name']} ({ticker}) {direction}"
        if exit_price is not None:
            pct = pnl(direction, entry, exit_price)
            if t1_hit:
                pct = 0.5 * pnl(direction, entry, t1) + 0.5 * pct
            text = (f"Выход из сделки\n{name}\n{reason}\nВход: {entry:.2f}, выход: {exit_price:.2f}\n"
                    f"Результат: {pct:+.2f}%" + (" (половина позиции закрыта по цели 1)" if t1_hit else "") +
                    "\n\nЭто сигнал, а не рекомендация. Заявки робот не выставляет.")
            send_whatsapp(text)
            cur.execute(
                f"UPDATE {SCHEMA}.robot_signals SET status='closed', t1_hit=%s, exit_price=%s, exit_reason=%s, "
                f"result_pct=%s, closed_at=NOW() WHERE id=%s", (t1_hit, exit_price, reason, round(pct, 2), s["id"]))
            conn.commit()
            events.append({"ticker": ticker, "status": f"закрыта: {reason}, {pct:+.2f}%"})
        elif t1_hit and not was_t1:
            text = (f"Цель 1 достигнута\n{name}\nЦена: {last:.2f}, цель 1: {t1:.2f}\n"
                    f"Зафиксируйте часть позиции, стоп перенесите на цену входа {entry:.2f}. Цель 2: {t2:.2f}\n\n"
                    f"Это сигнал, а не рекомендация. Заявки робот не выставляет.")
            send_whatsapp(text)
            cur.execute(f"UPDATE {SCHEMA}.robot_signals SET t1_hit=TRUE WHERE id=%s", (s["id"],))
            conn.commit()
            events.append({"ticker": ticker, "status": "цель 1 достигнута"})
        else:
            events.append({"ticker": ticker, "status": "позиция открыта"})
    return events


def run(force: bool) -> dict:
    now = datetime.now(MSK)
    conn = db()
    exits = track_exits(conn, now, force)
    cur = conn.cursor()
    cur.execute(f"SELECT ticker, asset_name, kind, asset_code FROM {SCHEMA}.robot_watchlist WHERE enabled")
    items = cur.fetchall()
    result = []
    for it in items:
        kind = it["kind"]
        if not force and not market_open(kind, now):
            result.append({"ticker": it["ticker"], "status": "рынок закрыт"})
            continue
        ticker = it["ticker"]
        if kind == "future":
            ticker = resolve_future(it["asset_code"] or it["ticker"])
            if not ticker:
                result.append({"ticker": it["ticker"], "status": "контракт не найден"})
                continue
        try:
            sig = analyze(hourly_candles(ticker, kind), allow_short=(kind == "future"))
        except Exception as e:
            result.append({"ticker": it["ticker"], "status": f"ошибка данных: {e}"})
            continue
        if not sig:
            result.append({"ticker": it["ticker"], "status": "сигнала нет"})
            continue
        direction, entry, stop, t1, t2, reason, price, atr = sig
        cur.execute(
            f"SELECT 1 FROM {SCHEMA}.robot_signals WHERE ticker=%s AND direction=%s AND (status='open' OR created_at > NOW() - INTERVAL '{DEDUP_HOURS} hours')",
            (ticker, direction))
        if cur.fetchone():
            result.append({"ticker": ticker, "status": "сигнал уже отправлялся"})
            continue
        risk = abs(entry - stop)
        rr = abs(t1 - entry) / risk if risk else 0
        text = (f"Сигнал робота (1 час)\n{it['asset_name']} ({ticker}): {direction}\n"
                f"Цена: {price:.2f}\nВход: {entry:.2f}\nСтоп: {stop:.2f}\n"
                f"Цель 1: {t1:.2f}\nЦель 2: {t2:.2f}\nРиск/прибыль: 1:{rr:.1f}\n"
                f"Основание: {reason}\n\nЭто сигнал, а не рекомендация. Заявки робот не выставляет.")
        sent = send_whatsapp(text)
        cur.execute(
            f"INSERT INTO {SCHEMA}.robot_signals (ticker, asset_name, timeframe, direction, price, entry, stop_loss, target1, target2, reason, sent) "
            f"VALUES (%s,%s,'1h',%s,%s,%s,%s,%s,%s,%s,%s)",
            (ticker, it["asset_name"], direction, price, entry, stop, t1, t2, reason, sent))
        conn.commit()
        result.append({"ticker": ticker, "status": f"{direction}, отправлено: {sent}"})
    conn.close()
    return {"checked": result, "exits": exits, "time": now.strftime("%Y-%m-%d %H:%M")}


def list_signals() -> dict:
    conn = db()
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM {SCHEMA}.robot_signals ORDER BY created_at DESC LIMIT 50")
    data = cur.fetchall()
    cur.execute(
        f"SELECT COUNT(*) AS closed, COUNT(*) FILTER (WHERE result_pct > 0) AS wins, "
        f"COALESCE(ROUND(AVG(result_pct), 2), 0) AS avg_pct, COALESCE(SUM(result_pct), 0) AS total_pct "
        f"FROM {SCHEMA}.robot_signals WHERE status='closed'")
    stats = cur.fetchone()
    conn.close()
    return {"items": data, "stats": stats}


def handle_action(action: str, q: dict) -> dict:
    if action == "robot_signals":
        return resp(200, list_signals())
    if action == "robot_test":
        return resp(200, {"sent": send_whatsapp("Тест: робот ЕРТТП подключён к WhatsApp. Сигналы будут приходить сюда.")})
    return resp(200, run(force=q.get("force") == "1"))