import json
from datetime import datetime

import bots_data as data
import bots_engine as eng
import bots_schema as schema
import trading_robot as tr

SCHEMA = tr.SCHEMA
ACTIONS = ("bots_meta", "bots_list", "bots_save", "bots_delete", "bots_mode", "bots_log", "bots_backtest",
           "bots_events", "bots_event_save", "bots_event_delete", "bots_run", "bots_assets")


def crypto_bot(b):
    return b["bot_type"] in schema.CRYPTO_TYPES


def _bot(cur, bid):
    cur.execute(f"SELECT * FROM {SCHEMA}.futures_bots WHERE id=%s", (bid,))
    return cur.fetchone()


def _card(cur, b):
    cfg = eng.load_cfg(b)
    cur.execute(
        f"SELECT COUNT(*) FILTER (WHERE status='open') AS open_count, COUNT(*) FILTER (WHERE status='closed') AS closed, "
        f"COUNT(*) FILTER (WHERE status='closed' AND result_pct > 0) AS wins, "
        f"COALESCE(SUM(result_pct) FILTER (WHERE status='closed'), 0) AS total_pct "
        f"FROM {SCHEMA}.robot_signals WHERE bot_id=%s AND bot_mode=%s", (b["id"], "paper"))
    paper = cur.fetchone()
    cur.execute(
        f"SELECT COUNT(*) FILTER (WHERE status='open') AS open_count, COUNT(*) FILTER (WHERE status='closed') AS closed, "
        f"COALESCE(SUM(result_pct) FILTER (WHERE status='closed'), 0) AS total_pct "
        f"FROM {SCHEMA}.robot_signals WHERE bot_id=%s AND bot_mode=%s", (b["id"], "live"))
    live = cur.fetchone()
    contract = None
    try:
        c = eng.pick_contract(b["asset_code"], cfg["expiry_days"], cfg)
        contract = c["secid"] if c else None
        days_left = None if crypto_bot(b) else (c["days_left"] if c else None)
    except Exception:
        days_left = None
    paper_days = 0
    if b["armed_at"]:
        paper_days = (datetime.utcnow() - b["armed_at"]).days
    return {
        "id": b["id"], "bot_type": b["bot_type"], "type_title": eng.TYPE_LABEL[b["bot_type"]], "name": b["name"],
        "asset_code": b["asset_code"], "mode": b["mode"], "settings": cfg, "contract": contract, "days_left": days_left,
        "last_run_at": b["last_run_at"], "last_status": b["last_status"], "paper_days": paper_days,
        "paper": {k: float(v) for k, v in paper.items()}, "live": {k: float(v) for k, v in live.items()},
    }


def handle(action, q, event):
    conn = tr.db()
    try:
        h = event.get("headers") or {}
        if not tr.is_admin(conn, h.get("X-User-Id") or h.get("x-user-id")):
            return tr.resp(403, {"error": "Доступ закрыт"})
        cur = conn.cursor()
        try:
            body = json.loads(event.get("body") or "{}")
        except ValueError:
            return tr.resp(400, {"error": "Неверный формат"})
        bid = int(body.get("id") or q.get("id") or 0)

        if action == "bots_meta":
            return tr.resp(200, {"types": schema.public_types(), "assets": [[x[0], x[1]] for x in data.all_assets()]})
        if action == "bots_assets":
            return tr.resp(200, {"assets": data.all_assets()})
        if action == "bots_list":
            cur.execute(f"SELECT * FROM {SCHEMA}.futures_bots ORDER BY id")
            return tr.resp(200, {"items": [_card(cur, b) for b in cur.fetchall()]})
        if action == "bots_save":
            bt = body.get("bot_type")
            if bt not in schema.TYPES:
                return tr.resp(400, {"error": "Неизвестный тип робота"})
            name = (body.get("name") or schema.TYPES[bt]["title"]).strip()[:100]
            asset = str(body.get("asset_code") or "").strip()[:10]
            if not asset:
                return tr.resp(400, {"error": "Выберите актив"})
            if (bt in schema.CRYPTO_TYPES) != data.crypto.is_crypto(asset):
                return tr.resp(400, {"error": "Этот тип робота не подходит для выбранного инструмента"})
            if asset not in {x[0] for x in data.all_assets()}:
                return tr.resp(400, {"error": "Такого фьючерса нет на бирже или по нему нет торгов"})
            cfg = json.dumps(schema.sanitize(bt, body.get("settings") or {}))
            if bid:
                cur.execute(f"UPDATE {SCHEMA}.futures_bots SET name=%s, asset_code=%s, settings=%s WHERE id=%s", (name, asset, cfg, bid))
            else:
                cur.execute(f"INSERT INTO {SCHEMA}.futures_bots (bot_type, name, asset_code, mode, settings) VALUES (%s,%s,%s,'off',%s) RETURNING id",
                            (bt, name, asset, cfg))
                bid = cur.fetchone()["id"]
            conn.commit()
            return tr.resp(200, {"ok": True, "id": bid, "item": _card(cur, _bot(cur, bid))})
        if action == "bots_delete":
            cur.execute(f"DELETE FROM {SCHEMA}.futures_bot_log WHERE bot_id=%s", (bid,))
            cur.execute(f"DELETE FROM {SCHEMA}.robot_signals WHERE bot_id=%s", (bid,))
            cur.execute(f"DELETE FROM {SCHEMA}.futures_bots WHERE id=%s", (bid,))
            conn.commit()
            return tr.resp(200, {"ok": True})
        if action == "bots_mode":
            b = _bot(cur, bid)
            mode = body.get("mode")
            if not b or mode not in ("off", "paper", "live"):
                return tr.resp(400, {"error": "Неверный режим"})
            if mode == "live" and not body.get("confirm"):
                return tr.resp(400, {"error": "Для боевого режима нужно подтверждение"})
            armed = b["armed_at"] if b["armed_at"] else datetime.utcnow()
            cur.execute(f"UPDATE {SCHEMA}.futures_bots SET mode=%s, armed_at=%s WHERE id=%s", (mode, armed, bid))
            eng.add_log(cur, bid, "mode", f"режим изменён: {mode}", dedupe=False)
            conn.commit()
            return tr.resp(200, {"ok": True, "item": _card(cur, _bot(cur, bid))})
        if action == "bots_log":
            cur.execute(f"SELECT id, kind, text, created_at FROM {SCHEMA}.futures_bot_log WHERE bot_id=%s ORDER BY id DESC LIMIT 150", (bid,))
            return tr.resp(200, {"items": cur.fetchall()})
        if action == "bots_backtest":
            b = _bot(cur, bid)
            if not b:
                return tr.resp(404, {"error": "Робот не найден"})
            days = max(5, min(int(q.get("days") or 30), 120 if b["bot_type"] in ("intraday", "news", "abc", "pullback") else 330))
            ov = None
            if q.get("ov"):
                try:
                    ov = json.loads(q["ov"])
                except ValueError:
                    ov = None
            return tr.resp(200, eng.run_backtest(cur, b, days, proven=q.get("proven") == "1", overrides=ov))
        if action == "bots_events":
            cur.execute(f"SELECT id, event_time, title, importance, repeat_weekly, repeat_until FROM {SCHEMA}.futures_news_events ORDER BY event_time DESC LIMIT 200")
            return tr.resp(200, {"items": cur.fetchall()})
        if action == "bots_event_save":
            title = (body.get("title") or "").strip()[:200]
            try:
                when = datetime.strptime(str(body.get("event_time")), "%Y-%m-%dT%H:%M")
            except ValueError:
                return tr.resp(400, {"error": "Укажите дату и время события (МСК)"})
            if not title:
                return tr.resp(400, {"error": "Укажите название события"})
            imp = min(max(int(body.get("importance") or 2), 1), 3)
            until = None
            if body.get("repeat_until"):
                try:
                    until = datetime.strptime(str(body["repeat_until"]), "%Y-%m-%dT%H:%M")
                except ValueError:
                    return tr.resp(400, {"error": "Неверная дата окончания повтора"})
            cur.execute(f"INSERT INTO {SCHEMA}.futures_news_events (event_time, title, importance, repeat_weekly, repeat_until) VALUES (%s,%s,%s,%s,%s)",
                        (when, title, imp, bool(body.get("repeat_weekly")), until))
            conn.commit()
            return tr.resp(200, {"ok": True})
        if action == "bots_event_delete":
            cur.execute(f"DELETE FROM {SCHEMA}.futures_news_events WHERE id=%s", (bid,))
            conn.commit()
            return tr.resp(200, {"ok": True})
        if action == "bots_run":
            b = _bot(cur, bid)
            if not b:
                return tr.resp(404, {"error": "Робот не найден"})
            if b["mode"] == "off":
                return tr.resp(400, {"error": "Робот выключен"})
            return tr.resp(200, eng.run_bot(conn, cur, b, datetime.now(tr.MSK), force=True))
        return tr.resp(400, {"error": "Неизвестное действие"})
    finally:
        conn.close()
