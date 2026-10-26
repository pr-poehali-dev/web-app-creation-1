from datetime import datetime, timedelta

from bots_common import FMT, atr_series, clearing_block, dts, ema_series, fix, macd_series, new_state, sign, size
from bots_elliott import zigzag_step
from bots_logic import _days_left, _finish, _mk

HOUR = timedelta(minutes=60)
BAR = timedelta(minutes=5)


def _pattern(s):
    base = ["L", "H"] * 4
    return base if s > 0 else ["H" if t == "L" else "L" for t in base]


def find_abc(P, s, cfg, close, atr, i):
    if len(P) < 8:
        return None
    L = P[-8:]
    if [p[2] for p in L] != _pattern(s) or i - L[7][3] > cfg["max_wait_bars"]:
        return None
    v = [s * p[1] for p in L]
    w1, w3, w5 = v[1] - v[0], v[3] - v[2], v[5] - v[4]
    if w1 <= 0 or w5 <= 0 or w3 <= 0:
        return None
    if not (v[2] > v[0] and v[3] > v[1] and v[4] > v[1]):
        return None
    if w3 < min(w1, w5):
        return None
    double = v[5] <= v[3]
    if double and (not cfg["allow_double"] or v[5] < v[3] - cfg["double_atr"] * atr):
        return None
    if v[5] - v[0] < cfg["min_impulse_atr"] * atr:
        return None
    if not (v[6] < v[5] and v[7] > v[6] and v[7] < v[5]):
        return None
    a_retr = (v[5] - v[6]) / w5
    b_retr = (v[7] - v[6]) / (v[5] - v[6])
    if not (cfg["min_a"] <= a_retr <= cfg["max_a"] and cfg["min_b"] <= b_retr <= cfg["max_b"]):
        return None
    near4 = abs(v[6] - v[4]) <= cfg["a_near4_atr"] * atr if cfg["a_near4_atr"] > 0 else True
    if not near4:
        return None
    stop_w = v[5] + cfg["stop_buf_atr"] * atr + cfg.get("stop_buf_pts", 0)
    target_w = v[7] - cfg["c_ratio"] * (v[5] - v[6])
    why = (f"{'двойная вершина' if double and s > 0 else 'двойное дно' if double else 'пять волн'} импульса {s * v[5]:.2f}; "
           f"волна A {a_retr:.0%} от волны 5, волна B {b_retr:.0%} от A, вершина B ниже пика волны 5")
    return {"key": (L[0][0], L[7][0], s), "stop": s * stop_w, "target": s * target_w, "peak": s * v[5], "why": why}


def _hourly_exit(st, s, hp, hr, hclose, hmacd, k, cfg, dth):
    stop_type, ext_type = ("L", "H") if s > 0 else ("H", "L")
    opened = datetime.strptime(st["open_time"], FMT)
    out = None
    exts = [p for p in hp if p[2] == ext_type]
    stops = [p for p in hp if p[2] == stop_type]
    if cfg["use_trail"] and exts and stops:
        last_ext = exts[-1]
        wc = s * hclose[k]
        if wc > s * last_ext[1] and dth[last_ext[0]] >= opened - HOUR:
            cand = [p for p in stops if p[0] < last_ext[0] and dth[p[0]] >= opened - HOUR]
            if cand:
                lvl = cand[-1]
                new = lvl[1] - s * cfg["trail_buf_atr"] * st["h_atr"]
                if s * new > s * st["stop"] and s * new < s * hclose[k]:
                    st["stop"] = new
                    out = ("move", f"стоп подтянут за значимый часовой уровень {lvl[1]:.2f} после пробоя {last_ext[1]:.2f}: {new:.2f}")
    if cfg["use_div"] and len(exts) >= 2:
        x1, x2 = exts[-2], exts[-1]
        if dth[x2[0]] > opened and s * x2[1] > s * x1[1] and s * hmacd[x2[0]] < s * hmacd[x1[0]]:
            mid = [p for p in stops if x1[0] < p[0] < x2[0]]
            if mid and s * hclose[k] < s * mid[-1][1]:
                return ("div", f"дивергенция MACD на часовом графике: цена обновила экстремум {x2[1]:.2f}, MACD слабее, пробит уровень {mid[-1][1]:.2f}")
    return out


def sim_abc(cfg, info, c5, hr, daily):
    trades, log = [], []
    nd = len(daily)
    bar_min = 60 if cfg.get("entry_tf") == "60" else 5
    if bar_min == 60:
        c5 = hr
    bar_len = timedelta(minutes=bar_min)
    if len(c5) < 200 or len(hr) < 60 or nd < cfg["trend_ema"] + 5:
        return trades, log
    dt5, dth, ddt = dts(c5), dts(hr), dts(daily)
    dclose = [x["close"] for x in daily]
    dema = ema_series(dclose, cfg["trend_ema"])
    hour_trend = cfg.get("trend_tf") == "60"
    hclose = [x["close"] for x in hr]
    hatr = atr_series(hr, 14)
    hmacd, _ = macd_series(hclose)
    hema = ema_series(hclose, cfg["trend_ema_h"])
    atr = atr_series(c5, 14)
    z = {"trend": 0, "hi": (0, c5[0]["high"]), "lo": (0, c5[0]["low"]), "ext": None, "p": []}
    zh = {"trend": 0, "hi": (0, hr[0]["high"]), "lo": (0, hr[0]["low"]), "ext": None, "p": []}
    hj, j, st, entry_i = 0, -1, None, None
    traded, warned = set(), set()
    retry = None
    for i in range(1, len(c5)):
        bar = c5[i]
        new_h = False
        while hj < len(hr) and dth[hj] + HOUR <= dt5[i] + bar_len:
            if hatr[hj]:
                zigzag_step(zh, hj, hr[hj], cfg["h_zz_atr"] * hatr[hj])
            hj += 1
            new_h = True
        while j + 1 < nd and ddt[j + 1].date() < dt5[i].date():
            j += 1
        if not atr[i]:
            continue
        zigzag_step(z, i, bar, cfg["zz_atr"] * atr[i])
        if j < cfg["trend_ema"] or (hour_trend and hj < cfg["trend_ema_h"] + 2):
            continue
        if st and i > entry_i:
            s = sign(st["dir"])
            if (bar["low"] <= st["stop"]) if s > 0 else (bar["high"] >= st["stop"]):
                _finish(st, st["stop"], "стоп (скользящий)" if st["moved"] else "стоп", bar["begin"])
            else:
                if new_h and hj >= 2:
                    k = hj - 1
                    st["h_atr"] = hatr[k] or st["h_atr"]
                    res = _hourly_exit(st, s, zh["p"], hr, hclose, hmacd, k, cfg, dth)
                    if res and res[0] == "move":
                        st["moved"] = True
                        log.append((bar["begin"], "move", res[1]))
                    elif res and res[0] == "div":
                        _finish(st, bar["close"], "дивергенция MACD (час)", bar["begin"])
                        log.append((bar["begin"], "move", res[1]))
                if not st["closed"] and not st.get("rolled") and _days_left(info, dt5[i]) <= cfg["roll_days"]:
                    st["rolled"] = True
                    st["roll_cost"] += cfg["roll_slippage_pct"]
                    log.append((bar["begin"], "roll", f"роллирование: до экспирации {_days_left(info, dt5[i])} дн., позиция переносится в следующий контракт"))
                if not st["closed"] and (dt5[i] - datetime.strptime(st["open_time"], FMT)).days >= cfg["max_hold_days"]:
                    _finish(st, bar["close"], "срок удержания", bar["begin"])
            if st["closed"]:
                log.append((bar["begin"], "exit", f"выход {st['dir']}: " + ", ".join(dict.fromkeys(f[2] for f in st["fixes"]))))
                if cfg["retry_on"] and not st.get("retry") and not st["moved"] and st["fixes"][-1][2] == "стоп":
                    s0 = sign(st["dir"])
                    retry = {"dir": st["dir"], "stop0": st["init_stop"], "start": i, "ext": bar["low"] if s0 > 0 else bar["high"]}
                st = None
            continue
        if st:
            continue
        if retry:
            s0 = sign(retry["dir"])
            ext = bar["low"] if s0 > 0 else bar["high"]
            if s0 * ext < s0 * retry["ext"]:
                retry["ext"] = ext
            if i - retry["start"] > cfg["retry_hours"] * 60 / bar_min:
                retry = None
            elif i > retry["start"] and s0 * bar["close"] > s0 * retry["stop0"]:
                entry, stop = bar["close"], retry["ext"] - s0 * (cfg["retry_buf_atr"] * atr[i] + cfg.get("stop_buf_pts", 0))
                if s0 * (entry - stop) > 0 and abs(entry - stop) <= cfg["max_stop_atr"] * atr[i] and not clearing_block(cfg, dt5[i]) and _days_left(info, dt5[i]) > cfg["expiry_days"]:
                    n, note = size(cfg, info, entry, stop)
                    if n >= 1:
                        st = new_state({"dir": retry["dir"], "entry": entry, "stop": stop, "take": None, "scenario": "повторный вход"}, bar["begin"])
                        st["moved"], st["retry"], st["h_atr"] = False, True, (hatr[hj - 1] if hj and hatr[hj - 1] else atr[i] * 3)
                        entry_i = i
                        trades.append(_mk(st, n, note))
                        log.append((bar["begin"], "entry", f"повторный вход {retry['dir']} {n} шт. по {entry:.2f}: прежний стоп {retry['stop0']:.2f} был выбит, цена вернулась за него, новый стоп за свежим экстремумом {stop:.2f}"))
                        retry = None
                        continue
                retry = None
        up = (hclose[hj - 1] > hema[hj - 1]) if hour_trend else (dclose[j] > dema[j])
        d = "ЛОНГ" if up else "ШОРТ"
        if d == "ШОРТ" and not cfg["allow_short"]:
            continue
        s_imp = -1 if up else 1
        su = find_abc(z["p"], s_imp, cfg, bar["close"], atr[i], i)
        if not su or su["key"] in traded:
            continue
        entry, stop = bar["close"], su["stop"]
        risk = abs(entry - stop)
        reward = abs(entry - su["target"])
        reject = ""
        if (d == "ШОРТ" and not stop > entry) or (d == "ЛОНГ" and not stop < entry):
            reject = "цена уже за вершиной пятой волны"
        elif risk > cfg["max_stop_atr"] * atr[i]:
            reject = f"стоп слишком далеко ({risk / atr[i]:.1f} ATR, максимум {cfg['max_stop_atr']})"
        elif reward / risk < cfg["min_rr"]:
            reject = f"прибыль/риск волны C {reward / risk:.2f} ниже минимума {cfg['min_rr']}"
        elif _days_left(info, dt5[i]) <= cfg["expiry_days"]:
            reject = "близка экспирация контракта"
        elif clearing_block(cfg, dt5[i]):
            reject = "рядом клиринг"
        if reject:
            if su["key"] not in warned:
                warned.add(su["key"])
                log.append((bar["begin"], "skip", f"{d}, {su['why']}: пропуск, {reject}"))
            continue
        n, note = size(cfg, info, entry, stop)
        traded.add(su["key"])
        if n < 1:
            log.append((bar["begin"], "skip", f"{d}, {su['why']}: 1 контракт не укладывается в риск или обеспечение ({note})"))
            continue
        st = new_state({"dir": d, "entry": entry, "stop": stop, "take": None, "scenario": "волна C"}, bar["begin"])
        st["moved"], st["h_atr"] = False, (hatr[hj - 1] if hj and hatr[hj - 1] else atr[i] * 3)
        entry_i = i
        retry = None
        trades.append(_mk(st, n, note))
        log.append((bar["begin"], "entry", f"вход {d} {n} шт. по {entry:.2f} на волне C по дневному тренду: {su['why']}; стоп {stop:.2f}, ориентир волны C {su['target']:.2f}"))
    return trades, log
