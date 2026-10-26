from datetime import datetime, timedelta

from bots_common import FMT, atr_series, clearing_block, dts, fix, new_state, sign, size
from bots_logic import _days_left, _finish, _mk


def _mean(vals):
    return sum(vals) / len(vals) if vals else 0.0


def _fractals15(c5, dt5):
    keys = [t.replace(minute=t.minute - t.minute % 15, second=0) for t in dt5]
    bars, last_of = [], {}
    for i, k in enumerate(keys):
        if bars and bars[-1]["key"] == k:
            b = bars[-1]
            b["high"], b["low"] = max(b["high"], c5[i]["high"]), min(b["low"], c5[i]["low"])
        else:
            bars.append({"key": k, "high": c5[i]["high"], "low": c5[i]["low"]})
        last_of[i] = len(bars) - 1 if (i + 1 >= len(keys) or keys[i + 1] != k) else None
    found = {}
    for i, m in last_of.items():
        if m is None or m < 4:
            continue
        mid = bars[m - 2]
        around = [bars[m - 4], bars[m - 3], bars[m - 1], bars[m]]
        if all(mid["high"] > x["high"] for x in around):
            found.setdefault(i, []).append(("H", mid["high"]))
        if all(mid["low"] < x["low"] for x in around):
            found.setdefault(i, []).append(("L", mid["low"]))
    return found


def _views(c, s):
    if s > 0:
        return (lambda k: c[k]["high"]), (lambda k: c[k]["low"]), (lambda k: c[k]["open"]), (lambda k: c[k]["close"])
    return (lambda k: -c[k]["low"]), (lambda k: -c[k]["high"]), (lambda k: -c[k]["open"]), (lambda k: -c[k]["close"])


def find_setup(c, atr, i, s, cfg):
    H, L, O, C = _views(c, s)
    lo_i = max(0, i - int(cfg["window_bars"]))
    if i - lo_i < 10:
        return None
    b = max(range(lo_i, i), key=lambda k: (H(k), k))
    if i - b < 3 or i - b > cfg["max_wait_bars"]:
        return None
    a = min(range(max(0, b - int(cfg["max_impulse_bars"])), b + 1), key=lambda k: (L(k), -k))
    start, end = L(a), H(b)
    leg = end - start
    if b <= a or not atr[b] or leg < cfg["min_impulse_atr"] * atr[b]:
        return None
    e = min(range(b + 1, i + 1), key=lambda k: (L(k), -k))
    low = L(e)
    if low <= start:
        return {"dead": True, "key": (a, b, s)}
    depth = (low - start) / leg * 100
    if not (cfg["turn_min_pct"] <= depth <= cfg["turn_max_pct"]):
        return None
    if cfg["use_volume"]:
        cb = int(cfg["calm_bars"])
        calm = range(max(0, a - cb), a)
        base = range(max(0, a - cb - int(cfg["base_bars"])), max(0, a - cb))
        if len(calm) < cb // 2 or len(base) < 20:
            return None
        v_calm, v_base = _mean([c[k]["volume"] for k in calm]), _mean([c[k]["volume"] for k in base])
        r_calm, r_base = _mean([c[k]["high"] - c[k]["low"] for k in calm]), _mean([c[k]["high"] - c[k]["low"] for k in base])
        if v_base > 0 and v_calm > cfg["calm_vol"] * v_base:
            return None
        if r_base > 0 and r_calm > cfg["calm_range"] * r_base:
            return None
        v_imp = _mean([c[k]["volume"] for k in range(a, b + 1)])
        if v_calm > 0 and v_imp < cfg["vol_mult"] * v_calm:
            return None
        pull = [c[k]["volume"] for k in range(b + 1, i)]
        v_pull = _mean(pull)
        if v_imp > 0 and v_pull > cfg["pull_vol"] * v_imp:
            return None
        if pull and c[i]["volume"] < cfg["confirm_vol"] * v_pull:
            return None
    if not (C(i) > O(i) and C(i) > C(i - 1)):
        return None
    f = a
    for k in range(a, max(2, a - 40), -1):
        if all(L(k) < L(k + d) for d in (-2, -1, 1, 2)):
            f = k
            break
    return {"dead": False, "key": (a, b, s), "a": a, "b": b, "start": start, "end": end, "fr": L(f), "depth": depth}


def sim_pullback(cfg, info, c5):
    trades, log = [], []
    if len(c5) < 200:
        return trades, log
    dt5 = dts(c5)
    atr = atr_series(c5, 14)
    fr15 = _fractals15(c5, dt5)
    st, entry_i, traded = None, None, set()
    for i in range(1, len(c5)):
        bar = c5[i]
        if st and i > entry_i:
            s = sign(st["dir"])
            if (bar["low"] <= st["stop"]) if s > 0 else (bar["high"] >= st["stop"]):
                why = "трейлинг-стоп" if st.get("trailed") else ("стоп в безубытке" if st.get("tp1") else "стоп")
                _finish(st, st["stop"], why, bar["begin"])
            else:
                if not st.get("tp1") and ((bar["high"] >= st["take"]) if s > 0 else (bar["low"] <= st["take"])):
                    fix(st, cfg["tp1_share"] / 100, st["take"], "часть на вершине импульса")
                    st["tp1"], st["stop"] = True, st["entry"]
                    log.append((bar["begin"], "move", f"{st['dir']}: зафиксирована часть позиции по {st['take']:.2f}, стоп перенесён в безубыток {st['entry']:.2f}"))
                if st.get("tp1") and not st["closed"]:
                    for kind, v in fr15.get(i, []):
                        if s > 0 and kind == "L":
                            new = v - cfg["trail_buf_pts"]
                            if new > st["stop"] and new < bar["close"]:
                                st["stop"], st["trailed"] = new, True
                                log.append((bar["begin"], "move", f"стоп подтянут под 15-минутный фрактал: {new:.2f}"))
                        elif s < 0 and kind == "H":
                            new = v + cfg["trail_buf_pts"]
                            if new < st["stop"] and new > bar["close"]:
                                st["stop"], st["trailed"] = new, True
                                log.append((bar["begin"], "move", f"стоп подтянут над 15-минутным фракталом: {new:.2f}"))
                if not st["closed"] and dt5[i] - datetime.strptime(st["open_time"], FMT) >= timedelta(hours=cfg["max_hold_hours"]):
                    _finish(st, bar["close"], "срок удержания", bar["begin"])
            if st["closed"]:
                log.append((bar["begin"], "exit", f"выход {st['dir']}: " + ", ".join(dict.fromkeys(f[2] for f in st["fixes"]))))
                st = None
            continue
        if st or not atr[i]:
            continue
        for s in (1, -1):
            if s < 0 and not cfg["allow_short"]:
                continue
            su = find_setup(c5, atr, i, s, cfg)
            if not su or su["key"] in traded:
                continue
            traded.add(su["key"])
            if su["dead"]:
                continue
            d = "ЛОНГ" if s > 0 else "ШОРТ"
            entry = bar["close"]
            stop = s * (su["fr"] - cfg["stop_buf_pts"])
            target = s * su["end"]
            risk, reward = abs(entry - stop), s * (target - entry)
            reject = ""
            if s * (entry - stop) <= 0:
                reject = "стоп не по ту сторону входа"
            elif reward <= 0:
                reject = "цена уже у вершины импульса"
            elif risk > cfg["max_stop_atr"] * atr[i]:
                reject = f"стоп слишком далеко ({risk / atr[i]:.1f} ATR, максимум {cfg['max_stop_atr']})"
            elif reward / risk < cfg["min_rr"]:
                reject = f"до вершины импульса {reward / risk:.2f} от риска, меньше минимума {cfg['min_rr']}"
            elif _days_left(info, dt5[i]) <= cfg["expiry_days"]:
                reject = "близка экспирация контракта"
            elif clearing_block(cfg, dt5[i]):
                reject = "рядом клиринг"
            if reject:
                log.append((bar["begin"], "skip", f"{d}, импульс {s * su['start']:.2f}→{target:.2f}: пропуск, {reject}"))
                continue
            cnt, note = size(cfg, info, entry, stop)
            if cnt < 1:
                log.append((bar["begin"], "skip", f"{d}: 1 контракт не укладывается в риск или обеспечение ({note})"))
                continue
            st = new_state({"dir": d, "entry": entry, "stop": stop, "take": target, "scenario": "откат после импульса"}, bar["begin"])
            entry_i = i
            trades.append(_mk(st, cnt, note))
            log.append((bar["begin"], "entry", f"вход {d} {cnt} шт. по {entry:.2f}: после затишья импульс {s * su['start']:.2f}→{target:.2f}, откат {su['depth']:.0f}% с затуханием объёма, объём вновь растёт; стоп под фракталом {stop:.2f}, первая цель {target:.2f}"))
            break
    return trades, log
