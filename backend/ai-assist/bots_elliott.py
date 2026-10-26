from datetime import datetime

from bots_common import FMT, atr_series, clearing_block, dts, ema_series, fix, new_state, sign, size
from bots_logic import _days_left, _finish, _mk


def zigzag_step(z, i, bar, thr):
    P = z["p"]
    if z["trend"] == 0:
        if bar["high"] > z["hi"][1]:
            z["hi"] = (i, bar["high"])
        if bar["low"] < z["lo"][1]:
            z["lo"] = (i, bar["low"])
        if z["hi"][1] - z["lo"][1] >= thr:
            if z["hi"][0] > z["lo"][0]:
                P.append((z["lo"][0], z["lo"][1], "L", i))
                z["trend"], z["ext"] = 1, z["hi"]
            else:
                P.append((z["hi"][0], z["hi"][1], "H", i))
                z["trend"], z["ext"] = -1, z["lo"]
    elif z["trend"] == 1:
        if bar["high"] > z["ext"][1]:
            z["ext"] = (i, bar["high"])
        elif z["ext"][1] - bar["low"] >= thr:
            P.append((z["ext"][0], z["ext"][1], "H", i))
            z["trend"], z["ext"] = -1, (i, bar["low"])
    else:
        if bar["low"] < z["ext"][1]:
            z["ext"] = (i, bar["low"])
        elif bar["high"] - z["ext"][1] >= thr:
            P.append((z["ext"][0], z["ext"][1], "L", i))
            z["trend"], z["ext"] = 1, (i, bar["high"])


def _types(s, n):
    base = ["L", "H"] * 3
    seq = base[:n]
    if s < 0:
        seq = ["H" if t == "L" else "L" for t in seq]
    return seq


def find_setup(P, s, cfg, close, atr, i):
    cv = s * close
    if len(P) >= 3:
        L = P[-3:]
        if [p[2] for p in L] == _types(s, 3):
            v0, v1, v2 = (s * p[1] for p in L)
            w1 = v1 - v0
            if w1 > 0 and v2 > v0 and i - L[2][3] <= cfg["max_wait_bars"]:
                retr = (v1 - v2) / w1
                if cfg["min_retr2"] <= retr <= cfg["max_retr2"] and cv > v1:
                    return {"kind": "3", "key": (L[0][0], L[2][0], s), "stop_v": v2 - cfg["stop_buf_atr"] * atr,
                            "target_v": v2 + cfg["ext3"] * w1,
                            "why": f"волна 3: откат волны 2 {retr:.0%} от волны 1, пробой вершины волны 1 {s * v1:.2f}"}
    return None


def sim_elliott(cfg, info, c):
    trades, log = [], []
    if len(c) < 80:
        return trades, log
    dt = dts(c)
    closes = [x["close"] for x in c]
    atr = atr_series(c, 14)
    ema = ema_series(closes, cfg["trend_ema"])
    z = {"trend": 0, "hi": (0, c[0]["high"]), "lo": (0, c[0]["low"]), "ext": None, "p": []}
    st, entry_i, traded, warned = None, None, set(), set()
    for i in range(1, len(c)):
        bar = c[i]
        if not atr[i]:
            continue
        zigzag_step(z, i, bar, cfg["zz_atr"] * atr[i])
        if st and i > entry_i:
            s = sign(st["dir"])
            if (bar["low"] <= st["stop"]) if s > 0 else (bar["high"] >= st["stop"]):
                _finish(st, st["stop"], "безубыток" if st["be"] else "стоп", bar["begin"])
            else:
                fav = (bar["high"] - st["entry"]) if s > 0 else (st["entry"] - bar["low"])
                if cfg["part_frac"] > 0 and st["stage"] == 0 and fav >= cfg["part_r"] * st["risk"]:
                    fix(st, cfg["part_frac"], st["entry"] + s * cfg["part_r"] * st["risk"], "частичная фиксация")
                    st["stage"] = 1
                    st["stop"], st["be"] = st["entry"], True
                    log.append((bar["begin"], "move", f"зафиксирована часть позиции на {cfg['part_r']}R, стоп в безубыток {st['entry']:.2f}"))
                elif cfg["be_r"] > 0 and not st["be"] and fav >= cfg["be_r"] * st["risk"]:
                    st["stop"], st["be"] = st["entry"], True
                    log.append((bar["begin"], "move", f"стоп перенесён в безубыток ({st['entry']:.2f})"))
                if not st["closed"] and ((bar["high"] >= st["take"]) if s > 0 else (bar["low"] <= st["take"])):
                    _finish(st, st["take"], "цель волны", bar["begin"])
                elif not st["closed"] and not st.get("rolled") and _days_left(info, dt[i]) <= cfg["roll_days"]:
                    st["rolled"] = True
                    st["roll_cost"] += cfg["roll_slippage_pct"]
                    log.append((bar["begin"], "roll", f"роллирование: до экспирации {_days_left(info, dt[i])} дн., позиция переносится в следующий контракт"))
                if not st["closed"] and (dt[i] - datetime.strptime(st["open_time"], FMT)).days >= cfg["max_hold_days"]:
                    _finish(st, bar["close"], "срок удержания", bar["begin"])
            if st["closed"]:
                st.setdefault("exit_time", bar["begin"])
                log.append((bar["begin"], "exit", f"выход {st['dir']}: " + ", ".join(dict.fromkeys(f[2] for f in st["fixes"]))))
                st = None
            continue
        if st or len(z["p"]) < 3:
            continue
        for s in (1, -1):
            if s < 0 and not cfg["allow_short"]:
                continue
            if cfg["use_trend_filter"] and ((bar["close"] < ema[i]) if s > 0 else (bar["close"] > ema[i])):
                continue
            su = find_setup(z["p"], s, cfg, bar["close"], atr[i], i)
            if not su or su["key"] in traded:
                continue
            d = "ЛОНГ" if s > 0 else "ШОРТ"
            entry = bar["close"]
            stop, take = s * su["stop_v"], s * su["target_v"]
            risk = abs(entry - stop)
            reject = ""
            if (s > 0 and not (stop < entry < take)) or (s < 0 and not (take < entry < stop)):
                reject = "цель или стоп по неверную сторону от цены"
            elif risk > cfg["max_stop_atr"] * atr[i]:
                reject = f"стоп слишком далеко ({risk / atr[i]:.1f} ATR, максимум {cfg['max_stop_atr']})"
            elif abs(take - entry) / risk < cfg["min_rr"]:
                reject = f"прибыль/риск {abs(take - entry) / risk:.2f} ниже минимума {cfg['min_rr']}"
            elif _days_left(info, dt[i]) <= cfg["expiry_days"]:
                reject = "близка экспирация контракта"
            elif clearing_block(cfg, dt[i]):
                reject = "рядом клиринг"
            if reject:
                if su["key"] not in warned:
                    warned.add(su["key"])
                    log.append((bar["begin"], "skip", f"{d}, {su['why']}: пропуск, {reject}"))
                continue
            n, note = size(cfg, info, entry, stop)
            if n < 1:
                traded.add(su["key"])
                log.append((bar["begin"], "skip", f"{d}, {su['why']}: 1 контракт не укладывается в риск или обеспечение ({note})"))
                continue
            st = new_state({"dir": d, "entry": entry, "stop": stop, "take": take, "scenario": "волна " + su["kind"]}, bar["begin"])
            traded.add(su["key"])
            entry_i = i
            trades.append(_mk(st, n, note))
            log.append((bar["begin"], "entry", f"вход {d} {n} шт. по {entry:.2f}: {su['why']}; стоп {stop:.2f}, цель {take:.2f}"))
            break
    return trades, log
