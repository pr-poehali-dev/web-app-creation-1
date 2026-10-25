from datetime import datetime, timedelta

import indicators
import strategy
import rules_engine

WINDOW = 250
COOLDOWN_BARS_HOURS = 6


def _ends(candles: list, tf: int) -> list:
    return [(datetime.strptime(c["begin"], "%Y-%m-%d %H:%M:%S") + timedelta(minutes=tf)).strftime("%Y-%m-%d %H:%M:%S")
            for c in candles]


def _pnl(direction: str, entry: float, price: float) -> float:
    if not entry:
        return 0.0
    d = (price - entry) / entry * 100
    return d if direction == "ЛОНГ" else -d


def _simulate_exit(sig: tuple, candles: list, start: int, tf: int, exit_fn, max_bars_override: int = 0):
    direction, entry, stop, t1, t2 = sig[0], sig[1], sig[2], sig[3], sig[4]
    is_long = direction == "ЛОНГ"
    t1_hit = False
    max_bars = (7 * 24 * 60 // tf) if tf == 60 else (24 * 60 // tf if tf < 60 else 20)
    for j in range(start, len(candles)):
        c = candles[j]
        cur_stop = entry if t1_hit else stop
        if (c["low"] <= cur_stop) if is_long else (c["high"] >= cur_stop):
            return j, cur_stop, "стоп в безубытке" if t1_hit else "стоп", t1_hit
        if (c["high"] >= t2) if is_long else (c["low"] <= t2):
            return j, t2, "цель 2", t1_hit
        if not t1_hit and ((c["high"] >= t1) if is_long else (c["low"] <= t1)):
            t1_hit = True
        why = exit_fn(j) if exit_fn else ""
        if why:
            return j, c["close"], why, t1_hit
        if j - start >= max_bars:
            return j, c["close"], "устарел по времени", t1_hit
    return None, candles[-1]["close"], "открыта", t1_hit


def _simulate_trail(sig, candles, start, tf, exit_fn, trail, t2_mult, max_bars):
    direction, entry, stop, t1 = sig[0], sig[1], sig[2], sig[3]
    atr = sig[7]
    is_long = direction == "ЛОНГ"
    t1_hit = False
    t2 = entry + t2_mult * atr if is_long else entry - t2_mult * atr
    ext = entry
    for j in range(start, len(candles)):
        c = candles[j]
        if t1_hit:
            lvl = ext - trail * atr if is_long else ext + trail * atr
            cur_stop = max(entry, lvl) if is_long else min(entry, lvl)
        else:
            cur_stop = stop
        if (c["low"] <= cur_stop) if is_long else (c["high"] >= cur_stop):
            return j, cur_stop, "стоп вслед за ценой" if t1_hit else "стоп", t1_hit
        if t2_mult and ((c["high"] >= t2) if is_long else (c["low"] <= t2)):
            return j, t2, "цель 2", t1_hit
        if not t1_hit and ((c["high"] >= t1) if is_long else (c["low"] <= t1)):
            t1_hit = True
        ext = max(ext, c["high"]) if is_long else min(ext, c["low"])
        why = exit_fn(j) if exit_fn else ""
        if why:
            return j, c["close"], why, t1_hit
        if j - start >= max_bars:
            return j, c["close"], "устарел по времени", t1_hit
    return None, candles[-1]["close"], "открыта", t1_hit


def _result(sig, exit_price, t1_hit, frac=0.5):
    pct = _pnl(sig[0], sig[1], exit_price)
    if t1_hit:
        pct = frac * _pnl(sig[0], sig[1], sig[3]) + (1 - frac) * pct
    return round(pct, 2)


def run_rule(rule: dict, by_tf: dict) -> dict:
    base = rules_engine.rule_tf(rule)
    main = by_tf.get(base) or []
    ends = {t: _ends(cs, t) for t, cs in by_tf.items()}
    variants = rules_engine.variants(rule)
    trades = []
    busy_until = {}
    cooldown = COOLDOWN_BARS_HOURS * 60 // base
    for i in range(55, len(main) - 1):
        cutoff = ends[base][i]
        sub = {}
        for t, cs in by_tf.items():
            k = len([e for e in ends[t] if e <= cutoff]) if t != base else i + 1
            sub[t] = cs[max(0, k - WINDOW):k]
        for v in variants:
            d = v["direction"]
            if busy_until.get(d, -1) >= i:
                continue
            sig = rules_engine.evaluate_entry(v, sub)
            if not sig:
                continue

            def exit_fn(j, v=v, cutoff_ends=ends):
                if not v.get("exit_conditions"):
                    return ""
                cut = cutoff_ends[base][j]
                s2 = {}
                for t, cs in by_tf.items():
                    k = len([e for e in cutoff_ends[t] if e <= cut]) if t != base else j + 1
                    s2[t] = cs[max(0, k - WINDOW):k]
                why = rules_engine.exit_reason(v, s2)
                return f"условие выхода: {why}" if why else ""

            j, price, why, t1_hit = _simulate_exit(sig, main, i + 1, base, exit_fn)
            closed = j is not None
            trades.append({
                "date": main[i]["begin"], "direction": d, "entry": round(sig[1], 4),
                "stop": round(sig[2], 4), "target1": round(sig[3], 4), "target2": round(sig[4], 4),
                "exit_date": main[j]["begin"] if closed else None, "exit_price": round(price, 4),
                "reason": why, "t1_hit": t1_hit, "result_pct": _result(sig, price, t1_hit), "closed": closed,
            })
            busy_until[d] = (j if closed else len(main)) + cooldown
    return {"trades": trades, "bars": len(main), "from": main[0]["begin"] if main else None,
            "to": main[-1]["begin"] if main else None}


def run_base(candles: list, allow_short: bool, analyze, window: int = WINDOW, tf: int = 60, ex: dict = None, scfg: dict = None) -> dict:
    trades = []
    busy_until = {}
    cooldown = max(1, (scfg["cooldown_hours"] if scfg else COOLDOWN_BARS_HOURS) * 60 // tf)
    for i in range(55, len(candles) - 1):
        sub = candles[max(0, i + 1 - window):i + 1]
        sig = analyze(sub, allow_short)
        if not sig:
            continue
        d = sig[0]
        if busy_until.get(d, -1) >= i:
            continue

        def exit_fn(j, d=d):
            closes = [c["close"] for c in candles[max(0, j + 1 - window):j + 1]]
            if str(sig[5]).startswith("Боковик"):
                return ""
            if scfg:
                return strategy.trend_exit(closes, d, scfg)
            if len(closes) < 50:
                return ""
            sma20 = sum(closes[-20:]) / 20
            sma50 = sum(closes[-50:]) / 50
            last = closes[-1]
            if d == "ЛОНГ" and sma20 < sma50 and last < sma50:
                return "тренд развернулся"
            if d == "ШОРТ" and sma20 > sma50 and last > sma50:
                return "тренд развернулся"
            return ""

        if ex:
            j, price, why, t1_hit = _simulate_trail(sig, candles, i + 1, tf, exit_fn, ex.get("trail", 2.0), ex.get("t2", 0),
                                                     ex.get("max_bars", 7 * 24 * 60 // tf))
        else:
            j, price, why, t1_hit = _simulate_exit(sig, candles, i + 1, tf, exit_fn,
                                                   scfg["max_days"] * 24 * 60 // tf if scfg else 0)
        closed = j is not None
        ax = indicators.adx(sub[-120:])
        cl = [c["close"] for c in sub]
        gap = (sum(cl[-20:]) / 20 - sum(cl[-50:]) / 50) / sum(cl[-50:]) * 50 * 2
        trades.append({
            "adx": round(ax[0], 1) if ax else None, "atr": sig[7], "atr_pct": round(sig[7] / sig[1] * 100, 2),
            "gap_pct": round(gap, 2), "date": candles[i]["begin"], "direction": d, "entry": round(sig[1], 4),
            "stop": round(sig[2], 4), "target1": round(sig[3], 4), "target2": round(sig[4], 4),
            "exit_date": candles[j]["begin"] if closed else None, "exit_price": round(price, 4),
            "reason": why, "setup": sig[5], "t1_hit": t1_hit, "result_pct": _result(sig, price, t1_hit, scfg["t1_frac"] if scfg else (ex or {}).get("frac", 0.5)), "closed": closed,
        })
        busy_until[d] = (j if closed else len(candles)) + cooldown
    return {"trades": trades, "bars": len(candles), "from": candles[0]["begin"] if candles else None,
            "to": candles[-1]["begin"] if candles else None}


def summarize(trades: list) -> dict:
    done = [t for t in trades if t["closed"]]
    wins = [t for t in done if t["result_pct"] > 0]
    losses = [t for t in done if t["result_pct"] <= 0]
    gw = sum(t["result_pct"] for t in wins)
    gl = -sum(t["result_pct"] for t in losses)
    equity = peak = dd = 0.0
    for t in done:
        equity += t["result_pct"]
        peak = max(peak, equity)
        dd = max(dd, peak - equity)
    return {
        "signals": len(trades), "closed": len(done), "open": len(trades) - len(done),
        "wins": len(wins), "win_rate": round(len(wins) / len(done) * 100, 1) if done else 0,
        "total_pct": round(sum(t["result_pct"] for t in done), 2),
        "avg_pct": round(sum(t["result_pct"] for t in done) / len(done), 2) if done else 0,
        "profit_factor": round(gw / gl, 2) if gl else (None if not gw else 999),
        "max_drawdown_pct": round(dd, 2),
    }


def resim_5m(trades: list, c5: list, k: float, spike_min_profit: float = 0.0) -> list:
    idx = {c["begin"]: n for n, c in enumerate(c5)}
    starts = [c["begin"] for c in c5]
    out = []
    import bisect
    for t in trades:
        if not t["closed"]:
            continue
        eb = (datetime.strptime(t["date"], "%Y-%m-%d %H:%M:%S") + timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")
        s = bisect.bisect_left(starts, eb)
        if s >= len(c5) - 1 or s < 1:
            continue
        sig = (t["direction"], t["entry"], t["stop"], t["target1"], t["target2"], "", t["entry"], t["atr"])
        is_long = t["direction"] == "ЛОНГ"
        atr = t["atr"]

        def fn(j, is_long=is_long, atr=atr, entry=t["entry"]):
            if not k:
                return ""
            move = c5[j]["close"] - c5[j - 1]["close"]
            move = move if is_long else -move
            gain = (c5[j]["close"] - entry) if is_long else (entry - c5[j]["close"])
            if move >= k * atr and gain >= spike_min_profit * atr:
                return "резкий прострел"
            return ""

        j, price, why, t1_hit = _simulate_exit(sig, c5, s, 5, fn)
        if j is None:
            continue
        out.append({"date": t["date"], "direction": t["direction"], "reason": why, "t1_hit": t1_hit,
                    "result_pct": _result(sig, price, t1_hit), "closed": True})
    return out
