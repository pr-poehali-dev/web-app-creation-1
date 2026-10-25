import indicators


def _ema(vals, n):
    k = 2 / (n + 1)
    e = vals[0]
    for v in vals[1:]:
        e = v * k + e * (1 - k)
    return e


def _rsi(closes, n=14):
    g = l = 0.0
    for i in range(len(closes) - n, len(closes)):
        d = closes[i] - closes[i - 1]
        if d > 0:
            g += d
        else:
            l -= d
    return 100.0 if l == 0 else 100 - 100 / (1 + g / l)


def _atr(candles, n=14):
    trs = []
    for i in range(len(candles) - n, len(candles)):
        c, pc = candles[i], candles[i - 1]["close"]
        trs.append(max(c["high"] - c["low"], abs(c["high"] - pc), abs(c["low"] - pc)))
    return sum(trs) / len(trs)


def _bands(closes, n=20, k=2.0):
    seg = closes[-n:]
    m = sum(seg) / n
    sd = (sum((x - m) ** 2 for x in seg) / n) ** 0.5
    return m - k * sd, m, m + k * sd


def _daily(candles):
    days = {}
    for c in candles:
        d = c["begin"][:10]
        if d not in days:
            days[d] = {"high": c["high"], "low": c["low"], "close": c["close"]}
        else:
            x = days[d]
            x["high"] = max(x["high"], c["high"])
            x["low"] = min(x["low"], c["low"])
            x["close"] = c["close"]
    return [days[k] for k in sorted(days)]


def _pivots(candles):
    d = _daily(candles)
    if len(d) < 2:
        return None
    p = d[-2]
    pv = (p["high"] + p["low"] + p["close"]) / 3
    return pv, 2 * pv - p["high"], 2 * pv - p["low"]


def daily_trend(candles):
    dc = [d["close"] for d in _daily(candles)]
    if len(dc) < 21:
        return 0
    e10, e20 = _ema(dc, 10), _ema(dc, 20)
    if e10 > e20 and dc[-1] > e20:
        return 1
    if e10 < e20 and dc[-1] < e20:
        return -1
    return 0


def range_signal(candles, allow_short, cfg):
    closes = [c["close"] for c in candles]
    last, prev_close = closes[-1], closes[-2]
    c = candles[-1]
    atr = _atr(candles)
    rsi = _rsi(closes)
    lo_b, mid, up_b = _bands(closes)
    window = candles[-41:-1]
    sup = min(x["low"] for x in window)
    res = max(x["high"] for x in window)
    if res - sup < 2.5 * atr:
        return None
    src = cfg.get("range_src") or ["boll", "level", "pivot"]
    piv = _pivots(candles) if "pivot" in src else None
    why_long = why_short = None
    if "boll" in src and c["low"] <= lo_b and last > lo_b and rsi < 45:
        why_long = f"Боковик: отбой от нижней полосы Боллинджера {lo_b:.2f}, RSI {rsi:.0f}"
    if not why_long and "level" in src and c["low"] <= sup + 0.25 * atr and last > prev_close and rsi < 45:
        why_long = f"Боковик: отбой от поддержки {sup:.2f}, RSI {rsi:.0f}"
    if not why_long and piv and c["low"] <= piv[1] + 0.2 * atr and last > piv[1] and last > prev_close:
        why_long = f"Боковик: отбой от Pivot S1 {piv[1]:.2f}"
    if "boll" in src and c["high"] >= up_b and last < up_b and rsi > 55:
        why_short = f"Боковик: отбой от верхней полосы Боллинджера {up_b:.2f}, RSI {rsi:.0f}"
    if not why_short and "level" in src and c["high"] >= res - 0.25 * atr and last < prev_close and rsi > 55:
        why_short = f"Боковик: отбой от сопротивления {res:.2f}, RSI {rsi:.0f}"
    if not why_short and piv and c["high"] >= piv[2] - 0.2 * atr and last < piv[2] and last < prev_close:
        why_short = f"Боковик: отбой от Pivot R1 {piv[2]:.2f}"
    if why_long:
        t1 = max(mid, last + 0.8 * atr)
        t2 = max(up_b, res, t1 + 0.8 * atr)
        stop = min(c["low"] - 0.3 * atr, last - 1.0 * atr)
        return ("ЛОНГ", last, stop, t1, t2, why_long, last, atr)
    if why_short and allow_short:
        t1 = min(mid, last - 0.8 * atr)
        t2 = min(lo_b, sup, t1 - 0.8 * atr)
        stop = max(c["high"] + 0.3 * atr, last + 1.0 * atr)
        return ("ШОРТ", last, stop, t1, t2, why_short, last, atr)
    return None


def pullback_signal(candles, allow_short, cfg):
    trend = daily_trend(candles)
    if trend == 0:
        return None
    closes = [c["close"] for c in candles]
    last, prev_close = closes[-1], closes[-2]
    c = candles[-1]
    atr = _atr(candles)
    e55 = _ema(closes[-300:], 55)
    lo_b, _, up_b = _bands(closes)
    src = cfg.get("pb_src") or ["ema55", "boll"]
    if trend == 1:
        why = None
        if "ema55" in src and c["low"] <= e55 + 0.1 * atr and last > e55 and last > prev_close:
            why = f"Отбой от EMA55 {e55:.2f} в дневном росте"
        elif "boll" in src and c["low"] <= lo_b and last > lo_b:
            why = f"Отбой от нижней полосы Боллинджера {lo_b:.2f} в дневном росте"
        if why:
            return ("ЛОНГ", last, last - 1.5 * atr, last + 1.5 * atr, last + 3 * atr, why, last, atr)
    elif allow_short and cfg.get("pb_short"):
        why = None
        if "ema55" in src and c["high"] >= e55 - 0.1 * atr and last < e55 and last < prev_close:
            why = f"Отбой вниз от EMA55 {e55:.2f} в дневном падении"
        elif "boll" in src and c["high"] >= up_b and last < up_b:
            why = f"Отбой от верхней полосы Боллинджера {up_b:.2f} в дневном падении"
        if why:
            return ("ШОРТ", last, last + 1.5 * atr, last - 1.5 * atr, last - 3 * atr, why, last, atr)
    return None


def analyze(candles, allow_short, cfg, trend_analyze):
    if len(candles) < 60:
        return None
    ax = indicators.adx(candles[-120:])
    if ax is None:
        return None
    mode = cfg.get("mode", "")
    sideways = ax[0] < cfg.get("range_adx", 20)
    base_cfg = {k: v for k, v in cfg.items() if k != "mode"}
    if sideways:
        if mode in ("range", "all", "range_only"):
            return range_signal(candles, allow_short, cfg)
        return None
    if mode == "range_only":
        return None
    sig = trend_analyze(candles, allow_short, base_cfg)
    if sig:
        return sig
    if mode in ("pullback", "all"):
        return pullback_signal(candles, allow_short, cfg)
    return None
