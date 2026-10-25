from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta

import trading_robot as tr

_INFO = {"day": "", "rows": []}
ASSETS = [
    ["BR", "Нефть Brent"], ["RTS", "Индекс РТС"], ["MIX", "Индекс МосБиржи"], ["Si", "Доллар/рубль"],
    ["CNY", "Юань/рубль"], ["GOLD", "Золото"], ["NG", "Природный газ"], ["SBRF", "Сбербанк"],
    ["GAZR", "Газпром"], ["LKOH", "Лукойл"], ["ROSN", "Роснефть"], ["VTBR", "ВТБ"],
]


def _load():
    today = datetime.now(tr.MSK).strftime("%Y-%m-%d")
    if _INFO["day"] != today or not _INFO["rows"]:
        raw = tr.moex("engines/futures/markets/forts/boards/RFUD/securities", {
            "iss.meta": "off", "iss.only": "securities",
            "securities.columns": "SECID,ASSETCODE,LASTTRADEDATE,MINSTEP,STEPPRICE,INITIALMARGIN"})
        _INFO["rows"] = tr.rows(raw.get("securities", {}))
        _INFO["day"] = today
    return _INFO["rows"], today


def contracts(asset):
    rows, today = _load()
    out = []
    for r in rows:
        last = r.get("LASTTRADEDATE") or ""
        if r.get("ASSETCODE") == asset and last > today:
            days = (datetime.strptime(last, "%Y-%m-%d").date() - datetime.strptime(today, "%Y-%m-%d").date()).days
            out.append({"secid": r["SECID"], "last": last, "days_left": days, "minstep": r.get("MINSTEP"),
                        "stepprice": r.get("STEPPRICE"), "margin": r.get("INITIALMARGIN")})
    return sorted(out, key=lambda x: x["last"])


def contract(secid):
    rows, today = _load()
    for r in rows:
        if r["SECID"] == secid:
            last = r.get("LASTTRADEDATE") or today
            days = (datetime.strptime(last, "%Y-%m-%d").date() - datetime.strptime(today, "%Y-%m-%d").date()).days
            return {"secid": secid, "asset": r.get("ASSETCODE"), "last": last, "days_left": days, "minstep": r.get("MINSTEP"),
                    "stepprice": r.get("STEPPRICE"), "margin": r.get("INITIALMARGIN")}
    return None


def next_contract(secid):
    cur = contract(secid)
    if not cur:
        return None
    for c in contracts(cur["asset"]):
        if c["last"] > cur["last"]:
            return c
    return None


def _drop_open(out, minutes, now):
    if out:
        begun = datetime.strptime(out[-1]["begin"], "%Y-%m-%d %H:%M:%S")
        if begun + timedelta(minutes=minutes) > now:
            out = out[:-1]
    return out


def _bcs_parallel(secid, frame, days, step):
    now = datetime.now(tr.timezone.utc)
    tr.bcs_token()
    spans, cur = [], now - timedelta(days=days)
    while cur < now:
        nxt = min(cur + timedelta(days=step), now)
        spans.append((cur, nxt))
        cur = nxt
    with ThreadPoolExecutor(max_workers=6) as ex:
        parts = list(ex.map(lambda s: tr._bcs_chunk(secid, "future", frame, s[0], s[1]), spans))
    seen = {}
    for p in parts:
        for c in p:
            seen[c["begin"]] = c
    return [seen[k] for k in sorted(seen)]


def _moex_hist(secid, interval, days):
    path = tr._candles_path(secid, "future")
    since = (datetime.now(tr.MSK) - timedelta(days=days)).strftime("%Y-%m-%d")
    out, start = [], 0
    for _ in range(12):
        raw = tr.moex(path, {"iss.meta": "off", "interval": str(interval), "from": since, "start": start})
        part = tr._clean(raw.get("candles", {}))
        raw_n = len(raw.get("candles", {}).get("data", []))
        out += part
        if raw_n < 500:
            break
        start += raw_n
    return out


def agg(candles, minutes):
    out = []
    for c in candles:
        d = datetime.strptime(c["begin"], "%Y-%m-%d %H:%M:%S")
        if minutes == 240:
            key = d.replace(hour=d.hour // 4 * 4, minute=0, second=0)
        else:
            key = d.replace(minute=d.minute - d.minute % minutes, second=0)
        k = key.strftime("%Y-%m-%d %H:%M:%S")
        if out and out[-1]["begin"] == k:
            o = out[-1]
            o["high"], o["low"], o["close"], o["volume"] = max(o["high"], c["high"]), min(o["low"], c["low"]), c["close"], o["volume"] + c["volume"]
        else:
            out.append({"begin": k, "open": c.get("open", c["close"]), "high": c["high"], "low": c["low"], "close": c["close"], "volume": c["volume"]})
    return out


def history(secid, tf, days):
    now = datetime.now(tr.MSK).replace(tzinfo=None)
    if tf == 1440:
        out = _moex_hist(secid, 24, days)
        return out[:-1] if out and out[-1]["begin"][:10] >= now.strftime("%Y-%m-%d") else out
    if tf == 5:
        if not __import__("os").environ.get("BCS_REFRESH_TOKEN"):
            raise RuntimeError("для 5-минутных данных нужен токен БКС")
        return _drop_open(_bcs_parallel(secid, "M5", days, 4), 5, now)
    try:
        if not __import__("os").environ.get("BCS_REFRESH_TOKEN"):
            raise RuntimeError("no token")
        h1 = _bcs_parallel(secid, "H1", days, 30)
    except Exception:
        h1 = _moex_hist(secid, 60, days)
    h1 = _drop_open(h1, 60, now)
    if tf == 240:
        return _drop_open(agg(h1, 240), 240, now)
    return h1


def recent5(secid):
    return tr.get_candles(secid, "future", 5)
