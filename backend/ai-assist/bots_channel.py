import re
from datetime import datetime

from bots_common import atr_series, clearing_block, dts, ema_series, fix, new_state, sign, size

PIV = 2


def _fit(pts):
    n = len(pts)
    mx = sum(x for x, _ in pts) / n
    my = sum(y for _, y in pts) / n
    den = sum((x - mx) ** 2 for x, _ in pts)
    b = sum((x - mx) * (y - my) for x, y in pts) / den if den else 0.0
    return my - b * mx, b


def _pivots(c, a, z, w, key, high):
    out = []
    for j in range(a + w, z - w + 1):
        v = c[j][key]
        left = [c[k][key] for k in range(j - w, j)]
        right = [c[k][key] for k in range(j + 1, j + w + 1)]
        if high and all(v > x for x in left) and all(v >= x for x in right):
            out.append(j)
        if not high and all(v < x for x in left) and all(v <= x for x in right):
            out.append(j)
    return out


def find_channel(c, day0, i, cfg, tol, strict=True):
    a = max(day0, i - int(cfg["lookback_bars"]))
    z = i - 1
    ph = _pivots(c, a, z, PIV, "high", True)[-3:]
    pl = _pivots(c, a, z, PIV, "low", False)[-3:]
    if len(ph) < 2 or len(pl) < 2:
        return None
    if ph[-1] - ph[0] < 4 or pl[-1] - pl[0] < 4:
        return None
    ua, ub = _fit([(j, c[j]["high"]) for j in ph])
    la, lb = _fit([(j, c[j]["low"]) for j in pl])
    first = min(ph[0], pl[0])
    up = lambda k: ua + ub * k
    lo = lambda k: la + lb * k
    wn = up(i) - lo(i)
    wf = up(first) - lo(first)
    mid = (up(i) + lo(i)) / 2
    if wn <= 0 or mid <= 0:
        return None
    wpct = wn / mid * 100
    if strict:
        if wpct < cfg["min_width_pct"] or wpct > cfg["max_width_pct"]:
            return None
        if wn > wf * 1.1:
            return None
    for k in range(first, i):
        if c[k]["close"] > up(k) + tol or c[k]["close"] < lo(k) - tol:
            return None
    return {"up": (ua, ub), "lo": (la, lb), "wpct": wpct}


def _line(p, k):
    return p[0] + p[1] * k


def _bars10(c5, dt):
    out, end_to = [], {}
    cur = None
    for i, b in enumerate(c5):
        key = (dt[i].date(), dt[i].hour * 60 + dt[i].minute // 10 * 10)
        if cur is None or cur["key"] != key:
            cur = {"key": key, "open": b["open"], "high": b["high"], "low": b["low"], "close": b["close"], "end": i}
            out.append(cur)
        else:
            cur["high"] = max(cur["high"], b["high"])
            cur["low"] = min(cur["low"], b["low"])
            cur["close"] = b["close"]
            cur["end"] = i
        end_to[i] = len(out) - 1
    return out, end_to


def _trail_level(series, k, d, buf, tail=14):
    a = max(0, k - tail)
    if d == "ЛОНГ":
        pv = _pivots(series, a, k, 1, "low", False)
        if not pv:
            return None
        if len(pv) >= 2 and series[pv[-1]]["low"] > series[pv[-2]]["low"]:
            la, lb = _fit([(j, series[j]["low"]) for j in pv[-3:]])
            return min(la + lb * k, series[pv[-1]]["low"] + abs(series[pv[-1]]["low"] - series[pv[-2]]["low"])) - buf
        return series[pv[-1]]["low"] - buf
    pv = _pivots(series, a, k, 1, "high", True)
    if not pv:
        return None
    if len(pv) >= 2 and series[pv[-1]]["high"] < series[pv[-2]]["high"]:
        ua, ub = _fit([(j, series[j]["high"]) for j in pv[-3:]])
        return max(ua + ub * k, series[pv[-1]]["high"] - abs(series[pv[-2]]["high"] - series[pv[-1]]["high"])) + buf
    return series[pv[-1]]["high"] + buf


def _close_leg(st, price, why, when, log):
    fix(st, st["rem"], price, why)
    st["closed"] = True
    st["exit_time"] = when
    log.append((when, "exit", f"выход {st['dir']}: {why} по {price:.2f}"))


def sim_intraday(cfg, info, c5):
    trades, log = [], []
    if len(c5) < 40:
        return trades, log
    dt = dts(c5)
    atr = atr_series(c5, 14)
    ema = ema_series([c["close"] for c in c5], int(cfg["trend_ema"]))
    c10, end_to = _bars10(c5, dt) if cfg["trail_tf"] == "10" else (None, None)
    days = {}
    for i, d in enumerate(dt):
        days.setdefault(d.date(), []).append(i)
    start_m = cfg["start_hour"] * 60
    close_m = cfg["close_hour"] * 60 + cfg["close_min"]
    for day in sorted(days):
        idx = days[day]
        if day.weekday() >= 5:
            continue
        day0 = idx[0]
        legs, cycles, warned = [], 0, set()
        base_n, dirn, add_done, staged = 0, "", False, False
        for i in idx:
            bar = c5[i]
            m = dt[i].hour * 60 + dt[i].minute
            live = [t for t in legs if not t["st"]["closed"]]
            if live:
                s = sign(dirn)
                for t in live:
                    st = t["st"]
                    if (bar["low"] <= st["stop"]) if s > 0 else (bar["high"] >= st["stop"]):
                        _close_leg(st, st["stop"], "стоп" if st["stage"] == 0 else "трейлинг-стоп", bar["begin"], log)
                live = [t for t in legs if not t["st"]["closed"]]
                if live and m + 5 >= close_m:
                    for t in live:
                        _close_leg(t["st"], bar["close"], "закрытие дня", bar["begin"], log)
                    live = []
                if not live:
                    continue
                first = legs[0]["st"]
                if not staged and not first["closed"]:
                    tp = _line(first["tline"], i)
                    if (bar["high"] >= tp) if s > 0 else (bar["low"] <= tp):
                        if (tp - first["entry"]) * s > 0:
                            fix(first, cfg["tp1_frac"], tp, "тейк у противоположной границы канала")
                            first["stage"] = 1
                            staged = True
                            log.append((bar["begin"], "fix", f"зафиксировано {cfg['tp1_frac']:.0%} по {tp:.2f} у противоположной линии канала, остаток ведётся трейлинг-стопом"))
                if staged and cfg["add_on_return"] and not add_done and not first["closed"] and i > 0:
                    back = (bar["low"] <= first["entry"] + 0.0) if s > 0 else (bar["high"] >= first["entry"])
                    bounce = (bar["close"] > bar["open"] and bar["close"] >= first["entry"]) if s > 0 else (bar["close"] < bar["open"] and bar["close"] <= first["entry"])
                    if back and bounce:
                        add_n = int(base_n * cfg["tp1_frac"])
                        margin = info.get("margin") or 0
                        total = sum(t["n"] for t in legs if not t["st"]["closed"])
                        if margin > 0:
                            add_n = min(add_n, int(cfg["capital"] * cfg["max_margin_pct"] / 100 // margin) - total)
                        stop = first["stop"]
                        add_done = True
                        if add_n >= 1 and (bar["close"] - stop) * s > 0:
                            nst = new_state({"dir": dirn, "entry": bar["close"], "stop": stop, "take": None,
                                             "scenario": "добор после отскока от уровня входа"}, bar["begin"])
                            nst["init_stop"] = stop
                            nst["stage"] = 1
                            nst["tline"] = first["tline"]
                            legs.append({"st": nst, "n": add_n, "note": f"добор на {add_n} шт., столько же, сколько зафиксировано"})
                            trades.append({"st": nst, "n": add_n, "note": "добор после отскока от уровня входа"})
                            log.append((bar["begin"], "entry", f"добор {dirn} {add_n} шт. по {bar['close']:.2f}: цена вернулась к уровню входа {first['entry']:.2f} и отскочила; общий стоп {stop:.2f}"))
                        else:
                            log.append((bar["begin"], "skip", "добор пропущен: не хватает контрактов или обеспечения, либо стоп некорректен"))
                if staged:
                    if c10 is not None:
                        if m % 10 == 5:
                            k = end_to[i]
                            lvl = _trail_level(c10, k, dirn, atr[i] * cfg["trail_buf_atr"] if atr[i] else 0)
                        else:
                            lvl = None
                    else:
                        lvl = _trail_level(c5, i, dirn, atr[i] * cfg["trail_buf_atr"] if atr[i] else 0)
                    live = [t for t in legs if not t["st"]["closed"]]
                    if lvl is not None and live:
                        cur_stop = live[0]["st"]["stop"]
                        better = lvl > cur_stop if s > 0 else lvl < cur_stop
                        valid = lvl < bar["close"] if s > 0 else lvl > bar["close"]
                        if better and valid:
                            for t in live:
                                t["st"]["stop"] = lvl
                            log.append((bar["begin"], "move", f"стоп подтянут за границу сформировавшегося канала: {lvl:.2f}"))
                if all(t["st"]["closed"] for t in legs):
                    pass
                continue
            if legs and all(t["st"]["closed"] for t in legs):
                legs, base_n, dirn, add_done, staged = [], 0, "", False, False
            if cycles >= cfg["max_trades"] or m < start_m or m >= cfg["last_entry_hour"] * 60 or m + 5 >= close_m:
                continue
            if i - day0 < 12 or not atr[i - 1]:
                continue
            tol = cfg["touch_atr"] * atr[i - 1]
            ch = find_channel(c5, day0, i, cfg, tol)
            if not ch:
                continue
            u, l = _line(ch["up"], i), _line(ch["lo"], i)
            touch_lo = bar["low"] <= l + tol and bar["close"] > l and (bar["close"] > bar["open"] or not cfg["need_candle"])
            touch_hi = bar["high"] >= u - tol and bar["close"] < u and (bar["close"] < bar["open"] or not cfg["need_candle"])
            if touch_lo == touch_hi:
                continue
            d = "ЛОНГ" if touch_lo else "ШОРТ"
            tag = (day, d, i)
            if d == "ШОРТ" and not cfg["allow_short"]:
                continue
            if cfg["use_trend"]:
                up = bar["close"] > ema[i]
                if (d == "ЛОНГ") != up:
                    if tag[:2] not in warned:
                        warned.add(tag[:2])
                        log.append((bar["begin"], "skip", f"отбой {d} пропущен: против тренда (цена {'выше' if up else 'ниже'} EMA-{int(cfg['trend_ema'])} {ema[i]:.2f})"))
                    continue
            entry = bar["close"]
            buf = cfg["stop_buf_atr"] * atr[i - 1]
            stop = min(bar["low"], l) - buf if d == "ЛОНГ" else max(bar["high"], u) + buf
            tline = ch["up"] if d == "ЛОНГ" else ch["lo"]
            take = _line(tline, i)
            risk = abs(entry - stop)
            reward = (take - entry) * sign(d)
            stamp = bar["begin"]
            if risk <= 0 or reward <= 0 or reward / risk < cfg["min_rr"]:
                continue
            days_left = 999
            if info and info.get("last"):
                days_left = (datetime.strptime(info["last"], "%Y-%m-%d").date() - day).days
            if days_left <= cfg["expiry_days"]:
                continue
            if clearing_block(cfg, dt[i]):
                if tag[:2] not in warned:
                    warned.add(tag[:2])
                    log.append((stamp, "skip", "отбой рядом с клирингом, вход отложен"))
                continue
            n, note = size(cfg, info, entry, stop)
            if n < 1:
                log.append((stamp, "skip", f"отбой {d} пропущен: даже 1 контракт не укладывается в риск или обеспечение ({note})"))
                continue
            st = new_state({"dir": d, "entry": entry, "stop": stop, "take": take,
                            "scenario": f"отбой от {'нижней' if d == 'ЛОНГ' else 'верхней'} границы узкого канала шириной {ch['wpct']:.2f}%, по тренду (EMA-{int(cfg['trend_ema'])})"}, stamp)
            st["init_stop"] = stop
            st["tline"] = tline
            legs = [{"st": st, "n": n}]
            trades.append({"st": st, "n": n, "note": note})
            base_n, dirn, add_done, staged = n, d, False, False
            cycles += 1
            log.append((stamp, "entry", f"вход {d} {n} шт. по {entry:.2f}: отбой от {'нижней' if d == 'ЛОНГ' else 'верхней'} границы канала {l:.2f}–{u:.2f}; стоп {stop:.2f}, первый тейк {take:.2f} (противоположная линия)"))
    return trades, log


_RE_ENTRY = re.compile(r"^(вход|добор) (\S+) (\d+) шт\. по ([\d.]+).*?(?:общий )?стоп ([\d.]+)")
_RE_FIX = re.compile(r"^зафиксировано .*? по ([\d.]+) у")
_RE_MOVE = re.compile(r"подтянут.*?: ([\d.]+)$")
_RE_EXIT = re.compile(r"^выход (\S+): (.+) по ([\d.]+)$")


def _ema_lines(c5, n):
    dt = dts(c5)
    e5 = ema_series([c["close"] for c in c5], n)
    hours, hk = [], None
    for i, d in enumerate(dt):
        k = (d.date(), d.hour)
        if k != hk:
            hours.append({"k": k, "close": c5[i]["close"], "first": i})
            hk = k
        else:
            hours[-1]["close"] = c5[i]["close"]
    eh = ema_series([h["close"] for h in hours], n)
    e60, hi = [None] * len(c5), -1
    for i in range(len(c5)):
        while hi + 1 < len(hours) and hours[hi + 1]["first"] <= i:
            hi += 1
        if hi >= 1 and len(hours) > 0:
            e60[i] = eh[hi - 1]
    return e5, e60


def chart_data(log, c5, ema_n=200, max_days=6):
    e5, e60 = _ema_lines(c5, int(ema_n))
    pos = {c["begin"]: i for i, c in enumerate(c5)}
    marks = []
    for t, kind, text in log:
        m = None
        if kind == "entry":
            m = _RE_ENTRY.match(text)
            if m:
                marks.append({"t": t, "kind": "add" if m.group(1) == "добор" else "entry", "dir": m.group(2), "price": float(m.group(4)), "stop": float(m.group(5)), "text": text})
        elif kind == "fix":
            m = _RE_FIX.match(text)
            if m:
                marks.append({"t": t, "kind": "fix", "price": float(m.group(1)), "text": text})
        elif kind == "move":
            m = _RE_MOVE.search(text)
            if m:
                marks.append({"t": t, "kind": "move", "price": float(m.group(1)), "text": text})
        elif kind == "exit":
            m = _RE_EXIT.match(text)
            if m:
                marks.append({"t": t, "kind": "exit", "price": float(m.group(3)), "text": text})
    days = sorted({x["t"][:10] for x in marks})[-max_days:]
    out = []
    for d in days:
        bars = [[c["begin"][11:16], c["open"], c["high"], c["low"], c["close"], round(e5[pos[c["begin"]]], 2), round(e60[pos[c["begin"]]], 2) if e60[pos[c["begin"]]] is not None else None] for c in c5 if c["begin"][:10] == d]
        ms = [dict(x, t=x["t"][11:16]) for x in marks if x["t"][:10] == d]
        out.append({"date": d, "bars": bars, "marks": ms})
    return out
