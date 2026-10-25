import json
import os
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import psycopg2
import requests
import backtest
import indicators
import regime
import rules_engine
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


_SEC_CACHE = {"day": "", "rows": []}
TF_BY_LABEL = {"5m": 5, "10m": 10, "1h": 60}
LABEL_BY_TF = {5: "5m", 10: "10m", 60: "1h"}


def resolve_future(asset_code: str) -> str:
    today = datetime.now(MSK).strftime("%Y-%m-%d")
    if _SEC_CACHE["day"] != today:
        raw = moex("engines/futures/markets/forts/boards/RFUD/securities",
                   {"iss.meta": "off", "iss.only": "securities", "securities.columns": "SECID,ASSETCODE,LASTTRADEDATE"})
        _SEC_CACHE["rows"] = rows(raw.get("securities", {}))
        _SEC_CACHE["day"] = today
    best = None
    for r in _SEC_CACHE["rows"]:
        last = r.get("LASTTRADEDATE") or ""
        if r.get("ASSETCODE") == asset_code and last > today:
            if best is None or last < best["LASTTRADEDATE"]:
                best = r
    return best["SECID"] if best else ""


def _candles_path(ticker: str, kind: str) -> str:
    if kind == "future":
        return f"engines/futures/markets/forts/boards/RFUD/securities/{ticker}/candles"
    return f"engines/stock/markets/shares/boards/TQBR/securities/{ticker}/candles"


def _clean(block: dict) -> list:
    out = []
    for c in rows(block):
        if None in (c.get("close"), c.get("high"), c.get("low")):
            continue
        out.append({"begin": c["begin"], "high": float(c["high"]), "low": float(c["low"]), "close": float(c["close"]), "volume": float(c.get("volume") or 0)})
    return out


BCS = "https://be.broker.ru"
BCS_TF = {5: "M5", 60: "H1"}
_BCS_TOKEN = {"value": "", "exp": 0.0}
LAST_SOURCE = {"value": ""}


def bcs_token() -> str:
    import time
    if _BCS_TOKEN["value"] and _BCS_TOKEN["exp"] > time.time() + 30:
        return _BCS_TOKEN["value"]
    r = requests.post(
        f"{BCS}/trade-api-keycloak/realms/tradeapi/protocol/openid-connect/token",
        data={"client_id": "trade-api-read", "grant_type": "refresh_token",
              "refresh_token": os.environ["BCS_REFRESH_TOKEN"]},
        timeout=8,
    )
    r.raise_for_status()
    j = r.json()
    _BCS_TOKEN["value"] = j["access_token"]
    _BCS_TOKEN["exp"] = time.time() + int(j.get("expires_in", 300))
    return _BCS_TOKEN["value"]


def _bcs_chunk(ticker: str, kind: str, frame: str, start: datetime, end: datetime) -> list:
    r = requests.get(
        f"{BCS}/trade-api-market-data-connector/api/v1/candles-chart",
        params={
            "classCode": "SPBFUT" if kind == "future" else "TQBR",
            "ticker": ticker,
            "startDate": start.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "endDate": end.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "timeFrame": frame,
        },
        headers={"Authorization": f"Bearer {bcs_token()}"},
        timeout=10,
    )
    r.raise_for_status()
    data = r.json()
    bars = data.get("bars") if isinstance(data, dict) else data
    out = []
    for b in bars or []:
        t = datetime.fromisoformat(str(b["time"]).replace("Z", "+00:00"))
        if t.tzinfo is None:
            t = t.replace(tzinfo=timezone.utc)
        begin = t.astimezone(MSK).strftime("%Y-%m-%d %H:%M:%S")
        out.append({"begin": begin, "high": float(b["high"]), "low": float(b["low"]), "close": float(b["close"]), "volume": float(b.get("volume") or 0)})
    return out


def _bcs_bars(ticker: str, kind: str, frame: str, days: int) -> list:
    now = datetime.now(timezone.utc)
    step = 4 if frame == "M5" else 30
    begin = now - timedelta(days=days)
    seen = {}
    cur = begin
    while cur < now:
        nxt = min(cur + timedelta(days=step), now)
        for c in _bcs_chunk(ticker, kind, frame, cur, nxt):
            seen[c["begin"]] = c
        cur = nxt
    return [seen[k] for k in sorted(seen)]


def bcs_candles(ticker: str, kind: str, tf: int) -> list:
    if not os.environ.get("BCS_REFRESH_TOKEN"):
        return []
    if tf == 10:
        five = _bcs_bars(ticker, kind, "M5", 3)
        out = []
        for c in five:
            b = c["begin"]
            m = int(b[14:16])
            key = f"{b[:14]}{m - m % 10:02d}:00"
            if out and out[-1]["begin"] == key:
                out[-1]["high"] = max(out[-1]["high"], c["high"])
                out[-1]["low"] = min(out[-1]["low"], c["low"])
                out[-1]["close"] = c["close"]
                out[-1]["volume"] += c["volume"]
            else:
                out.append({"begin": key, "high": c["high"], "low": c["low"], "close": c["close"], "volume": c["volume"]})
    else:
        out = _bcs_bars(ticker, kind, BCS_TF[tf], 3 if tf == 5 else 14)
    if out:
        now = datetime.now(MSK).replace(tzinfo=None)
        begun = datetime.strptime(out[-1]["begin"], "%Y-%m-%d %H:%M:%S")
        if begun + timedelta(minutes=tf) > now:
            out = out[:-1]
    return out


def token_expiry(conn):
    import base64
    cur = conn.cursor()
    cur.execute(f"SELECT value FROM {SCHEMA}.robot_settings WHERE key='bcs_token_expires'")
    row = cur.fetchone()
    if row:
        try:
            return datetime.strptime(row["value"], "%Y-%m-%d").date(), "manual"
        except ValueError:
            pass
    tok = os.environ.get("BCS_REFRESH_TOKEN", "")
    try:
        part = tok.split(".")[1]
        payload = json.loads(base64.urlsafe_b64decode(part + "=" * (-len(part) % 4)))
        if payload.get("exp"):
            return datetime.fromtimestamp(int(payload["exp"]), MSK).date(), "token"
    except Exception:
        pass
    return None, ""


_EXPIRY_CHECKED = {"day": None}


def check_token_expiry(conn, now: datetime) -> None:
    if _EXPIRY_CHECKED["day"] == now.date():
        return
    _EXPIRY_CHECKED["day"] = now.date()
    exp, _ = token_expiry(conn)
    if not exp:
        return
    left = (exp - now.date()).days
    if left > 3:
        return
    cur = conn.cursor()
    cur.execute(f"SELECT 1 FROM {SCHEMA}.robot_alerts WHERE kind='bcs_expiry' AND last_sent_at > NOW() - INTERVAL '20 hours'")
    if cur.fetchone():
        return
    if left < 0:
        text = "Робот ЕРТТП: срок токена БКС истёк. Выпустите новый токен «Только для чтения», обновите секрет BCS_REFRESH_TOKEN и дату в разделе робота."
    elif left == 0:
        text = "Робот ЕРТТП: токен БКС истекает сегодня. Выпустите новый токен «Только для чтения» и обновите секрет BCS_REFRESH_TOKEN."
    else:
        text = f"Робот ЕРТТП: токен БКС истекает через {left} дн. ({exp.strftime('%d.%m.%Y')}). Выпустите новый токен «Только для чтения» и обновите секрет BCS_REFRESH_TOKEN."
    if send_whatsapp(text):
        cur.execute(
            f"INSERT INTO {SCHEMA}.robot_alerts (kind, last_sent_at) VALUES ('bcs_expiry', NOW()) "
            f"ON CONFLICT (kind) DO UPDATE SET last_sent_at = NOW()")
        conn.commit()


def alert_bcs_failure(err: Exception) -> None:
    try:
        code = getattr(getattr(err, "response", None), "status_code", None)
        url = str(getattr(getattr(err, "response", None), "url", ""))
        if code in (400, 401) and "openid-connect/token" in url:
            text = "Робот ЕРТТП: токен БКС перестал работать (возможно, закончился срок 90 дней). Выпустите новый токен «Только для чтения» и обновите секрет BCS_REFRESH_TOKEN. Пока котировки берутся с биржи MOEX."
        else:
            text = "Робот ЕРТТП: БКС не отвечает, котировки временно берутся с биржи MOEX. Сигналы продолжают работать."
        conn = db()
        cur = conn.cursor()
        cur.execute(f"SELECT 1 FROM {SCHEMA}.robot_alerts WHERE kind='bcs_failure' AND last_sent_at > NOW() - INTERVAL '12 hours'")
        if not cur.fetchone():
            if send_whatsapp(text):
                cur.execute(
                    f"INSERT INTO {SCHEMA}.robot_alerts (kind, last_sent_at) VALUES ('bcs_failure', NOW()) "
                    f"ON CONFLICT (kind) DO UPDATE SET last_sent_at = NOW()")
                conn.commit()
        conn.close()
    except Exception as e:
        print(f"alert error: {e}")


def get_candles(ticker: str, kind: str, tf: int) -> list:
    try:
        out = bcs_candles(ticker, kind, tf)
        if len(out) >= 20:
            LAST_SOURCE["value"] = "bcs"
            return out
        print(f"BCS candles short/empty for {ticker}: {len(out)}, fallback MOEX")
    except Exception as e:
        print(f"BCS candles error for {ticker}: {e}, fallback MOEX")
        alert_bcs_failure(e)
    LAST_SOURCE["value"] = "moex"
    return moex_candles(ticker, kind, tf)


def moex_candles(ticker: str, kind: str, tf: int) -> list:
    path = _candles_path(ticker, kind)
    now = datetime.now(MSK).replace(tzinfo=None)
    if tf == 5:
        since = (now - timedelta(days=3)).strftime("%Y-%m-%d")
        minute = []
        for start in (0, 500):
            raw = moex(path, {"iss.meta": "off", "interval": "1", "from": since, "iss.reverse": "true", "start": start})
            minute += _clean(raw.get("candles", {}))
        minute.reverse()
        out = []
        for c in minute:
            b = c["begin"]
            m = int(b[14:16])
            key = f"{b[:14]}{m - m % 5:02d}:00"
            if out and out[-1]["begin"] == key:
                out[-1]["high"] = max(out[-1]["high"], c["high"])
                out[-1]["low"] = min(out[-1]["low"], c["low"])
                out[-1]["close"] = c["close"]
                out[-1]["volume"] += c["volume"]
            else:
                out.append({"begin": key, "high": c["high"], "low": c["low"], "close": c["close"], "volume": c["volume"]})
    else:
        days = 14 if tf == 60 else 4
        since = (now - timedelta(days=days)).strftime("%Y-%m-%d")
        raw = moex(path, {"iss.meta": "off", "interval": str(tf), "from": since})
        out = _clean(raw.get("candles", {}))
    if out:
        begun = datetime.strptime(out[-1]["begin"], "%Y-%m-%d %H:%M:%S")
        if begun + timedelta(minutes=tf) > now:
            out = out[:-1]
    return out


def hourly_candles(ticker: str, kind: str) -> list:
    return get_candles(ticker, kind, 60)


DEFAULT_CFG = {"short_adx": 25, "adx_min": 20, "skip_hours": [12, 13, 14]}


def analyze(candles: list, allow_short: bool, cfg: dict = None):
    if cfg is None:
        cfg = DEFAULT_CFG if allow_short else {}
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

    adx_min = cfg.get("adx_min", 0)
    short_adx = cfg.get("short_adx", 0)
    skip_hours = cfg.get("skip_hours") or []
    htf = cfg.get("htf", 0)
    ax = None
    if adx_min or short_adx:
        ax = indicators.adx(candles[-120:])
        if ax is None:
            return None
    if skip_hours:
        try:
            if int(candles[-1]["begin"][11:13]) in skip_hours:
                return None
        except ValueError:
            pass
    if adx_min and ax[0] < adx_min:
        return None
    adx_max = cfg.get("adx_max", 0)
    ext_max = cfg.get("ext_max", 0)
    fresh = cfg.get("fresh", 0)
    if adx_max:
        a2 = ax or indicators.adx(candles[-120:])
        if a2 is None or a2[0] > adx_max:
            return None
    if ext_max and atr and abs(last - sma50) / atr > ext_max:
        return None
    if fresh:
        cross = None
        for k in range(1, fresh + 1):
            seg = closes[:len(closes) - k + 1] if k > 1 else closes
            a20, a50 = sum(seg[-20:]) / 20, sum(seg[-50:]) / 50
            if (a20 > a50) != (sma20 > sma50):
                cross = k
                break
        if cross is None:
            return None
    long_ok = True
    short_ok = down
    if htf and len(closes) >= htf:
        smah = sum(closes[-htf:]) / htf
        long_ok = last > smah
        short_ok = down and last < smah
    if short_adx:
        short_ok = short_ok and ax[0] >= short_adx and ax[2] > ax[1]
    if cfg.get("no_short"):
        allow_short = False

    if up and long_ok and last > hh:
        return ("ЛОНГ", last, last - 1.5 * atr, last + 1.5 * atr, last + 3 * atr,
                f"Пробой максимума 20 часов {hh:.2f} в восходящем тренде (SMA20>SMA50), RSI {rsi:.0f}", last, atr)
    if up and long_ok and rsi < 40:
        return ("ЛОНГ", last, min(ll, last - 1.5 * atr), last + 1.5 * atr, last + 3 * atr,
                f"Откат в восходящем тренде, RSI {rsi:.0f}", last, atr)
    if allow_short and short_ok and last < ll:
        return ("ШОРТ", last, last + 1.5 * atr, last - 1.5 * atr, last - 3 * atr,
                f"Пробой минимума 20 часов {ll:.2f} в нисходящем тренде (SMA20<SMA50), RSI {rsi:.0f}", last, atr)
    if allow_short and short_ok and rsi > 60 and not cfg.get("no_short_bounce"):
        return ("ШОРТ", last, max(hh, last + 1.5 * atr), last - 1.5 * atr, last - 3 * atr,
                f"Отскок в нисходящем тренде, RSI {rsi:.0f}", last, atr)
    return None


def analyze_mode(candles, allow_short, cfg):
    if cfg.get("mode"):
        return regime.analyze(candles, allow_short, cfg, analyze)
    return analyze(candles, allow_short, cfg)


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
    cur.execute(f"SELECT * FROM {SCHEMA}.robot_rules")
    rules_by_id = {r["id"]: r for r in cur.fetchall()}
    for r in rules_by_id.values():
        if r["kind"] == "share":
            shares.add(r["ticker"])
    events = []
    utc_now = datetime.utcnow()
    for s in open_items:
        ticker = s["ticker"]
        kind = "share" if ticker in shares else "future"
        if not force and not market_open(kind, now):
            continue
        tf = TF_BY_LABEL.get(s.get("timeframe"), 60)
        rule = rules_by_id.get(s.get("rule_id")) if s.get("rule_id") else None
        rule_view = rules_engine.variant_for(rule, s["direction"]) if rule else None
        try:
            candles = get_candles(ticker, kind, tf)
            by_tf = {tf: candles}
            if rule_view and rule_view["exit_conditions"]:
                for t in rules_engine.needed_tfs(rule_view):
                    if t not in by_tf:
                        by_tf[t] = get_candles(ticker, kind, t)
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
        opened = s["created_at"] + timedelta(hours=3)
        floor_min = opened.minute - opened.minute % tf if tf < 60 else 0
        start = opened.strftime("%Y-%m-%d %H:") + f"{floor_min:02d}:00"
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
        if exit_price is None and rule_view and rule_view["exit_conditions"]:
            why = rules_engine.exit_reason(rule_view, by_tf)
            if why:
                exit_price, reason = last, f"Сработало условие выхода: {why}"
        if exit_price is None and not rule:
            closes = [c["close"] for c in candles]
            if len(closes) >= 50:
                sma20 = sum(closes[-20:]) / 20
                sma50 = sum(closes[-50:]) / 50
                if is_long and sma20 < sma50 and last < sma50:
                    exit_price, reason = last, "Тренд развернулся против позиции (SMA20 ниже SMA50)"
                elif not is_long and sma20 > sma50 and last > sma50:
                    exit_price, reason = last, "Тренд развернулся против позиции (SMA20 выше SMA50)"
        max_days = 7 if tf == 60 else 1
        if exit_price is None and (utc_now - s["created_at"]).days >= max_days:
            exit_price, reason = last, f"Прошло {max_days} дн., сигнал устарел"
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


def publish(conn, cur, ticker: str, asset_name: str, sig, rule_id, result: list, tf: int = 60) -> None:
    direction, entry, stop, t1, t2, reason, price, atr = sig
    if rule_id:
        cur.execute(
            f"SELECT 1 FROM {SCHEMA}.robot_signals WHERE rule_id=%s AND ticker=%s AND direction=%s "
            f"AND (status='open' OR created_at > NOW() - INTERVAL '{DEDUP_HOURS} hours')", (rule_id, ticker, direction))
    else:
        cur.execute(
            f"SELECT 1 FROM {SCHEMA}.robot_signals WHERE rule_id IS NULL AND ticker=%s AND direction=%s "
            f"AND (status='open' OR created_at > NOW() - INTERVAL '{DEDUP_HOURS} hours')", (ticker, direction))
    if cur.fetchone():
        result.append({"ticker": ticker, "status": "сигнал уже отправлялся"})
        return
    risk = abs(entry - stop)
    rr = abs(t1 - entry) / risk if risk else 0
    text = (f"Сигнал робота ({rules_engine.tf_label(tf)})\n{asset_name} ({ticker}): {direction}\n"
            f"Цена: {price:.2f}\nВход: {entry:.2f}\nСтоп: {stop:.2f}\n"
            f"Цель 1: {t1:.2f}\nЦель 2: {t2:.2f}\nРиск/прибыль: 1:{rr:.1f}\n"
            f"Основание: {reason}\n\nЭто сигнал, а не рекомендация. Заявки робот не выставляет.")
    sent = send_whatsapp(text)
    cur.execute(
        f"INSERT INTO {SCHEMA}.robot_signals (ticker, asset_name, timeframe, direction, price, entry, stop_loss, target1, target2, reason, sent, rule_id) "
        f"VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
        (ticker, asset_name, LABEL_BY_TF.get(tf, "1h"), direction, price, entry, stop, t1, t2, reason, sent, rule_id))
    conn.commit()
    result.append({"ticker": ticker, "status": f"{direction}, отправлено: {sent}"})


def run_rules(conn, cur, now: datetime, force: bool, result: list) -> None:
    cur.execute(f"SELECT * FROM {SCHEMA}.robot_rules WHERE enabled")
    cache = {}
    for rule in cur.fetchall():
        kind = rule["kind"]
        label = f"{rule['ticker']} · {rule['name']}"
        if not force and not market_open(kind, now):
            result.append({"ticker": label, "status": "рынок закрыт"})
            continue
        ticker = rule["ticker"]
        if kind == "future":
            ticker = resolve_future(rule["asset_code"] or rule["ticker"])
            if not ticker:
                result.append({"ticker": label, "status": "контракт не найден"})
                continue
        tf = rules_engine.rule_tf(rule)
        try:
            by_tf = {}
            for t in rules_engine.needed_tfs(rule, with_exit=False) | {tf}:
                if (ticker, t) not in cache:
                    cache[(ticker, t)] = get_candles(ticker, kind, t)
                by_tf[t] = cache[(ticker, t)]
            sigs = [rules_engine.evaluate_entry(v, by_tf) for v in rules_engine.variants(rule)]
        except Exception as e:
            result.append({"ticker": label, "status": f"ошибка данных: {e}"})
            continue
        sigs = [x for x in sigs if x]
        if not sigs:
            result.append({"ticker": label, "status": "условия не выполнены"})
            continue
        for sig in sigs:
            publish(conn, cur, ticker, rule["asset_name"], sig, rule["id"], result, tf)


ROBOT_OWNER_INN = "1400022716"


def is_admin(conn, uid_raw) -> bool:
    if not uid_raw or not str(uid_raw).isdigit():
        return False
    cur = conn.cursor()
    cur.execute(f"SELECT inn FROM {SCHEMA}.users WHERE id=%s", (int(uid_raw),))
    row = cur.fetchone()
    return bool(row and row["inn"] == ROBOT_OWNER_INN)


def rule_row(r: dict) -> dict:
    return {**r, "entry_text": [rules_engine.describe(c) for c in r["entry_conditions"]],
            "exit_text": [rules_engine.describe(c) for c in r["exit_conditions"]]}


def manage(action: str, q: dict, event: dict) -> dict:
    h = event.get("headers") or {}
    uid = h.get("X-User-Id") or h.get("x-user-id")
    conn = db()
    try:
        if not is_admin(conn, uid):
            return resp(403, {"error": "Доступ закрыт"})
        cur = conn.cursor()
        if action == "robot_rules":
            cur.execute(f"SELECT * FROM {SCHEMA}.robot_rules ORDER BY id DESC")
            return resp(200, {"items": [rule_row(r) for r in cur.fetchall()]})
        try:
            body = json.loads(event.get("body") or "{}")
        except ValueError:
            return resp(400, {"error": "Неверный формат"})
        if action == "robot_rule_save":
            entry = rules_engine.sanitize(body.get("entry_conditions"))
            exit_c = rules_engine.sanitize(body.get("exit_conditions"))
            name = (body.get("name") or "").strip()[:120]
            ticker = (body.get("ticker") or "").strip().upper()[:20]
            if not name or not ticker or not entry:
                return resp(400, {"error": "Укажите название, бумагу и хотя бы одно условие входа"})
            kind = "future" if body.get("kind") == "future" else "share"
            direction = body.get("direction") if body.get("direction") in ("ЛОНГ", "ШОРТ", "ОБА") else "ЛОНГ"
            if direction != "ЛОНГ" and kind != "future":
                return resp(400, {"error": "Шорт доступен только для фьючерсов"})
            try:
                tf = int(body.get("timeframe") or 60)
            except (TypeError, ValueError):
                tf = 60
            if tf not in rules_engine.TIMEFRAMES:
                tf = 60
            asset_name = (body.get("asset_name") or ticker).strip()[:100]
            asset_code = (body.get("asset_code") or ticker).strip().upper()[:10] if kind == "future" else None

            def f(key, default):
                try:
                    return max(0.3, min(10.0, float(body.get(key, default))))
                except (TypeError, ValueError):
                    return default
            edit_id = int(body.get("id") or 0)
            if edit_id:
                cur.execute(
                    f"UPDATE {SCHEMA}.robot_rules SET name=%s, ticker=%s, asset_name=%s, kind=%s, asset_code=%s, direction=%s, "
                    f"entry_conditions=%s, exit_conditions=%s, stop_atr=%s, target1_atr=%s, target2_atr=%s, timeframe=%s WHERE id=%s",
                    (name, ticker, asset_name, kind, asset_code, direction, json.dumps(entry), json.dumps(exit_c),
                     f("stop_atr", 1.5), f("target1_atr", 1.5), f("target2_atr", 3), tf, edit_id))
                conn.commit()
                return resp(200, {"id": edit_id})
            cur.execute(
                f"INSERT INTO {SCHEMA}.robot_rules (name, ticker, asset_name, kind, asset_code, direction, entry_conditions, "
                f"exit_conditions, stop_atr, target1_atr, target2_atr, created_by, timeframe) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                (name, ticker, asset_name, kind, asset_code, direction, json.dumps(entry), json.dumps(exit_c),
                 f("stop_atr", 1.5), f("target1_atr", 1.5), f("target2_atr", 3), int(uid), tf))
            new_id = cur.fetchone()["id"]
            conn.commit()
            return resp(200, {"id": new_id})
        rid = int(body.get("id") or 0)
        if action == "robot_token_get":
            exp, src = token_expiry(conn)
            return resp(200, {"expires": exp.isoformat() if exp else None, "source": src,
                              "days_left": (exp - datetime.now(MSK).date()).days if exp else None})
        if action == "robot_token_set":
            val = str(body.get("expires") or "")
            try:
                datetime.strptime(val, "%Y-%m-%d")
            except ValueError:
                return resp(400, {"error": "Укажите дату"})
            cur.execute(
                f"INSERT INTO {SCHEMA}.robot_settings (key, value) VALUES ('bcs_token_expires', %s) "
                f"ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()", (val,))
            cur.execute(f"DELETE FROM {SCHEMA}.robot_alerts WHERE kind='bcs_expiry'")
            _EXPIRY_CHECKED["day"] = None
            conn.commit()
            return resp(200, {"ok": True})
        if action == "robot_signal_update":
            cur.execute(f"SELECT * FROM {SCHEMA}.robot_signals WHERE id=%s", (rid,))
            sg = cur.fetchone()
            if not sg:
                return resp(404, {"error": "Сигнал не найден"})
            try:
                entry, stop = float(body["entry"]), float(body["stop_loss"])
                t1, t2 = float(body["target1"]), float(body["target2"])
            except (KeyError, TypeError, ValueError):
                return resp(400, {"error": "Проверьте числа"})
            reason = str(body.get("reason") or "")[:1000]
            cur.execute(
                f"UPDATE {SCHEMA}.robot_signals SET entry=%s, stop_loss=%s, target1=%s, target2=%s, reason=%s WHERE id=%s",
                (entry, stop, t1, t2, reason, rid))
            if sg["status"] == "closed" and sg["exit_price"] is not None:
                pct = pnl(sg["direction"], entry, float(sg["exit_price"]))
                if sg["t1_hit"]:
                    pct = 0.5 * pnl(sg["direction"], entry, t1) + 0.5 * pct
                cur.execute(f"UPDATE {SCHEMA}.robot_signals SET result_pct=%s WHERE id=%s", (round(pct, 2), rid))
            if body.get("close_price") not in (None, "") and sg["status"] == "open":
                try:
                    cp = float(body["close_price"])
                except (TypeError, ValueError):
                    return resp(400, {"error": "Проверьте цену закрытия"})
                pct = pnl(sg["direction"], entry, cp)
                if sg["t1_hit"]:
                    pct = 0.5 * pnl(sg["direction"], entry, t1) + 0.5 * pct
                cur.execute(
                    f"UPDATE {SCHEMA}.robot_signals SET status='closed', exit_price=%s, exit_reason='Закрыто вручную', "
                    f"result_pct=%s, closed_at=NOW() WHERE id=%s", (cp, round(pct, 2), rid))
            conn.commit()
            return resp(200, {"ok": True})
        if action == "robot_signal_delete":
            cur.execute(f"DELETE FROM {SCHEMA}.robot_signals WHERE id=%s", (rid,))
            conn.commit()
            return resp(200, {"ok": True})
        if action == "robot_rule_toggle":
            cur.execute(f"UPDATE {SCHEMA}.robot_rules SET enabled = NOT enabled WHERE id=%s", (rid,))
            conn.commit()
            return resp(200, {"ok": True})
        if action == "robot_rule_delete":
            cur.execute(f"DELETE FROM {SCHEMA}.robot_rules WHERE id=%s", (rid,))
            conn.commit()
            return resp(200, {"ok": True})
        return resp(400, {"error": "Неизвестное действие"})
    finally:
        conn.close()


def run(force: bool) -> dict:
    now = datetime.now(MSK)
    conn = db()
    try:
        check_token_expiry(conn, now)
    except Exception as e:
        print(f"expiry check error: {e}")
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
        publish(conn, cur, ticker, it["asset_name"], sig, None, result)
    run_rules(conn, cur, now, force, result)
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
    cur.execute(
        f"SELECT s.rule_id, COALESCE(r.name, 'Базовая стратегия') AS name, "
        f"COUNT(*) FILTER (WHERE s.status='closed') AS closed, COUNT(*) FILTER (WHERE s.status='open') AS open_count, "
        f"COUNT(*) FILTER (WHERE s.status='closed' AND s.result_pct > 0) AS wins, "
        f"COALESCE(ROUND(AVG(s.result_pct) FILTER (WHERE s.status='closed'), 2), 0) AS avg_pct, "
        f"COALESCE(SUM(s.result_pct) FILTER (WHERE s.status='closed'), 0) AS total_pct, "
        f"COALESCE(ROUND(AVG(s.result_pct) FILTER (WHERE s.result_pct > 0), 2), 0) AS avg_win, "
        f"COALESCE(ROUND(AVG(s.result_pct) FILTER (WHERE s.result_pct <= 0), 2), 0) AS avg_loss, "
        f"COALESCE(SUM(s.result_pct) FILTER (WHERE s.result_pct > 0), 0) AS gross_win, "
        f"COALESCE(-SUM(s.result_pct) FILTER (WHERE s.result_pct < 0), 0) AS gross_loss "
        f"FROM {SCHEMA}.robot_signals s LEFT JOIN {SCHEMA}.robot_rules r ON r.id = s.rule_id "
        f"GROUP BY s.rule_id, r.name ORDER BY SUM(s.result_pct) DESC NULLS LAST")
    rule_stats = cur.fetchall()
    conn.close()
    return {"items": data, "stats": stats, "rule_stats": rule_stats}


def run_backtest(q: dict, event: dict) -> dict:
    conn = db()
    if not is_admin(conn, (event.get("headers") or {}).get("X-User-Id") or (event.get("headers") or {}).get("x-user-id")):
        conn.close()
        return resp(403, {"error": "Доступ запрещён"})
    cur = conn.cursor()
    days = max(3, min(int(q.get("days", "30")), 400))
    if q.get("rule_id"):
        cur.execute(f"SELECT * FROM {SCHEMA}.robot_rules WHERE id=%s", (int(q["rule_id"]),))
        rule = cur.fetchone()
        conn.close()
        if not rule:
            return resp(404, {"error": "Правило не найдено"})
        kind = rule["kind"]
        ticker = rule["ticker"]
        if kind == "future":
            ticker = resolve_future(rule["asset_code"] or rule["ticker"])
        by_tf = {}
        for t in rules_engine.needed_tfs(rule) | {rules_engine.rule_tf(rule)}:
            by_tf[t] = bcs_history(ticker, kind, t, days)
        res = backtest.run_rule(rule, by_tf)
        title = f"{rule['ticker']} · {rule['name']}"
    else:
        conn.close()
        kind = q.get("kind", "stock")
        ticker = q.get("ticker", "SBER")
        if kind == "future":
            ticker = resolve_future(ticker) or ticker
        cfg = {}
        for k in ("adx_min", "short_adx", "htf"):
            if q.get(k):
                cfg[k] = float(q[k])
        if q.get("skip_hours"):
            cfg["skip_hours"] = [int(x) for x in q["skip_hours"].split(",")]
        for k in ("no_short", "no_short_bounce"):
            if q.get(k) == "1":
                cfg[k] = True
        res = backtest.run_base(bcs_history(ticker, kind, 60, days), kind == "future",
                                lambda c, s: analyze(c, s, cfg if (cfg or q.get("custom") == "1") else None))
        title = f"{ticker} · базовая стратегия"
    res["title"] = title
    res["ticker"] = ticker
    res["summary"] = backtest.summarize(res["trades"])
    return resp(200, res)


def run_backtest_batch(q: dict, event: dict) -> dict:
    h = event.get("headers") or {}
    conn = db()
    if not is_admin(conn, h.get("X-User-Id") or h.get("x-user-id")):
        conn.close()
        return resp(403, {"error": "Доступ запрещён"})
    conn.close()
    body = json.loads(event.get("body") or "{}")
    days = max(3, min(int(body.get("days", 90)), 400))
    kind = body.get("kind", "future")
    ticker = body.get("ticker", "BR")
    if kind == "future":
        ticker = resolve_future(ticker) or ticker
    split = body.get("split")
    cache = {}
    out = []
    if body.get("base"):
        tf = int(body.get("tf", 60))
        candles = bcs_history(ticker, kind, tf, days)
        for v in body["base"][:40]:
            cfg = v.get("cfg") or {}
            res = backtest.run_base(candles, kind == "future", lambda c, s, cfg=cfg: analyze_mode(c, s, cfg), window=450, tf=tf)
            tr = res["trades"]
            item = {"name": v.get("name", ""), "all": backtest.summarize(tr)}
            if body.get("trades"):
                item["trades"] = [t for t in tr if t["closed"]]
            if split:
                item["train"] = backtest.summarize([t for t in tr if t["date"] < split])
                item["test"] = backtest.summarize([t for t in tr if t["date"] >= split])
            out.append(item)
        return resp(200, {"ticker": ticker, "variants": out})
    for v in (body.get("variants") or [])[:40]:
        rule = {
            "name": v.get("name", ""), "direction": v.get("direction", "ЛОНГ"), "timeframe": int(v.get("timeframe", 60)), "kind": kind,
            "entry_conditions": rules_engine.sanitize(v.get("entry_conditions")),
            "exit_conditions": rules_engine.sanitize(v.get("exit_conditions")),
            "stop_atr": v.get("stop_atr", 1.5), "target1_atr": v.get("target1_atr", 1.5), "target2_atr": v.get("target2_atr", 3),
        }
        by_tf = {}
        for t in rules_engine.needed_tfs(rule) | {rules_engine.rule_tf(rule)}:
            if t not in cache:
                cache[t] = bcs_history(ticker, kind, t, days)
            by_tf[t] = cache[t]
        res = backtest.run_rule(rule, by_tf)
        trades = res["trades"]
        item = {"name": v.get("name", ""), "all": backtest.summarize(trades)}
        if split:
            item["train"] = backtest.summarize([t for t in trades if t["date"] < split])
            item["test"] = backtest.summarize([t for t in trades if t["date"] >= split])
        out.append(item)
    return resp(200, {"ticker": ticker, "variants": out})


def bcs_history(ticker: str, kind: str, tf: int, days: int) -> list:
    if tf == 1440:
        out = []
        for c in _bcs_bars(ticker, kind, "H1", days):
            key = f"{c['begin'][:10]} 00:00:00"
            if out and out[-1]["begin"] == key:
                out[-1]["high"] = max(out[-1]["high"], c["high"])
                out[-1]["low"] = min(out[-1]["low"], c["low"])
                out[-1]["close"] = c["close"]
                out[-1]["volume"] += c["volume"]
            else:
                out.append({"begin": key, "high": c["high"], "low": c["low"], "close": c["close"], "volume": c["volume"]})
        return out
    if tf == 10:
        five = _bcs_bars(ticker, kind, "M5", days)
        out = []
        for c in five:
            b = c["begin"]
            m = int(b[14:16])
            key = f"{b[:14]}{m - m % 10:02d}:00"
            if out and out[-1]["begin"] == key:
                out[-1]["high"] = max(out[-1]["high"], c["high"])
                out[-1]["low"] = min(out[-1]["low"], c["low"])
                out[-1]["close"] = c["close"]
                out[-1]["volume"] += c["volume"]
            else:
                out.append({"begin": key, "high": c["high"], "low": c["low"], "close": c["close"], "volume": c["volume"]})
        return out
    return _bcs_bars(ticker, kind, BCS_TF[tf], days)


def handle_action(action: str, q: dict, event: dict = None) -> dict:
    if action in ("robot_rules", "robot_rule_save", "robot_rule_toggle", "robot_rule_delete", "robot_signal_update", "robot_signal_delete", "robot_token_get", "robot_token_set"):
        return manage(action, q, event or {})
    if action == "robot_signals":
        return resp(200, list_signals())
    if action == "robot_backtest_batch":
        return run_backtest_batch(q, event or {})
    if action == "robot_backtest":
        return run_backtest(q, event or {})
    if action == "robot_source":
        t = q.get("ticker", "SBER")
        k = q.get("kind", "stock")
        tf = int(q.get("tf", "60"))
        if k == "future":
            t = resolve_future(t) or t
        c = get_candles(t, k, tf)
        return resp(200, {"ticker": t, "source": LAST_SOURCE["value"], "candles": len(c), "last": c[-1] if c else None})
    if action == "robot_test":
        return resp(200, {"sent": send_whatsapp("Тест: робот ЕРТТП подключён к WhatsApp. Сигналы будут приходить сюда.")})
    return resp(200, run(force=q.get("force") == "1"))