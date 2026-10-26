import json
from datetime import datetime, timedelta

FMT = "%Y-%m-%d %H:%M:%S"


def dts(candles):
    return [datetime.strptime(c["begin"], FMT) for c in candles]


def ema_series(vals, n):
    out, e, k = [], None, 2 / (n + 1)
    for v in vals:
        e = v if e is None else v * k + e * (1 - k)
        out.append(e)
    return out


def atr_series(c, n=14):
    tr = [c[0]["high"] - c[0]["low"]] if c else []
    for i in range(1, len(c)):
        tr.append(max(c[i]["high"] - c[i]["low"], abs(c[i]["high"] - c[i - 1]["close"]), abs(c[i]["low"] - c[i - 1]["close"])))
    out, s = [None] * len(c), 0.0
    for i, v in enumerate(tr):
        s += v
        if i >= n:
            s -= tr[i - n]
        if i >= n - 1:
            out[i] = s / n
    return out


def rsi_series(closes, n=14):
    out = [None] * len(closes)
    if len(closes) <= n:
        return out
    g = l = 0.0
    for i in range(1, n + 1):
        d = closes[i] - closes[i - 1]
        g += max(d, 0)
        l += max(-d, 0)
    g, l = g / n, l / n
    out[n] = 100.0 if l == 0 else 100 - 100 / (1 + g / l)
    for i in range(n + 1, len(closes)):
        d = closes[i] - closes[i - 1]
        g = (g * (n - 1) + max(d, 0)) / n
        l = (l * (n - 1) + max(-d, 0)) / n
        out[i] = 100.0 if l == 0 else 100 - 100 / (1 + g / l)
    return out


def stochrsi_k(closes, n=14, smooth=3):
    rsi = rsi_series(closes, n)
    raw = [None] * len(closes)
    for i in range(len(closes)):
        win = rsi[i - n + 1:i + 1] if i >= n - 1 else []
        if len(win) == n and None not in win:
            lo, hi = min(win), max(win)
            raw[i] = 50.0 if hi == lo else (rsi[i] - lo) / (hi - lo) * 100
    out = [None] * len(closes)
    for i in range(len(closes)):
        win = raw[i - smooth + 1:i + 1] if i >= smooth - 1 else []
        if len(win) == smooth and None not in win:
            out[i] = sum(win) / smooth
    return out


def vwap_series(c, dt):
    out, day, pv, vol = [], None, 0.0, 0.0
    for i, b in enumerate(c):
        if dt[i].date() != day:
            day, pv, vol = dt[i].date(), 0.0, 0.0
        v = b.get("volume") or 0.0
        pv += (b["high"] + b["low"] + b["close"]) / 3 * v
        vol += v
        out.append(pv / vol if vol > 0 else None)
    return out


def sign(direction):
    return 1 if direction == "ЛОНГ" else -1


def new_state(sig, bar_begin):
    return {
        "dir": sig["dir"], "entry": sig["entry"], "stop": sig["stop"], "init_stop": sig["stop"],
        "take": sig.get("take"), "risk": abs(sig["entry"] - sig["stop"]), "rem": 1.0, "fixes": [],
        "stage": 0, "be": False, "tight": False, "extreme": sig["entry"], "open_time": bar_begin,
        "last_bar": bar_begin, "closed": False, "roll_cost": 0.0, "event_t": sig.get("event_t"),
        "scenario": sig.get("scenario", ""),
    }


def fix(st, frac, price, why):
    frac = min(frac, st["rem"])
    if frac <= 1e-9:
        return
    st["fixes"].append([round(frac, 4), price, why])
    st["rem"] = round(st["rem"] - frac, 6)
    if st["rem"] <= 1e-6:
        st["rem"] = 0.0
        st["closed"] = True


def result(st, cost_pct, mark=None):
    fixes = list(st["fixes"])
    if mark is not None and st["rem"] > 0:
        fixes.append([st["rem"], mark, "открыта"])
    s = sign(st["dir"])
    pct = sum(f * (p - st["entry"]) / st["entry"] * 100 * s for f, p, _ in fixes)
    r = sum(f * (p - st["entry"]) * s for f, p, _ in fixes) / st["risk"] if st["risk"] else 0.0
    cost = cost_pct + st.get("roll_cost", 0.0)
    cost_r = (cost / 100 * st["entry"]) / st["risk"] if st["risk"] else 0.0
    return round(pct - cost, 2), round(r - cost_r, 2)


def trade_row(st, cfg, ctx_c, i_end, closed=True):
    mark = None if closed else ctx_c[i_end]["close"]
    pct, r = result(st, cfg["cost_pct"], mark)
    last = st["fixes"][-1] if st["fixes"] else None
    first = st["fixes"][0] if st["fixes"] else None
    return {
        "date": st["open_time"], "direction": st["dir"], "entry": round(st["entry"], 4), "stop": round(st["init_stop"], 4),
        "target1": round(st["take"], 4) if st.get("take") else (round(first[1], 4) if first else 0),
        "target2": 0, "exit_date": st.get("exit_time") if closed else None,
        "exit_price": round(last[1] if last else mark or 0, 4),
        "reason": " → ".join(dict.fromkeys(f[2] for f in st["fixes"])) if st["fixes"] else "открыта",
        "t1_hit": len(st["fixes"]) > 1, "result_pct": pct, "r": r, "closed": closed,
    }


def occurrences(rows, start, end, min_importance):
    out = []
    for r in rows:
        if int(r["importance"]) < min_importance:
            continue
        t = r["event_time"]
        if r.get("repeat_weekly"):
            stop = min(end, r["repeat_until"]) if r.get("repeat_until") else end
            while t < start:
                t += timedelta(days=7)
            while t <= stop:
                out.append({"id": r["id"], "title": r["title"], "t": t, "importance": int(r["importance"])})
                t += timedelta(days=7)
        elif start <= t <= end:
            out.append({"id": r["id"], "title": r["title"], "t": t, "importance": int(r["importance"])})
    return sorted(out, key=lambda e: e["t"])


def size(cfg, info, entry, stop):
    pts = abs(entry - stop)
    if pts <= 0 or not info.get("minstep") or not info.get("stepprice"):
        return 0, "нет данных по шагу цены контракта"
    risk_rub = pts / info["minstep"] * info["stepprice"]
    budget = cfg["capital"] * cfg["risk_pct"] / 100
    n = int(budget // risk_rub)
    margin = info.get("margin") or 0
    if margin > 0:
        n = min(n, int(cfg["capital"] * cfg["max_margin_pct"] / 100 // margin))
    ccy = info.get("ccy", "₽")
    if n < info.get("min_lots", 1):
        n = 0
    dec = 2 if ccy != "₽" else 0
    return max(n, 0), f"риск на {info.get('unit', 'контракт')} {risk_rub:,.{dec}f} {ccy}, бюджет риска {budget:,.{dec}f} {ccy}, ГО {margin:,.{dec}f} {ccy}".replace(",", " ")


def clearing_block(cfg, now):
    m = now.hour * 60 + now.minute
    g = int(cfg.get("clearing_guard_min", 0))
    for c in (14 * 60, 18 * 60 + 45):
        if c - g <= m < c + 5:
            return True
    return False


def macd_series(closes, fast=12, slow=26, signal=9):
    ef, es = ema_series(closes, fast), ema_series(closes, slow)
    line = [a - b for a, b in zip(ef, es)]
    sig = ema_series(line, signal)
    return line, sig
