from datetime import datetime, timedelta

from bots_common import FMT, atr_series, clearing_block, dts, new_state, sign, size
from bots_logic import _days_left, _finish, _mk


def _vol(c):
    return c.get("volume") or 0


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


def find_impulse(c, atr, i, s, cfg):
    lo_i = max(0, i - int(cfg["window_bars"]))
    if i - lo_i < 6:
        return None
    if s > 0:
        b = max(range(lo_i, i), key=lambda k: (c[k]["high"], k))
        a = min(range(lo_i, b + 1), key=lambda k: (c[k]["low"], -k))
        start, end = c[a]["low"], c[b]["high"]
    else:
        b = min(range(lo_i, i), key=lambda k: (c[k]["low"], k))
        a = max(range(lo_i, b + 1), key=lambda k: (c[k]["high"], -k))
        start, end = c[a]["high"], c[b]["low"]
    leg = s * (end - start)
    if b <= a or not atr[b] or leg < cfg["min_impulse_atr"] * atr[b]:
        return None
    if b - a > cfg["max_impulse_bars"] or i - b > cfg["max_wait_bars"] or i - b < 2:
        return None
    if cfg["use_volume"]:
        base = _mean([_vol(c[k]) for k in range(max(0, a - 20), a)])
        imp = _mean([_vol(c[k]) for k in range(a, b + 1)])
        pull = _mean([_vol(c[k]) for k in range(b + 1, i)])
        if base > 0 and imp < cfg["vol_mult"] * base:
            return None
        if imp > 0 and pull > cfg["pull_vol"] * imp:
            return None
    return {"a": a, "b": b, "start": start, "end": end, "leg": leg}


def sim_pullback(cfg, info, c5):
    trades, log = [], []
    if len(c5) < 120:
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
                _finish(st, st["stop"], "стоп", bar["begin"])
            else:
                if cfg["exit_mode"] == "impulse_high" and ((bar["high"] >= st["take"]) if s > 0 else (bar["low"] <= st["take"])):
                    _finish(st, st["take"], "хай импульса", bar["begin"])
                elif cfg["exit_mode"] == "fractal15":
                    for kind, v in fr15.get(i, []):
                        if (kind == "H" and s > 0 and v > st["entry"]) or (kind == "L" and s < 0 and v < st["entry"]):
                            _finish(st, bar["close"], "хай на 15 минутах" if s > 0 else "лой на 15 минутах", bar["begin"])
                            break
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
            imp = find_impulse(c5, atr, i, s, cfg)
            if not imp:
                continue
            key = (imp["a"], imp["b"], s)
            if key in traded:
                continue
            level = imp["start"] + s * cfg["entry_pct"] / 100 * imp["leg"]
            touched = (bar["low"] <= level) if s > 0 else (bar["high"] >= level)
            if not touched:
                continue
            traded.add(key)
            d = "ЛОНГ" if s > 0 else "ШОРТ"
            stop = imp["start"] - s * (cfg["stop_buf_atr"] * atr[i] + cfg["stop_buf_pts"])
            entry = level
            reject = ""
            if s * (entry - stop) <= 0 or ((bar["low"] <= stop) if s > 0 else (bar["high"] >= stop)):
                reject = "цена уже за началом импульса"
            elif abs(entry - stop) > cfg["max_stop_atr"] * atr[i]:
                reject = f"стоп слишком далеко ({abs(entry - stop) / atr[i]:.1f} ATR, максимум {cfg['max_stop_atr']})"
            elif _days_left(info, dt5[i]) <= cfg["expiry_days"]:
                reject = "близка экспирация контракта"
            elif clearing_block(cfg, dt5[i]):
                reject = "рядом клиринг"
            if reject:
                log.append((bar["begin"], "skip", f"{d}, импульс {imp['start']:.2f}→{imp['end']:.2f}: пропуск, {reject}"))
                continue
            cnt, note = size(cfg, info, entry, stop)
            if cnt < 1:
                log.append((bar["begin"], "skip", f"{d}: 1 контракт не укладывается в риск или обеспечение ({note})"))
                continue
            st = new_state({"dir": d, "entry": entry, "stop": stop, "take": imp["end"], "scenario": "откат после импульса"}, bar["begin"])
            entry_i = i
            trades.append(_mk(st, cnt, note))
            log.append((bar["begin"], "entry", f"вход {d} {cnt} шт. по {entry:.2f}: импульс {imp['start']:.2f}→{imp['end']:.2f} за {imp['b'] - imp['a']} баров, цена откатила к {cfg['entry_pct']:.0f}% пути от начала; стоп за началом {stop:.2f}"))
            break
    return trades, log
