LABELS = {
    "rsi": "RSI",
    "sma_cross": "Пересечение средних",
    "price_vs_sma": "Цена относительно средней",
    "macd": "MACD пересёк сигнальную",
    "bollinger": "Полосы Боллинджера",
    "breakout": "Пробой уровня",
    "double_bottom": "Двойное дно",
    "double_top": "Двойная вершина",
    "head_shoulders": "Голова и плечи",
    "inverse_head_shoulders": "Перевёрнутая голова и плечи",
    "volume_spike": "Всплеск объёма",
    "obv": "OBV (балансовый объём)",
    "mfi": "MFI (денежный поток)",
    "vwap": "Цена относительно VWAP",
    "adx": "ADX (сила тренда)",
    "psar": "Parabolic SAR",
    "ichimoku": "Ишимоку",
    "stochastic": "Стохастик",
    "cci": "CCI",
    "williams_r": "Williams %R",
    "alligator": "Аллигатор Билла Вильямса",
    "ao": "Awesome Oscillator",
    "ac": "Accelerator Oscillator",
    "fractal": "Фракталы Билла Вильямса",
    "range_breakout": "Выход из узкого диапазона",
    "divergence_rsi": "Дивергенция по RSI",
    "divergence_macd": "Дивергенция по MACD",
}


def _num(v, lo, hi, default):
    try:
        v = float(v)
    except (TypeError, ValueError):
        return default
    return max(lo, min(hi, v))


TIMEFRAMES = (5, 10, 60)
POLL_MINUTES = 15


def tf_label(tf: int) -> str:
    return "1 час" if tf == 60 else f"{tf} мин"


def sanitize(conds) -> list:
    out = []
    if not isinstance(conds, list):
        return out
    for c in conds[:6]:
        before = len(out)
        _sanitize_one(c, out)
        if len(out) > before:
            try:
                tf = int(c.get("tf"))
            except (TypeError, ValueError):
                tf = 0
            if tf in TIMEFRAMES:
                out[-1]["tf"] = tf
    return out


def _sanitize_one(c, out: list) -> None:
    if True:
        if not isinstance(c, dict) or c.get("type") not in LABELS:
            return
        t = c["type"]
        d = c.get("dir") if c.get("dir") in ("up", "down") else "up"
        if t == "rsi":
            out.append({"type": t, "op": "<" if c.get("op") == "<" else ">", "value": _num(c.get("value"), 1, 99, 30)})
        elif t == "sma_cross":
            fast = int(_num(c.get("fast"), 2, 100, 20))
            slow = int(_num(c.get("slow"), 3, 120, 50))
            if fast >= slow:
                fast, slow = min(fast, slow - 1), max(slow, fast + 1)
            out.append({"type": t, "fast": fast, "slow": slow, "dir": d})
        elif t == "price_vs_sma":
            out.append({"type": t, "period": int(_num(c.get("period"), 2, 120, 50)), "op": "below" if c.get("op") == "below" else "above"})
        elif t == "macd":
            out.append({"type": t, "dir": d})
        elif t == "bollinger":
            out.append({"type": t, "op": "above_upper" if c.get("op") == "above_upper" else "below_lower"})
        elif t == "breakout":
            out.append({"type": t, "period": int(_num(c.get("period"), 5, 100, 20)), "dir": d})
        elif t in ("double_bottom", "double_top", "head_shoulders", "inverse_head_shoulders"):
            out.append({"type": t})
        elif t in ("divergence_rsi", "divergence_macd"):
            out.append({"type": t, "dir": d})
        elif t == "range_breakout":
            out.append({"type": t, "period": int(_num(c.get("period"), 8, 60, 20)), "dir": d})
        elif t == "volume_spike":
            out.append({"type": t, "mult": round(_num(c.get("mult"), 1.2, 10, 2), 1)})
        elif t == "mfi":
            out.append({"type": t, "op": "<" if c.get("op") == "<" else ">", "value": _num(c.get("value"), 1, 99, 20)})
        elif t == "stochastic":
            out.append({"type": t, "op": "<" if c.get("op") == "<" else ">", "value": _num(c.get("value"), 1, 99, 20)})
        elif t == "cci":
            out.append({"type": t, "op": "<" if c.get("op") == "<" else ">", "value": _num(c.get("value"), -300, 300, -100)})
        elif t == "williams_r":
            out.append({"type": t, "op": "<" if c.get("op") == "<" else ">", "value": _num(c.get("value"), -99, -1, -80)})
        elif t == "vwap":
            out.append({"type": t, "op": "below" if c.get("op") == "below" else "above", "period": int(_num(c.get("period"), 10, 200, 50))})
        elif t == "adx":
            out.append({"type": t, "dir": d, "value": _num(c.get("value"), 10, 60, 25)})
        elif t in ("obv", "psar", "ichimoku", "alligator", "ao", "ac", "fractal"):
            out.append({"type": t, "dir": d})


def describe(c: dict) -> str:
    text = _describe(c)
    return f"{text} ({tf_label(c['tf'])})" if c.get("tf") else text


def _describe(c: dict) -> str:
    t = c["type"]
    if t == "rsi":
        return f"RSI {'<' if c['op'] == '<' else '>'} {c['value']:.0f}"
    if t == "sma_cross":
        return f"средняя {c['fast']} пересекла {c['slow']} {'снизу вверх' if c['dir'] == 'up' else 'сверху вниз'}"
    if t == "price_vs_sma":
        return f"цена {'выше' if c['op'] == 'above' else 'ниже'} средней {c['period']}"
    if t == "macd":
        return f"MACD пересёк сигнальную {'вверх' if c['dir'] == 'up' else 'вниз'}"
    if t == "bollinger":
        return "цена ниже нижней полосы Боллинджера" if c["op"] == "below_lower" else "цена выше верхней полосы Боллинджера"
    if t == "breakout":
        return f"пробой {'максимума' if c['dir'] == 'up' else 'минимума'} за {c['period']} ч"
    if t == "double_bottom":
        return "двойное дно с пробоем линии шеи"
    if t == "double_top":
        return "двойная вершина с пробоем линии шеи"
    if t == "head_shoulders":
        return "«голова и плечи» с пробоем линии шеи вниз"
    if t == "inverse_head_shoulders":
        return "перевёрнутая «голова и плечи» с пробоем линии шеи вверх"
    if t in ("divergence_rsi", "divergence_macd"):
        name = "RSI" if t == "divergence_rsi" else "MACD"
        return f"{'бычья' if c['dir'] == 'up' else 'медвежья'} дивергенция по {name}"
    up = c.get("dir") == "up"
    if t == "volume_spike":
        return f"объём выше среднего в {c['mult']:g} раз"
    if t == "obv":
        return f"OBV пересёк свою среднюю {'вверх' if up else 'вниз'}"
    if t == "mfi":
        return f"MFI {'<' if c['op'] == '<' else '>'} {c['value']:.0f}"
    if t == "vwap":
        return f"цена {'выше' if c['op'] == 'above' else 'ниже'} VWAP за {c['period']} свечей"
    if t == "adx":
        return f"ADX выше {c['value']:.0f}, тренд {'вверх' if up else 'вниз'}"
    if t == "psar":
        return f"Parabolic SAR развернулся {'вверх' if up else 'вниз'}"
    if t == "ichimoku":
        return f"Ишимоку: Тэнкан пересёк Киджун {'вверх' if up else 'вниз'}"
    if t == "stochastic":
        return f"Стохастик {'<' if c['op'] == '<' else '>'} {c['value']:.0f}"
    if t == "cci":
        return f"CCI {'<' if c['op'] == '<' else '>'} {c['value']:.0f}"
    if t == "williams_r":
        return f"Williams %R {'<' if c['op'] == '<' else '>'} {c['value']:.0f}"
    if t == "alligator":
        return f"Аллигатор: пасть открыта {'вверх' if up else 'вниз'}"
    if t == "ao":
        return f"Awesome Oscillator пересёк ноль {'вверх' if up else 'вниз'}"
    if t == "ac":
        return f"Accelerator Oscillator пересёк ноль {'вверх' if up else 'вниз'}"
    if t == "fractal":
        return f"пробой {'верхнего' if up else 'нижнего'} фрактала"
    if t == "range_breakout":
        return f"выход {'вверх' if c['dir'] == 'up' else 'вниз'} из узкого диапазона {c['period']} ч"
    return t


import indicators


def _sma(vals, n, shift=0):
    end = len(vals) - shift
    if end - n < 0:
        return None
    return sum(vals[end - n:end]) / n


def _ema(vals, n):
    k = 2 / (n + 1)
    out = [vals[0]]
    for v in vals[1:]:
        out.append(v * k + out[-1] * (1 - k))
    return out


def _rsi(closes, n=14):
    if len(closes) < n + 1:
        return None
    gains = losses = 0.0
    for i in range(len(closes) - n, len(closes)):
        d = closes[i] - closes[i - 1]
        if d > 0:
            gains += d
        else:
            losses -= d
    return 100.0 if losses == 0 else 100 - 100 / (1 + gains / losses)


def _pivots(values, kind, side=2):
    res = []
    for i in range(side, len(values) - side):
        window = values[i - side:i + side + 1]
        if kind == "low" and values[i] == min(window) and window.index(values[i]) == side:
            res.append(i)
        if kind == "high" and values[i] == max(window) and window.index(values[i]) == side:
            res.append(i)
    return res


def _double_pattern(candles, bottom: bool) -> bool:
    w = candles[-45:]
    if len(w) < 25:
        return False
    key = "low" if bottom else "high"
    vals = [c[key] for c in w]
    piv = [i for i in _pivots(vals, key) if i <= len(w) - 3]
    if len(piv) < 2:
        return False
    for j in range(len(piv) - 1, 0, -1):
        b, a = piv[j], piv[j - 1]
        if b < len(w) - 20 or b - a < 5:
            continue
        if abs(vals[a] - vals[b]) / vals[a] > 0.012:
            continue
        between = w[a:b + 1]
        neck = max(c["high"] for c in between) if bottom else min(c["low"] for c in between)
        last, prev = w[-1]["close"], w[-2]["close"]
        if bottom and last > neck and prev <= neck:
            return True
        if not bottom and last < neck and prev >= neck:
            return True
    return False


def _hs_pattern(candles, inverse: bool) -> bool:
    w = candles[-90:]
    n = len(w)
    if n < 40:
        return False
    key = "low" if inverse else "high"
    vals = [c[key] for c in w]
    piv = [i for i in _pivots(vals, key) if i <= n - 3]
    if len(piv) < 3:
        return False
    for k in range(len(piv) - 1, 1, -1):
        l, h, r = piv[k - 2], piv[k - 1], piv[k]
        if r < n - 30:
            break
        if h - l < 4 or r - h < 4:
            continue
        if inverse:
            if not (vals[h] < vals[l] and vals[h] < vals[r]):
                continue
            prom = min(vals[l], vals[r]) - vals[h]
        else:
            if not (vals[h] > vals[l] and vals[h] > vals[r]):
                continue
            prom = vals[h] - max(vals[l], vals[r])
        if prom / vals[h] < 0.004 or abs(vals[l] - vals[r]) > 0.6 * prom:
            continue
        if inverse:
            i1 = max(range(l, h + 1), key=lambda x: w[x]["high"])
            i2 = max(range(h, r + 1), key=lambda x: w[x]["high"])
            v1, v2 = w[i1]["high"], w[i2]["high"]
        else:
            i1 = min(range(l, h + 1), key=lambda x: w[x]["low"])
            i2 = min(range(h, r + 1), key=lambda x: w[x]["low"])
            v1, v2 = w[i1]["low"], w[i2]["low"]
        if i2 == i1:
            continue

        def neck(x):
            return v1 + (v2 - v1) * (x - i1) / (i2 - i1)

        last, prev = w[-1]["close"], w[-2]["close"]
        if inverse and last > neck(n - 1) and prev <= neck(n - 2):
            return True
        if not inverse and last < neck(n - 1) and prev >= neck(n - 2):
            return True
    return False


def _rsi_series(closes, n=14):
    out = [None] * len(closes)
    for i in range(n, len(closes)):
        gains = losses = 0.0
        for k in range(i - n + 1, i + 1):
            d = closes[k] - closes[k - 1]
            if d > 0:
                gains += d
            else:
                losses -= d
        out[i] = 100.0 if losses == 0 else 100 - 100 / (1 + gains / losses)
    return out


def _macd_series(closes):
    macd = [a - b for a, b in zip(_ema(closes, 12), _ema(closes, 26))]
    return [v if i >= 35 else None for i, v in enumerate(macd)]


def _divergence(candles, series, bullish: bool) -> bool:
    n = len(candles)
    start = max(0, n - 70)
    key = "low" if bullish else "high"
    vals = [c[key] for c in candles]
    piv = [i + start for i in _pivots(vals[start:], key, side=3)]
    piv = [i for i in piv if series[i] is not None]
    if len(piv) < 2:
        return False
    a, b = piv[-2], piv[-1]
    if b < n - 15 or b - a < 5:
        return False
    if bullish:
        return vals[b] < vals[a] * 0.999 and series[b] > series[a]
    return vals[b] > vals[a] * 1.001 and series[b] < series[a]


def check(c: dict, candles: list) -> bool:
    closes = [x["close"] for x in candles]
    t = c["type"]
    if len(closes) < 30:
        return False
    if t == "rsi":
        r = _rsi(closes)
        return r is not None and (r < c["value"] if c["op"] == "<" else r > c["value"])
    if t == "sma_cross":
        f0, s0 = _sma(closes, c["fast"]), _sma(closes, c["slow"])
        f1, s1 = _sma(closes, c["fast"], 1), _sma(closes, c["slow"], 1)
        if None in (f0, s0, f1, s1):
            return False
        return (f0 > s0 and f1 <= s1) if c["dir"] == "up" else (f0 < s0 and f1 >= s1)
    if t == "price_vs_sma":
        m = _sma(closes, c["period"])
        return m is not None and (closes[-1] > m if c["op"] == "above" else closes[-1] < m)
    if t == "macd":
        if len(closes) < 35:
            return False
        macd = [a - b for a, b in zip(_ema(closes, 12), _ema(closes, 26))]
        sig = _ema(macd, 9)
        return (macd[-1] > sig[-1] and macd[-2] <= sig[-2]) if c["dir"] == "up" else (macd[-1] < sig[-1] and macd[-2] >= sig[-2])
    if t == "bollinger":
        part = closes[-20:]
        m = sum(part) / 20
        sd = (sum((x - m) ** 2 for x in part) / 20) ** 0.5
        return closes[-1] < m - 2 * sd if c["op"] == "below_lower" else closes[-1] > m + 2 * sd
    if t == "breakout":
        prev = candles[-c["period"] - 1:-1]
        if len(prev) < c["period"]:
            return False
        if c["dir"] == "up":
            return closes[-1] > max(x["high"] for x in prev)
        return closes[-1] < min(x["low"] for x in prev)
    if t == "divergence_rsi":
        if len(closes) < 40:
            return False
        return _divergence(candles, _rsi_series(closes), c["dir"] == "up")
    if t == "divergence_macd":
        if len(closes) < 50:
            return False
        return _divergence(candles, _macd_series(closes), c["dir"] == "up")
    if t == "double_bottom":
        return _double_pattern(candles, True)
    if t == "double_top":
        return _double_pattern(candles, False)
    if t == "head_shoulders":
        return _hs_pattern(candles, False)
    if t == "inverse_head_shoulders":
        return _hs_pattern(candles, True)
    up = c.get("dir") == "up"
    if t == "volume_spike":
        return indicators.volume_spike(candles, c["mult"])
    if t == "obv":
        return indicators.obv_cross(candles, up)
    if t in ("mfi", "stochastic", "cci", "williams_r"):
        fn = {"mfi": indicators.mfi, "stochastic": indicators.stochastic, "cci": indicators.cci, "williams_r": indicators.williams_r}[t]
        v = fn(candles)
        return v is not None and (v < c["value"] if c["op"] == "<" else v > c["value"])
    if t == "vwap":
        v = indicators.vwap(candles, c["period"])
        return v is not None and (closes[-1] > v if c["op"] == "above" else closes[-1] < v)
    if t == "adx":
        r = indicators.adx(candles)
        if not r:
            return False
        return r[0] > c["value"] and (r[1] > r[2] if up else r[2] > r[1])
    if t == "psar":
        return indicators.psar_flip(candles, up)
    if t == "ichimoku":
        return indicators.ichimoku_cross(candles, up)
    if t == "alligator":
        return indicators.alligator(candles, up)
    if t == "ao":
        return indicators.ao_cross(candles, up)
    if t == "ac":
        return indicators.ac_cross(candles, up)
    if t == "fractal":
        return indicators.fractal_break(candles, up)
    if t == "range_breakout":
        prev = candles[-c["period"] - 1:-1]
        if len(prev) < c["period"]:
            return False
        hh, ll = max(x["high"] for x in prev), min(x["low"] for x in prev)
        if (hh - ll) / ll > 0.05:
            return False
        return closes[-1] > hh if c["dir"] == "up" else closes[-1] < ll
    return False


def atr(candles: list, n: int = 14) -> float:
    trs = []
    for i in range(len(candles) - n, len(candles)):
        c, pc = candles[i], candles[i - 1]["close"]
        trs.append(max(c["high"] - c["low"], abs(c["high"] - pc), abs(c["low"] - pc)))
    return sum(trs) / len(trs)


def rule_tf(rule: dict) -> int:
    tf = int(rule.get("timeframe") or 60)
    return tf if tf in TIMEFRAMES else 60


def needed_tfs(rule: dict, with_exit: bool = True) -> set:
    base = rule_tf(rule)
    tfs = {base}
    for c in (rule.get("entry_conditions") or []) + ((rule.get("exit_conditions") or []) if with_exit else []):
        tfs.add(c.get("tf") or base)
    return tfs


def cond_true(c: dict, base_tf: int, by_tf: dict) -> bool:
    tf = c.get("tf") or base_tf
    cs = by_tf.get(tf) or []
    lookback = max(1, -(-POLL_MINUTES // tf))
    for k in range(lookback):
        part = cs[:len(cs) - k] if k else cs
        if len(part) >= 30 and check(c, part):
            return True
    return False


def evaluate_entry(rule: dict, by_tf: dict):
    conds = rule["entry_conditions"] or []
    base = rule_tf(rule)
    main = by_tf.get(base) or []
    if not conds or len(main) < 30:
        return None
    if not all(cond_true(c, base, by_tf) for c in conds):
        return None
    last = main[-1]["close"]
    a = atr(main)
    sa, t1a, t2a = float(rule["stop_atr"]), float(rule["target1_atr"]), float(rule["target2_atr"])
    reason = f"Правило «{rule['name']}» ({tf_label(base)}): " + "; ".join(describe(c) for c in conds)
    if rule["direction"] == "ЛОНГ":
        return ("ЛОНГ", last, last - sa * a, last + t1a * a, last + t2a * a, reason, last, a)
    return ("ШОРТ", last, last + sa * a, last - t1a * a, last - t2a * a, reason, last, a)


def exit_reason(rule: dict, by_tf: dict) -> str:
    base = rule_tf(rule)
    for c in rule.get("exit_conditions") or []:
        if cond_true(c, base, by_tf):
            return describe(c)
    return ""


def mirror(conds: list) -> list:
    flip = {"up": "down", "down": "up"}
    out = []
    for c in conds:
        m = dict(c)
        t = c["type"]
        if t in ("rsi", "mfi", "stochastic"):
            m["op"] = ">" if c["op"] == "<" else "<"
            m["value"] = round(100 - c["value"], 1)
        elif t == "cci":
            m["op"] = ">" if c["op"] == "<" else "<"
            m["value"] = round(-c["value"], 1)
        elif t == "williams_r":
            m["op"] = ">" if c["op"] == "<" else "<"
            m["value"] = round(-100 - c["value"], 1)
        elif t == "vwap":
            m["op"] = "below" if c["op"] == "above" else "above"
        elif t == "volume_spike":
            pass
        elif t == "price_vs_sma":
            m["op"] = "below" if c["op"] == "above" else "above"
        elif t == "bollinger":
            m["op"] = "above_upper" if c["op"] == "below_lower" else "below_lower"
        elif t == "double_bottom":
            m["type"] = "double_top"
        elif t == "double_top":
            m["type"] = "double_bottom"
        elif t == "head_shoulders":
            m["type"] = "inverse_head_shoulders"
        elif t == "inverse_head_shoulders":
            m["type"] = "head_shoulders"
        elif "dir" in c:
            m["dir"] = flip[c["dir"]]
        out.append(m)
    return out


def variants(rule: dict) -> list:
    if rule.get("direction") != "ОБА":
        return [rule]
    return [
        {**rule, "direction": "ЛОНГ"},
        {**rule, "direction": "ШОРТ",
         "entry_conditions": mirror(rule["entry_conditions"] or []),
         "exit_conditions": mirror(rule["exit_conditions"] or [])},
    ]


def variant_for(rule: dict, direction: str) -> dict:
    for v in variants(rule):
        if v["direction"] == direction:
            return v
    return rule
