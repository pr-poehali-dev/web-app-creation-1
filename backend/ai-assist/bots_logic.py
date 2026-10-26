from datetime import datetime, timedelta

import indicators
from bots_common import (FMT, atr_series, clearing_block, dts, ema_series, fix, new_state, occurrences, sign, size, stochrsi_k, vwap_series)

BAR = timedelta(minutes=5)


def _days_left(info, t):
    if not info or not info.get("last"):
        return 999
    return (datetime.strptime(info["last"], "%Y-%m-%d").date() - t.date()).days


def _finish(st, price, why, when):
    fix(st, st["rem"], price, why)
    st["closed"] = True
    st["exit_time"] = when


def _mk(st, n, note):
    return {"st": st, "n": n, "note": note}


def sim_intraday(cfg, info, c5):
    trades, log = [], []
    if len(c5) < 40:
        return trades, log
    dt = dts(c5)
    closes = [c["close"] for c in c5]
    atr = atr_series(c5, 14)
    ema20 = ema_series(closes, 20)
    days = {}
    for i, d in enumerate(dt):
        days.setdefault(d.date(), []).append(i)
    ws = cfg["or_start_hour"] * 60
    we = ws + cfg["or_minutes"]
    close_m = cfg["close_hour"] * 60 + cfg["close_min"]
    for day in sorted(days):
        idx = days[day]
        if day.weekday() >= 5:
            continue
        mins = lambda i: dt[i].hour * 60 + dt[i].minute
        or_idx = [i for i in idx if ws <= mins(i) < we]
        after = [i for i in idx if mins(i) >= we]
        if not after:
            continue
        stamp = c5[after[0]]["begin"]
        if len(or_idx) < max(2, int(cfg["or_minutes"] / 5 * 0.7)):
            log.append((stamp, "skip", f"{day}: нет данных по диапазону открытия, день пропущен"))
            continue
        hi = max(c5[i]["high"] for i in or_idx)
        lo = min(c5[i]["low"] for i in or_idx)
        width = (hi - lo) / ((hi + lo) / 2) * 100
        if width < cfg["min_range_pct"]:
            log.append((stamp, "skip", f"{day}: диапазон открытия {width:.2f}% уже порога {cfg['min_range_pct']}%, день пропущен"))
            continue
        log.append((stamp, "info", f"{day}: диапазон {lo:.2f}–{hi:.2f} (ширина {width:.2f}%)"))
        st, entry_i, traded, warned = None, None, False, set()
        for i in after:
            bar, m = c5[i], mins(i)
            if st and i > entry_i:
                s = sign(st["dir"])
                if (bar["low"] <= st["stop"]) if s > 0 else (bar["high"] >= st["stop"]):
                    _finish(st, st["stop"], "безубыток" if st["be"] else "стоп", bar["begin"])
                elif (bar["high"] >= st["take"]) if s > 0 else (bar["low"] <= st["take"]):
                    _finish(st, st["take"], "тейк-профит", bar["begin"])
                elif m + 5 >= close_m:
                    _finish(st, bar["close"], "закрытие дня", bar["begin"])
                else:
                    if cfg["be_r"] > 0 and not st["be"] and ((bar["high"] - st["entry"]) * s if s > 0 else (st["entry"] - bar["low"])) >= cfg["be_r"] * st["risk"]:
                        st["be"] = True
                        st["stop"] = st["entry"]
                        log.append((bar["begin"], "move", f"стоп перенесён в безубыток ({st['entry']:.2f})"))
                if st["closed"]:
                    log.append((bar["begin"], "exit", f"выход {st['dir']}: {st['fixes'][-1][2]} по {st['fixes'][-1][1]:.2f}"))
                    st = None
                continue
            if st or traded or m >= cfg["last_entry_hour"] * 60 or i == 0:
                continue
            d = "ЛОНГ" if bar["close"] > hi else ("ШОРТ" if bar["close"] < lo else "")
            if not d:
                continue
            tag = (day, d)
            if d == "ШОРТ" and not cfg["allow_short"]:
                if tag not in warned:
                    warned.add(tag)
                    log.append((bar["begin"], "skip", "пробой вниз пропущен: шорты выключены"))
                continue
            if _days_left(info, dt[i]) <= cfg["expiry_days"]:
                log.append((bar["begin"], "skip", f"пробой пропущен: до экспирации {_days_left(info, dt[i])} дн., нужен переход на следующий контракт"))
                traded = True
                continue
            if clearing_block(cfg, dt[i]):
                if tag not in warned:
                    warned.add(tag)
                    log.append((bar["begin"], "skip", "пробой рядом с клирингом, вход отложен"))
                continue
            why = []
            if cfg["use_volume"]:
                prev = [c5[j]["volume"] for j in range(max(0, i - cfg["vol_period"]), i)]
                avg = sum(prev) / len(prev) if prev else 0
                if avg > 0 and bar["volume"] < avg * cfg["vol_mult"]:
                    why.append(f"объём {bar['volume'] / avg:.1f}× от среднего, нужно {cfg['vol_mult']}×")
            if cfg["use_keltner"] and atr[i]:
                edge = ema20[i] + cfg["keltner_k"] * atr[i] if d == "ЛОНГ" else ema20[i] - cfg["keltner_k"] * atr[i]
                if (d == "ЛОНГ" and bar["close"] <= edge) or (d == "ШОРТ" and bar["close"] >= edge):
                    why.append("цена не вышла за канал Кельтнера")
            if why:
                if tag not in warned:
                    warned.add(tag)
                    log.append((bar["begin"], "skip", f"пробой {d} без подтверждения: " + "; ".join(why)))
                continue
            entry = bar["close"]
            if cfg["stop_mode"] == "atr" and atr[i]:
                stop = entry - cfg["stop_atr"] * atr[i] if d == "ЛОНГ" else entry + cfg["stop_atr"] * atr[i]
            else:
                stop = lo if d == "ЛОНГ" else hi
            risk = abs(entry - stop)
            if risk <= 0 or (d == "ЛОНГ" and stop >= entry) or (d == "ШОРТ" and stop <= entry):
                log.append((bar["begin"], "skip", "пробой пропущен: стоп некорректен"))
                traded = True
                continue
            n, note = size(cfg, info, entry, stop)
            if n < 1:
                log.append((bar["begin"], "skip", f"пробой {d} пропущен: даже 1 контракт не укладывается в риск или обеспечение ({note})"))
                traded = True
                continue
            take = entry + cfg["rr"] * risk * sign(d)
            st = new_state({"dir": d, "entry": entry, "stop": stop, "take": take}, bar["begin"])
            st["init_stop"] = stop
            entry_i, traded = i, True
            trades.append(_mk(st, n, note))
            log.append((bar["begin"], "entry", f"вход {d} {n} шт. по {entry:.2f}: закрытие 5-мин бара за границей диапазона {lo:.2f}–{hi:.2f}; стоп {stop:.2f}, тейк {take:.2f} ({cfg['rr']}R)"))
    return trades, log


def _candle_ok(c, p, d):
    body = abs(c["close"] - c["open"])
    rng = max(c["high"] - c["low"], 1e-9)
    if d == "ЛОНГ":
        hammer = (min(c["open"], c["close"]) - c["low"]) >= 2 * body and body / rng < 0.4 and c["close"] >= c["open"]
        engulf = p["close"] < p["open"] and c["close"] > p["open"] and c["open"] <= p["close"]
        return hammer or engulf
    star = (c["high"] - max(c["open"], c["close"])) >= 2 * body and body / rng < 0.4 and c["close"] <= c["open"]
    engulf = p["close"] > p["open"] and c["close"] < p["open"] and c["open"] >= p["close"]
    return star or engulf


def sim_trend(cfg, info, daily, trig):
    trades, log = [], []
    nd = len(daily)
    if nd < cfg["trend_ema"] + 5 or len(trig) < 60:
        return trades, log
    ddt = dts(daily)
    dclose = [c["close"] for c in daily]
    dema = ema_series(dclose, cfg["trend_ema"])
    dadx = [None] * nd
    for k in range(cfg["adx_period"] * 2 + 3, nd):
        r = indicators.adx(daily[max(0, k - 150):k + 1], cfg["adx_period"])
        dadx[k] = r[0] if r else None
    tdt = dts(trig)
    tclose = [c["close"] for c in trig]
    efast = ema_series(tclose, cfg["trigger_ema"])
    atr = atr_series(trig, 14)
    sk = stochrsi_k(tclose)
    j, st, entry_i = -1, None, None
    for i in range(30, len(trig)):
        bar = trig[i]
        while j + 1 < nd and ddt[j + 1].date() < tdt[i].date():
            j += 1
        if j < cfg["trend_ema"] or not atr[i]:
            continue
        up = dclose[j] > dema[j]
        adx_d = dadx[j]
        if st:
            s = sign(st["dir"])
            hit = (bar["low"] <= st["stop"]) if s > 0 else (bar["high"] >= st["stop"])
            if hit:
                px = min(st["stop"], bar["open"]) if s > 0 else max(st["stop"], bar["open"])
                _finish(st, px, "трейлинг-стоп" if st["stage"] >= 1 else "стоп", bar["begin"])
            else:
                st["extreme"] = max(st["extreme"], bar["high"]) if s > 0 else min(st["extreme"], bar["low"])
                if st["stage"] >= 1:
                    tr = st["extreme"] - s * cfg["trail_atr"] * atr[i]
                    if (tr > st["stop"]) if s > 0 else (tr < st["stop"]):
                        st["stop"] = tr
                if cfg["cut_on_flat"] and adx_d is not None and adx_d < cfg["adx_min"] and not st.get("cut"):
                    st["cut"] = True
                    fix(st, cfg["fix1_frac"], bar["close"], "боковик (ADX низкий)")
                    log.append((bar["begin"], "move", f"боковик (ADX {adx_d:.0f}): сокращена часть позиции по {bar['close']:.2f}"))
                if not st["closed"] and st["stage"] == 0 and ((bar["close"] < efast[i]) if s > 0 else (bar["close"] > efast[i])):
                    fix(st, cfg["fix1_frac"], bar["close"], "разворот краткосрочного тренда")
                    st["stage"] = 1
                    log.append((bar["begin"], "move", f"фиксация 1: краткосрочный тренд развернулся, зафиксирована часть по {bar['close']:.2f}, включён трейлинг"))
                if not st["closed"] and st["stage"] < 2 and ((dclose[j] < dema[j]) if s > 0 else (dclose[j] > dema[j])):
                    fix(st, cfg["fix2_frac"], bar["close"], "разворот среднесрочного тренда")
                    st["stage"] = 2
                    log.append((bar["begin"], "move", f"фиксация 2: дневной тренд развернулся, зафиксирована ещё часть по {bar['close']:.2f}"))
                if not st["closed"] and not st.get("rolled") and _days_left(info, tdt[i]) <= cfg["roll_days"]:
                    st["rolled"] = True
                    st["roll_cost"] += cfg["roll_slippage_pct"]
                    log.append((bar["begin"], "roll", f"роллирование: до экспирации {_days_left(info, tdt[i])} дн., позиция переносится в следующий контракт (проскальзывание {cfg['roll_slippage_pct']}%)"))
                if not st["closed"] and (tdt[i] - datetime.strptime(st["open_time"], FMT)).days >= cfg["max_hold_days"]:
                    _finish(st, bar["close"], "срок удержания", bar["begin"])
            if st["closed"]:
                st.setdefault("exit_time", bar["begin"])
                log.append((bar["begin"], "exit", f"выход {st['dir']}: " + ", ".join(dict.fromkeys(f[2] for f in st["fixes"]))))
                st = None
            continue
        if (adx_d is None) or adx_d < cfg["adx_min"]:
            continue
        d = "ЛОНГ" if up else "ШОРТ"
        if d == "ШОРТ" and not cfg["allow_short"]:
            continue
        if _days_left(info, tdt[i]) <= cfg["expiry_days"] or clearing_block(cfg, tdt[i]):
            continue
        near = min(trig[k]["low"] for k in range(i - 2, i + 1)) if up else max(trig[k]["high"] for k in range(i - 2, i + 1))
        touch = (near <= efast[i] + cfg["touch_atr"] * atr[i]) if up else (near >= efast[i] - cfg["touch_atr"] * atr[i])
        back = (bar["close"] > efast[i]) if up else (bar["close"] < efast[i])
        if not (touch and back):
            continue
        ok_c = cfg["use_candle"] and _candle_ok(bar, trig[i - 1], d)
        ok_s = False
        if cfg["use_stochrsi"] and sk[i] is not None and sk[i - 1] is not None:
            rec = [v for v in sk[i - 3:i] if v is not None]
            if up:
                ok_s = bool(rec) and min(rec) < cfg["stoch_low"] and sk[i] > sk[i - 1] and sk[i] >= cfg["stoch_low"]
            else:
                ok_s = bool(rec) and max(rec) > cfg["stoch_high"] and sk[i] < sk[i - 1] and sk[i] <= cfg["stoch_high"]
        if (cfg["use_candle"] or cfg["use_stochrsi"]) and not (ok_c or ok_s):
            continue
        entry = bar["close"]
        if cfg["stop_mode"] == "swing":
            win = trig[i - cfg["swing_bars"] + 1:i + 1]
            stop = min(c["low"] for c in win) - cfg["swing_buffer_atr"] * atr[i] if up else max(c["high"] for c in win) + cfg["swing_buffer_atr"] * atr[i]
            far = cfg["max_stop_atr"] * atr[i]
            stop = max(stop, entry - far) if up else min(stop, entry + far)
        else:
            stop = entry - cfg["stop_atr"] * atr[i] if up else entry + cfg["stop_atr"] * atr[i]
        if (up and stop >= entry) or (not up and stop <= entry):
            continue
        n, note = size(cfg, info, entry, stop)
        if n < 1:
            log.append((bar["begin"], "skip", f"сигнал {d} пропущен: 1 контракт не укладывается в риск или обеспечение ({note})"))
            continue
        st = new_state({"dir": d, "entry": entry, "stop": stop}, bar["begin"])
        entry_i = i
        trades.append(_mk(st, n, note))
        how = "свеча" if ok_c else "StochRSI"
        log.append((bar["begin"], "entry", f"вход {d} {n} шт. по {entry:.2f}: дневной тренд {'вверх' if up else 'вниз'}, ADX {adx_d:.0f}, откат к EMA{cfg['trigger_ema']} подтверждён ({how}); стоп {stop:.2f}"))
    return trades, log


def sim_news(cfg, info, c5, events):
    trades, log = [], []
    if len(c5) < 60 or not events:
        return trades, log
    dt = dts(c5)
    closes = [c["close"] for c in c5]
    atr = atr_series(c5, 14)
    vw = vwap_series(c5, dt)
    close_m = cfg["close_hour"] * 60 + cfg["close_min"]
    busy_until = None

    def band(i):
        w = closes[i - cfg["bb_period"] + 1:i + 1]
        mean = sum(w) / len(w)
        sd = (sum((x - mean) ** 2 for x in w) / len(w)) ** 0.5
        return mean - cfg["bb_k"] * sd, mean + cfg["bb_k"] * sd

    def manage(st, i, T, tighten_at):
        bar = c5[i]
        s = sign(st["dir"])
        m = dt[i].hour * 60 + dt[i].minute
        if (bar["low"] <= st["stop"]) if s > 0 else (bar["high"] >= st["stop"]):
            _finish(st, st["stop"], "стоп", bar["begin"])
        elif (bar["high"] >= st["take"]) if s > 0 else (bar["low"] <= st["take"]):
            _finish(st, st["take"], "тейк-профит", bar["begin"])
        elif m + 5 >= close_m:
            _finish(st, bar["close"], "закрытие дня", bar["begin"])
        elif (dt[i] - datetime.strptime(st["open_time"], FMT)).total_seconds() / 60 >= cfg["max_hold_min"]:
            _finish(st, bar["close"], "время в сделке", bar["begin"])
        elif tighten_at and not st["tight"] and dt[i] + BAR >= tighten_at:
            st["tight"] = True
            ns = bar["close"] - (bar["close"] - st["stop"]) * cfg["tighten_factor"]
            if (ns > st["stop"]) if s > 0 else (ns < st["stop"]):
                st["stop"] = ns
                log.append((bar["begin"], "move", f"перед новостью «{T['title']}» стоп подтянут до {ns:.2f}"))
        if st["closed"]:
            log.append((bar["begin"], "exit", f"выход {st['dir']}: {st['fixes'][-1][2]} по {st['fixes'][-1][1]:.2f}"))

    warned = set()

    def skip(i, T, scenario, text):
        k = (T["id"], T["t"], scenario, text[:25])
        if k not in warned:
            warned.add(k)
            log.append((c5[i]["begin"], "skip", f"«{T['title']}», {scenario}: {text}"))

    def open_pos(i, d, entry, stop, take, scenario, T, why):
        risk = abs(entry - stop)
        if risk <= 0 or (d == "ЛОНГ" and not (stop < entry < take)) or (d == "ШОРТ" and not (take < entry < stop)):
            skip(i, T, scenario, f"сигнал {d} отклонён: цель (VWAP) не в сторону возврата от цены {entry:.2f}")
            return None
        if atr[i] and risk < cfg["min_stop_atr"] * atr[i]:
            skip(i, T, scenario, f"сигнал {d} отклонён: стоп слишком близко ({risk:.2f}, меньше {cfg['min_stop_atr']} ATR)")
            return None
        rr = abs(take - entry) / risk
        if rr < cfg["min_rr"]:
            skip(i, T, scenario, f"сигнал {d} отклонён: прибыль/риск {rr:.2f} ниже минимума {cfg['min_rr']}")
            return None
        n, note = size(cfg, info, entry, stop)
        if n < 1:
            skip(i, T, scenario, f"сигнал {d} отклонён: 1 контракт не укладывается в риск или обеспечение ({note})")
            return None
        st = new_state({"dir": d, "entry": entry, "stop": stop, "take": take, "event_t": T["t"].strftime(FMT), "scenario": scenario}, c5[i]["begin"])
        trades.append(_mk(st, n, note))
        log.append((c5[i]["begin"], "entry", f"вход {d} {n} шт. по {entry:.2f} ({scenario}, событие «{T['title']}»): {why}; стоп {stop:.2f}, цель {take:.2f}"))
        return st

    for T in events:
        tt = T["t"]
        iT = next((k for k, d in enumerate(dt) if d >= tt), None)
        if iT is None or iT < 40 or (dt[iT] - tt) > timedelta(minutes=10):
            continue
        if busy_until and dt[iT] <= busy_until:
            continue
        log.append((c5[iT]["begin"], "info", f"событие «{T['title']}» {tt.strftime('%d.%m %H:%M')}"))
        if _days_left(info, tt) <= cfg["expiry_days"]:
            log.append((c5[iT]["begin"], "skip", "событие пропущено: близка экспирация контракта"))
            continue
        st, i = None, iT - 1
        block_at = tt - timedelta(minutes=cfg["block_minutes"])
        if cfg["use_a"]:
            a_from = tt - timedelta(minutes=cfg["pre_minutes"])
            for i in range(iT):
                if dt[i] < a_from or dt[i] + BAR > block_at:
                    continue
                if st is None and i >= max(cfg["bb_period"], cfg["channel_bars"]) and atr[i]:
                    bar, d = c5[i], ""
                    if cfg["a_entry"] == "bollinger":
                        lo_b, hi_b = band(i)
                        d = "ЛОНГ" if bar["close"] <= lo_b else ("ШОРТ" if bar["close"] >= hi_b else "")
                        if d and vw[i]:
                            ent = bar["close"]
                            stp = lo_b - cfg["a_buffer_atr"] * atr[i] if d == "ЛОНГ" else hi_b + cfg["a_buffer_atr"] * atr[i]
                            if d == "ШОРТ" and not cfg["allow_short"]:
                                continue
                            st = open_pos(i, d, ent, stp, vw[i], "до новости", T, f"цена у внешней полосы Боллинджера, ожидается возврат к VWAP {vw[i]:.2f}")
                    else:
                        w = c5[i - cfg["channel_bars"]:i]
                        ch_hi, ch_lo = max(c["high"] for c in w), min(c["low"] for c in w)
                        if (ch_hi - ch_lo) / bar["close"] * 100 <= cfg["channel_max_pct"]:
                            d = "ЛОНГ" if bar["close"] > ch_hi else ("ШОРТ" if bar["close"] < ch_lo else "")
                            if d == "ШОРТ" and not cfg["allow_short"]:
                                continue
                            if d:
                                ent = bar["close"]
                                stp = ch_lo if d == "ЛОНГ" else ch_hi
                                st = open_pos(i, d, ent, stp, ent + cfg["channel_rr"] * abs(ent - stp) * sign(d), "до новости", T, f"пробой узкого канала {ch_lo:.2f}–{ch_hi:.2f}")
                    if st:
                        entry_i = i
                        continue
                elif st is not None and not st["closed"]:
                    manage(st, i, T, block_at)
                    if st["closed"]:
                        busy_until = dt[i]
        if st and not st["closed"]:
            for i in range(iT, len(c5)):
                if dt[i].date() != tt.date():
                    break
                manage(st, i, T, block_at)
                if st["closed"]:
                    busy_until = dt[i]
                    break
            if not st["closed"]:
                continue
        if st and st["closed"] and busy_until is None:
            busy_until = dt[iT]
        if not cfg["use_b"] or (st and not st["closed"]):
            continue
        pre = c5[iT - 1]["close"]
        a0 = atr[iT - 1]
        lv = c5[iT - cfg["level_bars"]:iT]
        lvl_hi, lvl_lo = max(c["high"] for c in lv), min(c["low"] for c in lv)
        end_b = tt + timedelta(minutes=cfg["post_minutes"])
        ext_hi, ext_lo, pos = -1e18, 1e18, None
        for i in range(iT, len(c5)):
            if dt[i] > end_b and pos is None:
                break
            bar = c5[i]
            if pos is not None:
                manage(pos, i, T, None)
                if pos["closed"]:
                    busy_until = dt[i]
                    break
                continue
            ext_hi, ext_lo = max(ext_hi, bar["high"]), min(ext_lo, bar["low"])
            if i < iT + cfg["stabilize_bars"] or not a0:
                continue
            if bar["high"] - bar["low"] > cfg["max_bar_atr"] * a0:
                log.append((bar["begin"], "skip", f"«{T['title']}»: бар слишком широкий ({(bar['high'] - bar['low']) / a0:.1f} ATR), спред и ликвидность нестабильны"))
                continue
            tgt = vw[i] if cfg["b_target"] == "vwap" and vw[i] else pre
            if ext_hi - pre >= cfg["impulse_atr"] * a0 and ext_hi > lvl_hi and bar["close"] < lvl_hi and cfg["allow_short"]:
                pos = open_pos(i, "ШОРТ", bar["close"], ext_hi + cfg["b_buffer_atr"] * a0, tgt, "после новости", T, f"ложный пробой {lvl_hi:.2f} после импульса вверх, вход против импульса")
            elif pre - ext_lo >= cfg["impulse_atr"] * a0 and ext_lo < lvl_lo and bar["close"] > lvl_lo:
                pos = open_pos(i, "ЛОНГ", bar["close"], ext_lo - cfg["b_buffer_atr"] * a0, tgt, "после новости", T, f"ложный пробой {lvl_lo:.2f} после импульса вниз, вход против импульса")
            if pos is not None:
                busy_until = dt[i]
    return trades, log
