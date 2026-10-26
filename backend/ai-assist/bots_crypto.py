import math
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

import requests

HOSTS = ("https://api.bybit.com", "https://api.bytick.com")
FMT = "%Y-%m-%d %H:%M:%S"
SYMBOLS = [
    ["BTCUSDT", "Биткоин BTC/USDT"], ["ETHUSDT", "Эфир ETH/USDT"], ["SOLUSDT", "Solana SOL/USDT"], ["XRPUSDT", "Ripple XRP/USDT"],
    ["BNBUSDT", "BNB/USDT"], ["DOGEUSDT", "Dogecoin DOGE/USDT"], ["ADAUSDT", "Cardano ADA/USDT"], ["LINKUSDT", "Chainlink LINK/USDT"],
    ["AVAXUSDT", "Avalanche AVAX/USDT"], ["LTCUSDT", "Litecoin LTC/USDT"],
]
CODES = {s[0] for s in SYMBOLS}
_TF = {5: ("5", 5), 60: ("60", 60), 240: ("240", 240), 1440: ("D", 1440)}
_INFO = {}


def is_crypto(asset):
    return asset in CODES


def _get(path, params):
    last = None
    for k in range(4):
        host = HOSTS[k % len(HOSTS)]
        try:
            r = requests.get(host + path, params=params, timeout=4, headers={"User-Agent": "erttp-robot/1.0"})
            if r.status_code == 200:
                j = r.json()
                if j.get("retCode") == 0:
                    return j["result"]
                last = f"Bybit: {j.get('retMsg')}"
            else:
                last = f"Bybit HTTP {r.status_code}"
        except requests.RequestException as e:
            last = f"Bybit недоступен: {e.__class__.__name__}"
        time.sleep(0.3)
    raise RuntimeError(last or "Bybit не отвечает")


def _rows(lst):
    out = []
    for x in lst:
        t = datetime.fromtimestamp(int(x[0]) / 1000, timezone.utc).replace(tzinfo=None)
        out.append({"begin": t.strftime(FMT), "open": float(x[1]), "high": float(x[2]), "low": float(x[3]), "close": float(x[4]), "volume": float(x[5])})
    return out


def _chunk(sym, interval, end_ms):
    res = _get("/v5/market/kline", {"category": "linear", "symbol": sym, "interval": interval, "end": end_ms, "limit": 1000})
    return _rows(res.get("list") or [])


def history(sym, tf, days):
    interval, minutes = _TF[tf]
    now = datetime.utcnow()
    n = int(days * 1440 / minutes) + 2
    parts = math.ceil(n / 1000)
    step_ms = 1000 * minutes * 60 * 1000
    now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
    ends = [now_ms - i * step_ms for i in range(parts)]
    with ThreadPoolExecutor(max_workers=6) as ex:
        chunks = list(ex.map(lambda e: _chunk(sym, interval, e), ends))
    seen = {}
    for ch in chunks:
        for c in ch:
            seen[c["begin"]] = c
    out = [seen[k] for k in sorted(seen)]
    if out and datetime.strptime(out[-1]["begin"], FMT) + timedelta(minutes=minutes) > now:
        out = out[:-1]
    cut = (now - timedelta(days=days)).strftime(FMT)
    return [c for c in out if c["begin"] >= cut]


def instrument(sym):
    if sym in _INFO and time.time() - _INFO[sym]["ts"] < 3600:
        return _INFO[sym]
    res = _get("/v5/market/instruments-info", {"category": "linear", "symbol": sym})
    it = res["list"][0]
    tick = float(it["priceFilter"]["tickSize"])
    step = float(it["lotSizeFilter"]["qtyStep"])
    min_qty = float(it["lotSizeFilter"]["minOrderQty"])
    min_notional = float(it["lotSizeFilter"].get("minNotionalValue") or 5)
    tk = _get("/v5/market/tickers", {"category": "linear", "symbol": sym})["list"][0]
    price = float(tk["lastPrice"])
    _INFO[sym] = {"ts": time.time(), "tick": tick, "step": step, "min_qty": min_qty, "min_notional": min_notional, "price": price,
                  "funding": float(tk.get("fundingRate") or 0) * 100, "status": it.get("status")}
    return _INFO[sym]


def info_for(sym, cfg):
    i = instrument(sym)
    lot = i["step"]
    min_lots = max(1, math.ceil(i["min_qty"] / lot - 1e-9), math.ceil(i["min_notional"] / (i["price"] * lot)))
    lev = max(1.0, float(cfg.get("leverage") or 1))
    return {"last": "2099-01-01", "minstep": 1, "stepprice": lot, "margin": i["price"] * lot / lev, "min_lots": min_lots,
            "lot": lot, "ccy": "USDT", "unit": "лот", "tick": i["tick"], "price": i["price"], "funding": i["funding"], "secid": sym}


def funding_blocks(direction, funding_pct, limit):
    if limit <= 0:
        return False
    pays = funding_pct > 0 if direction == "ЛОНГ" else funding_pct < 0
    return pays and abs(funding_pct) > limit


def qty_text(sym, lots, lot):
    q = lots * lot
    coin = sym[:-4]
    return f"{q:.8f}".rstrip("0").rstrip(".") + f" {coin}"


def assets():
    return [[c, n, 10 ** 12] for c, n in SYMBOLS]
