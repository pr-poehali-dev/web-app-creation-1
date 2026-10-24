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


def volume_spike(candles, mult, period=20):
    if len(candles) < period + 2:
        return False
    avg = sum(_vol(c) for c in candles[-period - 1:-1]) / period
    return avg > 0 and _vol(candles[-1]) > mult * avg


def obv_cross(candles, up, period=20):
    if len(candles) < period + 10 or not any(_vol(c) for c in candles):
        return False
    obv = [0.0]
    for i in range(1, len(candles)):
        d = candles[i]["close"] - candles[i - 1]["close"]
        obv.append(obv[-1] + (_vol(candles[i]) if d > 0 else -_vol(candles[i]) if d < 0 else 0))
    sma = _sma_list(obv, period)
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


def psar_flip(candles, up, step=0.02, max_af=0.2):
    c = candles[-120:]
    if len(c) < 10:
        return False
    rising = c[1]["close"] >= c[0]["close"]
    sar = c[0]["low"] if rising else c[0]["high"]
    ep = c[0]["high"] if rising else c[0]["low"]
    af = step
    trend = [rising]
    for i in range(1, len(c)):
        sar = sar + af * (ep - sar)
        if rising:
            sar = min(sar, c[i - 1]["low"], c[max(i - 2, 0)]["low"])
            if c[i]["low"] < sar:
                rising, sar, ep, af = False, ep, c[i]["low"], step
            elif c[i]["high"] > ep:
                ep, af = c[i]["high"], min(af + step, max_af)
        else:
            sar = max(sar, c[i - 1]["high"], c[max(i - 2, 0)]["high"])
            if c[i]["high"] > sar:
                rising, sar, ep, af = True, ep, c[i]["high"], step
            elif c[i]["low"] < ep:
                ep, af = c[i]["low"], min(af + step, max_af)
        trend.append(rising)
    return (trend[-1] and not trend[-2]) if up else ((not trend[-1]) and trend[-2])


def _mid(c, a, b):
    part = c[a:b]
    return (max(x["high"] for x in part) + min(x["low"] for x in part)) / 2


def ichimoku_cross(candles, up, tenkan=9, kijun=26):
    n = len(candles)
    if n < kijun + 4:
        return False
    t0, k0 = _mid(candles, n - tenkan, n), _mid(candles, n - kijun, n)
    t1, k1 = _mid(candles, n - tenkan - 1, n - 1), _mid(candles, n - kijun - 1, n - 1)
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


def alligator(candles, up, jaw_n=13, teeth_n=8, lips_n=5):
    if len(candles) < jaw_n + 30:
        return False
    med = [(c["high"] + c["low"]) / 2 for c in candles]
    k = len(med) - 1
    jaw = _smma_list(med, jaw_n)[k - 8]
    teeth = _smma_list(med, teeth_n)[k - 5]
    lips = _smma_list(med, lips_n)[k - 3]
    if None in (jaw, teeth, lips):
        return False
    return lips > teeth > jaw if up else lips < teeth < jaw


def _ao_series(candles, fast=5, slow=34):
    med = [(c["high"] + c["low"]) / 2 for c in candles]
    f, s = _sma_list(med, fast), _sma_list(med, slow)
    return [None if a is None or b is None else a - b for a, b in zip(f, s)]


def ao_cross(candles, up, fast=5, slow=34):
    if len(candles) < slow + 4:
        return False
    ao = _ao_series(candles, fast, slow)
    if ao[-1] is None or ao[-2] is None:
        return False
    return (ao[-1] > 0 >= ao[-2]) if up else (ao[-1] < 0 <= ao[-2])


def ac_cross(candles, up, fast=5, slow=34):
    if len(candles) < slow + 8:
        return False
    ao = [x for x in _ao_series(candles, fast, slow) if x is not None]
    sm = _sma_list(ao, 5)
    ac = [None if m is None else a - m for a, m in zip(ao, sm)]
    if len(ac) < 2 or ac[-1] is None or ac[-2] is None:
        return False
    return (ac[-1] > 0 >= ac[-2]) if up else (ac[-1] < 0 <= ac[-2])


def fractal_break(candles, up, side=2):
    c = candles[-60:]
    n = len(c)
    if n < side * 4 + 2:
        return False
    key = "high" if up else "low"
    vals = [x[key] for x in c]
    level = None
    for i in range(n - side - 1, side - 1, -1):
        w = vals[i - side:i + side + 1]
        best = max(w) if up else min(w)
        if vals[i] == best and w.count(best) == 1:
            level = vals[i]
            break
    if level is None:
        return False
    last, prev = c[-1]["close"], c[-2]["close"]
    return (last > level and prev <= level) if up else (last < level and prev >= level)


def ad_cross(candles, up, period=20):
    if len(candles) < period + 10 or not any(_vol(c) for c in candles):
        return False
    line, acc = [], 0.0
    for c in candles:
        rng = c["high"] - c["low"]
        mfm = 0.0 if rng == 0 else ((c["close"] - c["low"]) - (c["high"] - c["close"])) / rng
        acc += mfm * _vol(c)
        line.append(acc)
    sma = _sma_list(line, period)
    if sma[-1] is None or sma[-2] is None:
        return False
    return (line[-1] > sma[-1] and line[-2] <= sma[-2]) if up else (line[-1] < sma[-1] and line[-2] >= sma[-2])
