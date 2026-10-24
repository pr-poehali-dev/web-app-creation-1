def _sma_list(vals, n):
    out = [None] * len(vals)
    s = 0.0
    for i, v in enumerate(vals):
        s += v
        if i >= n:
            s -= vals[i - n]
        if i >= n - 1:
            out[i] = s / n
    return out


def _smma_list(vals, n):
    out = [None] * len(vals)
    if len(vals) < n:
        return out
    prev = sum(vals[:n]) / n
    out[n - 1] = prev
    for i in range(n, len(vals)):
        prev = (prev * (n - 1) + vals[i]) / n
        out[i] = prev
    return out


def _vol(c):
    return float(c.get("volume") or 0)


def _tp(c):
    return (c["high"] + c["low"] + c["close"]) / 3


def volume_spike(candles, mult):
    if len(candles) < 22:
        return False
    avg = sum(_vol(c) for c in candles[-21:-1]) / 20
    return avg > 0 and _vol(candles[-1]) > mult * avg


def obv_cross(candles, up):
    if len(candles) < 30 or not any(_vol(c) for c in candles):
        return False
    obv = [0.0]
    for i in range(1, len(candles)):
        d = candles[i]["close"] - candles[i - 1]["close"]
        obv.append(obv[-1] + (_vol(candles[i]) if d > 0 else -_vol(candles[i]) if d < 0 else 0))
    sma = _sma_list(obv, 20)
    if sma[-1] is None or sma[-2] is None:
        return False
    return (obv[-1] > sma[-1] and obv[-2] <= sma[-2]) if up else (obv[-1] < sma[-1] and obv[-2] >= sma[-2])


def mfi(candles, n=14):
    if len(candles) < n + 1 or not any(_vol(c) for c in candles[-n - 1:]):
        return None
    pos = neg = 0.0
    for i in range(len(candles) - n, len(candles)):
        flow = _tp(candles[i]) * _vol(candles[i])
        if _tp(candles[i]) > _tp(candles[i - 1]):
            pos += flow
        elif _tp(candles[i]) < _tp(candles[i - 1]):
            neg += flow
    return 100.0 if neg == 0 else 100 - 100 / (1 + pos / neg)


def vwap(candles, period):
    part = candles[-period:]
    vol = sum(_vol(c) for c in part)
    if len(part) < period or vol <= 0:
        return None
    return sum(_tp(c) * _vol(c) for c in part) / vol


def adx(candles, n=14):
    if len(candles) < n * 2 + 2:
        return None
    trs, pdm, mdm = [], [], []
    for i in range(1, len(candles)):
        c, p = candles[i], candles[i - 1]
        up, dn = c["high"] - p["high"], p["low"] - c["low"]
        pdm.append(up if up > dn and up > 0 else 0.0)
        mdm.append(dn if dn > up and dn > 0 else 0.0)
        trs.append(max(c["high"] - c["low"], abs(c["high"] - p["close"]), abs(c["low"] - p["close"])))
    st, sp, sm = _smma_list(trs, n), _smma_list(pdm, n), _smma_list(mdm, n)
    dx, pdi, mdi = [], 0.0, 0.0
    for i in range(len(trs)):
        if st[i]:
            pdi, mdi = 100 * sp[i] / st[i], 100 * sm[i] / st[i]
            dx.append(100 * abs(pdi - mdi) / (pdi + mdi) if pdi + mdi else 0.0)
    a = _smma_list(dx, n)
    return (a[-1], pdi, mdi) if a and a[-1] is not None else None


def psar_flip(candles, up):
    c = candles[-120:]
    if len(c) < 10:
        return False
    rising = c[1]["close"] >= c[0]["close"]
    sar = c[0]["low"] if rising else c[0]["high"]
    ep = c[0]["high"] if rising else c[0]["low"]
    af = 0.02
    trend = [rising]
    for i in range(1, len(c)):
        sar = sar + af * (ep - sar)
        if rising:
            sar = min(sar, c[i - 1]["low"], c[max(i - 2, 0)]["low"])
            if c[i]["low"] < sar:
                rising, sar, ep, af = False, ep, c[i]["low"], 0.02
            elif c[i]["high"] > ep:
                ep, af = c[i]["high"], min(af + 0.02, 0.2)
        else:
            sar = max(sar, c[i - 1]["high"], c[max(i - 2, 0)]["high"])
            if c[i]["high"] > sar:
                rising, sar, ep, af = True, ep, c[i]["high"], 0.02
            elif c[i]["low"] < ep:
                ep, af = c[i]["low"], min(af + 0.02, 0.2)
        trend.append(rising)
    return (trend[-1] and not trend[-2]) if up else ((not trend[-1]) and trend[-2])


def _mid(c, a, b):
    part = c[a:b]
    return (max(x["high"] for x in part) + min(x["low"] for x in part)) / 2


def ichimoku_cross(candles, up):
    n = len(candles)
    if n < 30:
        return False
    t0, k0 = _mid(candles, n - 9, n), _mid(candles, n - 26, n)
    t1, k1 = _mid(candles, n - 10, n - 1), _mid(candles, n - 27, n - 1)
    return (t0 > k0 and t1 <= k1) if up else (t0 < k0 and t1 >= k1)


def stochastic(candles, n=14, smooth=3):
    if len(candles) < n + smooth:
        return None
    raw = []
    for i in range(len(candles) - n - smooth + 1, len(candles)):
        part = candles[i - n + 1:i + 1]
        hh, ll = max(x["high"] for x in part), min(x["low"] for x in part)
        raw.append(50.0 if hh == ll else (candles[i]["close"] - ll) / (hh - ll) * 100)
    return sum(raw[-smooth:]) / smooth


def cci(candles, n=20):
    if len(candles) < n:
        return None
    tps = [_tp(c) for c in candles[-n:]]
    m = sum(tps) / n
    md = sum(abs(x - m) for x in tps) / n
    return 0.0 if md == 0 else (tps[-1] - m) / (0.015 * md)


def williams_r(candles, n=14):
    if len(candles) < n:
        return None
    part = candles[-n:]
    hh, ll = max(x["high"] for x in part), min(x["low"] for x in part)
    return -50.0 if hh == ll else (hh - candles[-1]["close"]) / (hh - ll) * -100


def alligator(candles, up):
    if len(candles) < 40:
        return False
    med = [(c["high"] + c["low"]) / 2 for c in candles]
    k = len(med) - 1
    jaw = _smma_list(med, 13)[k - 8]
    teeth = _smma_list(med, 8)[k - 5]
    lips = _smma_list(med, 5)[k - 3]
    if None in (jaw, teeth, lips):
        return False
    return lips > teeth > jaw if up else lips < teeth < jaw


def _ao_series(candles):
    med = [(c["high"] + c["low"]) / 2 for c in candles]
    f, s = _sma_list(med, 5), _sma_list(med, 34)
    return [None if a is None or b is None else a - b for a, b in zip(f, s)]


def ao_cross(candles, up):
    if len(candles) < 38:
        return False
    ao = _ao_series(candles)
    if ao[-1] is None or ao[-2] is None:
        return False
    return (ao[-1] > 0 >= ao[-2]) if up else (ao[-1] < 0 <= ao[-2])


def ac_cross(candles, up):
    if len(candles) < 42:
        return False
    ao = [x for x in _ao_series(candles) if x is not None]
    sm = _sma_list(ao, 5)
    ac = [None if m is None else a - m for a, m in zip(ao, sm)]
    if len(ac) < 2 or ac[-1] is None or ac[-2] is None:
        return False
    return (ac[-1] > 0 >= ac[-2]) if up else (ac[-1] < 0 <= ac[-2])


def fractal_break(candles, up):
    c = candles[-60:]
    n = len(c)
    if n < 10:
        return False
    key = "high" if up else "low"
    vals = [x[key] for x in c]
    level = None
    for i in range(n - 3, 1, -1):
        w = vals[i - 2:i + 3]
        ok = vals[i] == max(w) and w.count(vals[i]) == 1 if up else vals[i] == min(w) and w.count(vals[i]) == 1
        if ok:
            level = vals[i]
            break
    if level is None:
        return False
    last, prev = c[-1]["close"], c[-2]["close"]
    return (last > level and prev <= level) if up else (last < level and prev >= level)
