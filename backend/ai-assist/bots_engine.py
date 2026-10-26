import json
from datetime import datetime, timedelta

import backtest
import bots_data as data
import bots_elliott as elliott
import bots_logic as logic
import bots_schema as schema
from bots_common import FMT, occurrences, result, trade_row

import trading_robot as tr

SCHEMA = tr.SCHEMA
MODE_LABEL = {"paper": "ТЕСТ", "live": "БОЕВОЙ"}
TYPE_LABEL = {"intraday": "Внутридневной", "trend": "Среднесрочный", "news": "Новостной", "elliott": "Волны Эллиотта"}


def load_cfg(row):
    try:
        raw = json.loads(row.get("settings") or "{}")
    except ValueError:
        raw = {}
    return schema.sanitize(row["bot_type"], raw)


def load_events(cur, start, end, min_importance):
    cur.execute(f"SELECT id, event_time, title, importance, repeat_weekly, repeat_until FROM {SCHEMA}.futures_news_events")
    return occurrences(cur.fetchall(), start, end, min_importance)


def pick_contract(asset, expiry_days):
    cs = data.contracts(asset)
    for c in cs:
        if c["days_left"] > expiry_days:
            return c
    return cs[-1] if cs else None


def simulate(cur, bot_type, cfg, info, secid, days):
    if bot_type == "intraday":
        c5 = data.history(secid, 5, days)
        t, log = logic.sim_intraday(cfg, info, c5)
        return t, log, c5
    if bot_type == "elliott":
        trig = data.history(secid, int(cfg["trigger_tf"]), days + 60)
        t, log = elliott.sim_elliott(cfg, info, trig)
        return t, log, trig
    if bot_type == "trend":
        daily = data.history(secid, 1440, days + 220)
        trig = data.history(secid, int(cfg["trigger_tf"]), days + 60)
        t, log = logic.sim_trend(cfg, info, daily, trig)
        return t, log, trig
    c5 = data.history(secid, 5, days)
    if not c5:
        return [], [], c5
    start = datetime.strptime(c5[0]["begin"], FMT)
    end = datetime.strptime(c5[-1]["begin"], FMT)
    ev = load_events(cur, start, end, cfg["min_importance"])
    t, log = logic.sim_news(cfg, info, c5, ev)
    return t, log, c5


def rows_from(trades, cfg, candles):
    out = []
    for tt in trades:
        st = tt["st"]
        row = trade_row(st, cfg, candles, len(candles) - 1, closed=st["closed"])
        row["contracts"] = tt["n"]
        row["scenario"] = st.get("scenario", "")
        out.append(row)
    return out


def run_backtest(cur, bot, days, proven=False, overrides=None):
    cfg = schema.defaults(bot["bot_type"]) if proven else load_cfg(bot)
    if overrides:
        cfg = schema.sanitize(bot["bot_type"], dict(cfg, **overrides))
    c = pick_contract(bot["asset_code"], 0)
    if not c:
        return {"error": "Контракт не найден"}
    trades, log, candles = simulate(cur, bot["bot_type"], cfg, c, c["secid"], days)
    rows = rows_from(trades, cfg, candles)
    cutoff = (datetime.now(tr.MSK).replace(tzinfo=None) - timedelta(days=days)).strftime(FMT)
    rows = [r for r in rows if r["date"] >= cutoff]
    log = [x for x in log if x[0] >= cutoff]
    summ = backtest.summarize(rows)
    done = [r for r in rows if r["closed"]]
    summ["avg_r"] = round(sum(r["r"] for r in done) / len(done), 2) if done else 0
    summ["total_r"] = round(sum(r["r"] for r in done), 2)
    summ["contracts_note"] = "Размер позиции считается по риску на сделку и обеспечению; результат в % к цене входа, с учётом комиссии"
    return {
        "title": f"{bot['name']} · {c['secid']}", "ticker": c["secid"], "from": max(cutoff, candles[0]["begin"]) if candles else None,
        "to": candles[-1]["begin"] if candles else None, "trades": rows, "summary": summ,
        "log": [{"t": a, "kind": k, "text": x} for a, k, x in log[-250:]],
    }


def add_log(cur, bot_id, kind, text, dedupe=True):
    if dedupe:
        cur.execute(f"SELECT 1 FROM {SCHEMA}.futures_bot_log WHERE bot_id=%s AND text=%s AND created_at > NOW() - INTERVAL '2 days' LIMIT 1", (bot_id, text))
        if cur.fetchone():
            return False
    cur.execute(f"INSERT INTO {SCHEMA}.futures_bot_log (bot_id, kind, text) VALUES (%s,%s,%s)", (bot_id, kind, text))
    return True


def _tp(v):
    return f"{v:.2f}"


def notify_open(bot, mode, secid, st, n, why):
    take = f"\nТейк: {_tp(st['take'])}" if st.get("take") else ""
    text = (f"[{MODE_LABEL[mode]}] {bot['name']}\nСигнал {st['dir']} по {secid}\nВход: {_tp(st['entry'])}\nСтоп: {_tp(st['stop'])}{take}\n"
            f"Объём: {n} контр.\nОснование: {why}\n\n" +
            ("Это учебная сделка, деньги не используются." if mode == "paper" else "Заявки робот не выставляет, решение за вами."))
    return tr.send_whatsapp(text)


def sync_live(conn, cur, bot, cfg, mode, secid, trades, log, candles, now, allow_new):
    bot_id = bot["id"]
    cur.execute(f"SELECT * FROM {SCHEMA}.robot_signals WHERE bot_id=%s AND status='open'", (bot_id,))
    open_rows = {r["signal_key"]: r for r in cur.fetchall()}
    horizon = now.replace(tzinfo=None) - timedelta(minutes=20 if bot["bot_type"] in ("intraday", "news") else 250)
    events = []
    for a, kind, text in log:
        try:
            when = datetime.strptime(a, FMT)
        except ValueError:
            continue
        if when >= horizon:
            if kind in ("entry",) and not allow_new:
                continue
            add_log(cur, bot_id, kind, f"{secid}: {text}")
    for tt in trades:
        st, n = tt["st"], tt["n"]
        key = f"{st['open_time']}|{st['dir']}"
        row = open_rows.get(key)
        if row is None:
            cur.execute(f"SELECT 1 FROM {SCHEMA}.robot_signals WHERE bot_id=%s AND signal_key=%s", (bot_id, key))
            if cur.fetchone():
                continue
            fresh = datetime.strptime(st["open_time"], FMT) >= horizon
            if not (allow_new and fresh) or st["closed"]:
                continue
            why = f"{TYPE_LABEL[bot['bot_type']]}: " + (st.get("scenario") or "по правилам робота")
            sent = notify_open(bot, mode, secid, st, n, why)
            cur.execute(
                f"INSERT INTO {SCHEMA}.robot_signals (ticker, asset_name, timeframe, direction, price, entry, stop_loss, target1, target2, reason, sent, "
                f"bot_id, bot_mode, signal_key, bot_state, contracts) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                (secid, bot["name"], "5m" if bot["bot_type"] in ("intraday", "news") else "1h", st["dir"], st["entry"], st["entry"], st["init_stop"],
                 st.get("take") or st["entry"], st.get("take") or st["entry"], f"[{MODE_LABEL[mode]}] {why}", sent, bot_id, mode, key,
                 json.dumps({"fixes": st["fixes"]}), n))
            events.append(f"{bot['name']}: вход {st['dir']} {secid}")
            continue
        prev = json.loads(row["bot_state"] or "{}").get("fixes", [])
        if len(st["fixes"]) > len(prev) and not st["closed"]:
            f = st["fixes"][-1]
            tr.send_whatsapp(f"[{MODE_LABEL[mode]}] {bot['name']}\n{st['dir']} {secid}: {f[2]} по {f[1]:.2f}, зафиксирована доля {f[0]:.0%}, стоп {st['stop']:.2f}")
            cur.execute(f"UPDATE {SCHEMA}.robot_signals SET bot_state=%s, stop_loss=%s, t1_hit=TRUE WHERE id=%s", (json.dumps({"fixes": st["fixes"]}), st["stop"], row["id"]))
        if st["closed"]:
            pct, r = result(st, cfg["cost_pct"])
            last = st["fixes"][-1]
            cur.execute(
                f"UPDATE {SCHEMA}.robot_signals SET status='closed', exit_price=%s, exit_reason=%s, result_pct=%s, closed_at=NOW(), bot_state=%s WHERE id=%s",
                (last[1], ", ".join(dict.fromkeys(f[2] for f in st["fixes"])), pct, json.dumps({"fixes": st["fixes"]}), row["id"]))
            tr.send_whatsapp(f"[{MODE_LABEL[mode]}] {bot['name']}\nВыход {st['dir']} {secid}: {', '.join(dict.fromkeys(f[2] for f in st['fixes']))}\nВход {st['entry']:.2f}, выход {last[1]:.2f}\nРезультат: {pct:+.2f}% ({r:+.2f}R)")
            events.append(f"{bot['name']}: выход {st['dir']} {secid} {pct:+.2f}%")
    conn.commit()
    return events


def close_stale(conn, cur, bot, cfg, mode, now):
    cur.execute(f"SELECT * FROM {SCHEMA}.robot_signals WHERE bot_id=%s AND status='open'", (bot["id"],))
    out = []
    for r in cur.fetchall():
        same_day = r["created_at"].date() == now.replace(tzinfo=None).date()
        if bot["bot_type"] in ("trend", "elliott") or same_day:
            continue
        candles = tr.get_candles(r["ticker"], "future", 5)
        if not candles:
            continue
        price = candles[-1]["close"]
        pct = tr.pnl(r["direction"], float(r["entry"]), price) - cfg["cost_pct"]
        cur.execute(f"UPDATE {SCHEMA}.robot_signals SET status='closed', exit_price=%s, exit_reason=%s, result_pct=%s, closed_at=NOW() WHERE id=%s",
                    (price, "Перенос через ночь запрещён, позиция закрыта", round(pct, 2), r["id"]))
        add_log(cur, bot["id"], "exit", f"{r['ticker']}: позиция прошлого дня закрыта по {price:.2f} (перенос через ночь запрещён)")
        out.append(f"{bot['name']}: закрыта старая позиция")
    conn.commit()
    return out


def roll_open(conn, cur, bot, cfg, mode):
    cur.execute(f"SELECT * FROM {SCHEMA}.robot_signals WHERE bot_id=%s AND status='open'", (bot["id"],))
    out = []
    for r in cur.fetchall():
        info = data.contract(r["ticker"])
        if not info or info["days_left"] > cfg.get("roll_days", 0):
            continue
        nxt = data.next_contract(r["ticker"])
        if not nxt:
            continue
        cur.execute(f"UPDATE {SCHEMA}.robot_signals SET ticker=%s WHERE id=%s", (nxt["secid"], r["id"]))
        txt = f"роллирование: позиция {r['direction']} перенесена с {r['ticker']} на {nxt['secid']} (до экспирации {info['days_left']} дн.)"
        add_log(cur, bot["id"], "roll", txt)
        tr.send_whatsapp(f"[{MODE_LABEL[mode]}] {bot['name']}\n{txt}")
        out.append(txt)
    conn.commit()
    return out


def in_session(now):
    if now.weekday() >= 5:
        return False
    m = now.hour * 60 + now.minute
    return 9 * 60 + 5 <= m <= 23 * 60 + 45


def run_bot(conn, cur, bot, now, force=False):
    mode = bot["mode"]
    if mode == "off":
        return {"bot": bot["name"], "status": "выключен"}
    cfg = load_cfg(bot)
    status = ""
    events = []
    try:
        events += close_stale(conn, cur, bot, cfg, mode, now)
        if bot["bot_type"] in ("trend", "elliott"):
            events += roll_open(conn, cur, bot, cfg, mode)
        if not force and not in_session(now):
            status = "рынок закрыт"
        else:
            c = pick_contract(bot["asset_code"], cfg["expiry_days"])
            if not c:
                status = "контракт не найден"
            else:
                if c["days_left"] <= cfg["expiry_days"]:
                    add_log(cur, bot["id"], "skip", f"{c['secid']}: до экспирации {c['days_left']} дн., новых входов нет")
                allow_new = c["days_left"] > cfg["expiry_days"]
                if bot["bot_type"] == "trend":
                    daily = data.history(c["secid"], 1440, 300)
                    trig = data.history(c["secid"], int(cfg["trigger_tf"]), 90)
                    trades, log = logic.sim_trend(cfg, c, daily, trig)
                    candles = trig
                elif bot["bot_type"] == "elliott":
                    candles = data.history(c["secid"], int(cfg["trigger_tf"]), 60)
                    trades, log = elliott.sim_elliott(cfg, c, candles)
                elif bot["bot_type"] == "intraday":
                    candles = tr.get_candles(c["secid"], "future", 5)
                    trades, log = logic.sim_intraday(cfg, c, candles)
                else:
                    candles = tr.get_candles(c["secid"], "future", 5)
                    start = now.replace(tzinfo=None) - timedelta(days=3)
                    ev = load_events(cur, start, now.replace(tzinfo=None) + timedelta(hours=6), cfg["min_importance"])
                    upcoming = [e for e in ev if timedelta(0) <= e["t"] - now.replace(tzinfo=None) <= timedelta(minutes=cfg["block_minutes"])]
                    for e in upcoming:
                        add_log(cur, bot["id"], "info", f"через {cfg['block_minutes']} мин событие «{e['title']}»: новые входы блокируются, открытые позиции подтягиваются")
                    trades, log = logic.sim_news(cfg, c, candles, ev)
                events += sync_live(conn, cur, bot, cfg, mode, c["secid"], trades, log, candles, now, allow_new)
                status = "проверено, " + (", ".join(events) if events else "новых решений нет")
    except Exception as e:
        status = f"ошибка: {e}"
        add_log(cur, bot["id"], "error", f"ошибка при проверке: {e}")
        conn.rollback()
    cur.execute(f"UPDATE {SCHEMA}.futures_bots SET last_run_at=NOW(), last_status=%s WHERE id=%s", (status[:300], bot["id"]))
    conn.commit()
    return {"bot": bot["name"], "status": status}


def run_all(conn, now, force=False):
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM {SCHEMA}.futures_bots WHERE mode <> 'off' ORDER BY id")
    return [run_bot(conn, cur, b, now, force) for b in cur.fetchall()]
