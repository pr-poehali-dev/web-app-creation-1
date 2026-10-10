'''
Мониторинг игровых комнат (для админов) и турниры (шахматы/шашки, олимпийская система).
Админ: заголовок X-Admin-Id. Игрок: заголовок X-Game-Token.
Args: event - dict with httpMethod, body, queryStringParameters, headers
Returns: HTTP response dict
'''
import json
import os
import random
import urllib.request
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import jwt

DATABASE_URL = os.environ.get('DATABASE_URL')
S = os.environ.get('DB_SCHEMA', 't_p42562714_web_app_creation_1')
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', '')
GAME_JWT_ISSUER = 'games-section'
PUSH_SEND_URL = 'https://functions.poehali.dev/a1c8fafd-b64f-45e5-b9b9-0a050cca4f7a'
PENDING_PUSH = []
TOURNEY_GAMES = ('chess', 'checkers')
ACTIONS = ('monitor', 'room_detail', 'close_room', 'sync', 'admin_tournaments', 'admin_tournament',
           'create_tournament', 'start_tournament', 'cancel_tournament',
           'tournaments', 'tournament', 'join_tournament', 'leave_tournament')


def conn_():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def hdrs():
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Game-Token, X-Admin-Id',
        'Access-Control-Max-Age': '86400'
    }


def ok(data, status=200):
    return {'statusCode': status, 'headers': hdrs(), 'body': json.dumps(data, default=str), 'isBase64Encoded': False}


def err(status, msg):
    return ok({'error': msg}, status)


def header(event, name):
    h = event.get('headers') or {}
    for k, v in h.items():
        if k.lower() == name.lower():
            return v
    return None


def game_user(event) -> Optional[Dict[str, Any]]:
    token = header(event, 'X-Game-Token')
    if not token:
        return None
    try:
        p = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        if p.get('iss') != GAME_JWT_ISSUER:
            return None
        return {'id': p['game_user_id'], 'nickname': p['nickname']}
    except Exception:
        return None


def is_admin(cur, event) -> Optional[int]:
    aid = header(event, 'X-Admin-Id')
    if not aid or not str(aid).isdigit():
        return None
    cur.execute("SELECT id, role FROM t_p42562714_web_app_creation_1.users WHERE id = %s AND removed_at IS NULL", (int(aid),))
    u = cur.fetchone()
    if u and u['role'] in ('admin', 'superadmin', 'moderator'):
        return u['id']
    return None


def initial_state(game_type):
    if game_type == 'chess':
        return {'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'}
    board = [[None] * 8 for _ in range(8)]
    for r in range(3):
        for c in range(8):
            if (r + c) % 2 == 1:
                board[r][c] = 'b'
    for r in range(5, 8):
        for c in range(8):
            if (r + c) % 2 == 1:
                board[r][c] = 'w'
    return {'board': board, 'must_continue': None}


# ---------- Турнирная логика ----------

def create_match_room(cur, t, rnd, p1, p2):
    name = f"Турнир «{t['name']}» · раунд {rnd}"[:64]
    cur.execute(
        f"""INSERT INTO {S}.game_rooms (game_type, room_name, status, max_players, created_by, state,
              current_turn_user_id, is_private) VALUES (%s,%s,'playing',2,%s,%s,%s,TRUE) RETURNING id""",
        (t['game_type'], name, p2, json.dumps(initial_state(t['game_type'])), p1))
    rid = cur.fetchone()['id']
    cur.execute(f"INSERT INTO {S}.game_room_players (room_id,user_id,seat_index,side) VALUES (%s,%s,0,'white'),(%s,%s,1,'black')",
                (rid, p1, rid, p2))
    PENDING_PUSH.append((t['name'], rnd, rid, p1, p2))
    return rid


def flush_push():
    '''Отправляет push обоим игрокам о начале турнирной партии. Ошибки отправки игнорируются.'''
    items = list(PENDING_PUSH)
    PENDING_PUSH.clear()
    for name, rnd, rid, p1, p2 in items:
        for uid, opp in ((p1, p2), (p2, p1)):
            try:
                req = urllib.request.Request(
                    PUSH_SEND_URL,
                    data=json.dumps({
                        'userId': f'game_{uid}',
                        'title': '🏆 Ваша турнирная партия',
                        'message': f'«{name}», раунд {rnd}: соперник найден, заходите играть',
                        'url': f'/games/room/{rid}',
                        'type': 'game_turn',
                    }).encode(),
                    headers={'Content-Type': 'application/json'},
                )
                urllib.request.urlopen(req, timeout=3)
            except Exception:
                pass


def make_round(cur, t, rnd, player_ids):
    ids = list(player_ids)
    if rnd == 1:
        random.shuffle(ids)
    idx = 0
    for i in range(0, len(ids), 2):
        p1 = ids[i]
        p2 = ids[i + 1] if i + 1 < len(ids) else None
        if p2 is None:
            cur.execute(f"""INSERT INTO {S}.game_tournament_matches (tournament_id,round,match_index,player1_id,winner_id,status)
                            VALUES (%s,%s,%s,%s,%s,'finished')""", (t['id'], rnd, idx, p1, p1))
        else:
            rid = create_match_room(cur, t, rnd, p1, p2)
            cur.execute(f"""INSERT INTO {S}.game_tournament_matches (tournament_id,round,match_index,player1_id,player2_id,room_id,status)
                            VALUES (%s,%s,%s,%s,%s,%s,'playing')""", (t['id'], rnd, idx, p1, p2, rid))
        idx += 1
    cur.execute(f"UPDATE {S}.game_tournaments SET current_round=%s WHERE id=%s", (rnd, t['id']))


def sync_tournament(cur, tid):
    cur.execute(f"SELECT * FROM {S}.game_tournaments WHERE id=%s FOR UPDATE", (tid,))
    t = cur.fetchone()
    if not t or t['status'] != 'active':
        return
    for _ in range(10):
        cur.execute(f"""SELECT m.*, r.status AS room_status, r.winner_id AS room_winner FROM {S}.game_tournament_matches m
                        LEFT JOIN {S}.game_rooms r ON r.id = m.room_id
                        WHERE m.tournament_id=%s AND m.round=%s ORDER BY m.match_index""", (tid, t['current_round']))
        matches = cur.fetchall()
        for m in matches:
            if m['status'] != 'playing' or m['room_status'] != 'finished':
                continue
            if m['room_winner']:
                w = m['room_winner']
                loser = m['player2_id'] if w == m['player1_id'] else m['player1_id']
                cur.execute(f"UPDATE {S}.game_tournament_matches SET winner_id=%s, status='finished' WHERE id=%s", (w, m['id']))
                cur.execute(f"UPDATE {S}.game_tournament_players SET eliminated=TRUE WHERE tournament_id=%s AND user_id=%s", (tid, loser))
                m['status'] = 'finished'
                m['winner_id'] = w
            else:
                # ничья — переигровка
                rid = create_match_room(cur, t, t['current_round'], m['player1_id'], m['player2_id'])
                cur.execute(f"UPDATE {S}.game_tournament_matches SET room_id=%s WHERE id=%s", (rid, m['id']))
        if any(m['status'] != 'finished' for m in matches):
            return
        winners = [m['winner_id'] for m in matches]
        if len(winners) == 1:
            w = winners[0]
            cur.execute(f"UPDATE {S}.game_tournaments SET status='finished', winner_id=%s, finished_at=CURRENT_TIMESTAMP WHERE id=%s", (w, tid))
            cur.execute(f"UPDATE {S}.game_users SET chips_balance = chips_balance + %s WHERE id=%s", (t['prize_pool'], w))
            return
        t['current_round'] += 1
        make_round(cur, t, t['current_round'], winners)


def tournament_view(cur, tid, viewer=None):
    cur.execute(f"""SELECT t.*, w.nickname AS winner_nickname,
                      (SELECT COUNT(*) FROM {S}.game_tournament_players WHERE tournament_id=t.id) AS players_count
                    FROM {S}.game_tournaments t LEFT JOIN {S}.game_users w ON w.id=t.winner_id WHERE t.id=%s""", (tid,))
    t = cur.fetchone()
    if not t:
        return None
    cur.execute(f"""SELECT p.user_id, p.eliminated, p.fee_paid, u.nickname, u.avatar_emoji FROM {S}.game_tournament_players p
                    JOIN {S}.game_users u ON u.id=p.user_id WHERE p.tournament_id=%s ORDER BY p.joined_at""", (tid,))
    t['players'] = cur.fetchall()
    cur.execute(f"""SELECT m.id, m.round, m.match_index, m.player1_id, m.player2_id, m.room_id, m.winner_id, m.status,
                      u1.nickname AS p1_nickname, u2.nickname AS p2_nickname
                    FROM {S}.game_tournament_matches m
                    LEFT JOIN {S}.game_users u1 ON u1.id=m.player1_id LEFT JOIN {S}.game_users u2 ON u2.id=m.player2_id
                    WHERE m.tournament_id=%s ORDER BY m.round, m.match_index""", (tid,))
    t['matches'] = cur.fetchall()
    t['joined'] = bool(viewer) and any(p['user_id'] == viewer for p in t['players'])
    return t


def refund_all(cur, tid):
    cur.execute(f"SELECT user_id, fee_paid FROM {S}.game_tournament_players WHERE tournament_id=%s", (tid,))
    for p in cur.fetchall():
        if p['fee_paid']:
            cur.execute(f"UPDATE {S}.game_users SET chips_balance = chips_balance + %s WHERE id=%s", (p['fee_paid'], p['user_id']))
    cur.execute(f"UPDATE {S}.game_tournament_players SET fee_paid=0 WHERE tournament_id=%s", (tid,))
    cur.execute(f"UPDATE {S}.game_tournaments SET prize_pool=0 WHERE id=%s", (tid,))


def sync_all_active(cur):
    cur.execute(f"SELECT id FROM {S}.game_tournaments WHERE status='active'")
    for r in cur.fetchall():
        sync_tournament(cur, r['id'])


# ---------- Handler ----------

def handle(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': hdrs(), 'body': '', 'isBase64Encoded': False}
    params = event.get('queryStringParameters') or {}
    body = {}
    if method == 'POST':
        try:
            body = json.loads(event.get('body') or '{}')
        except Exception:
            return err(400, 'Некорректный JSON')
    action = params.get('action') or body.get('action') or ''

    PENDING_PUSH.clear()
    conn = conn_()
    try:
        with conn.cursor() as cur:
            admin_id = is_admin(cur, event)
            gu = game_user(event)

            # ---- Админские действия ----
            if action in ('monitor', 'room_detail', 'close_room', 'admin_tournaments', 'admin_tournament',
                          'create_tournament', 'start_tournament', 'cancel_tournament', 'sync'):
                if not admin_id:
                    return err(403, 'Доступ только для администраторов')

                if action == 'monitor':
                    status = params.get('status') or 'live'
                    gt = params.get('game_type')
                    where = ["1=1"]
                    qp = []
                    if status == 'live':
                        where.append("r.status IN ('waiting','playing')")
                    elif status in ('waiting', 'playing', 'finished'):
                        where.append("r.status = %s")
                        qp.append(status)
                    if gt in ('chess', 'checkers', 'poker'):
                        where.append("r.game_type = %s")
                        qp.append(gt)
                    cur.execute(f"""SELECT r.id, r.game_type, r.room_name, r.status, r.max_players, r.is_private, r.created_at, r.updated_at,
                                      r.winner_id, r.current_turn_user_id,
                                      (SELECT COUNT(*) FROM {S}.game_moves WHERE room_id=r.id) AS moves_count,
                                      (SELECT COUNT(*) FROM {S}.game_chat_messages WHERE room_id=r.id) AS chat_count,
                                      (SELECT COALESCE(json_agg(json_build_object('user_id',u.id,'nickname',u.nickname,'avatar',u.avatar_emoji,'side',p.side,'chips',p.chips)
                                         ORDER BY p.seat_index),'[]'::json)
                                         FROM {S}.game_room_players p JOIN {S}.game_users u ON u.id=p.user_id WHERE p.room_id=r.id) AS players,
                                      (SELECT tm.tournament_id FROM {S}.game_tournament_matches tm WHERE tm.room_id=r.id LIMIT 1) AS tournament_id
                                    FROM {S}.game_rooms r WHERE {' AND '.join(where)}
                                    ORDER BY r.updated_at DESC LIMIT 200""", qp)
                    rooms = cur.fetchall()
                    cur.execute(f"""SELECT
                        (SELECT COUNT(*) FROM {S}.game_rooms WHERE status='playing') AS playing,
                        (SELECT COUNT(*) FROM {S}.game_rooms WHERE status='waiting') AS waiting,
                        (SELECT COUNT(*) FROM {S}.game_rooms WHERE status='finished' AND updated_at > NOW() - INTERVAL '24 hours') AS finished_24h,
                        (SELECT COUNT(*) FROM {S}.game_users) AS total_players,
                        (SELECT COUNT(DISTINCT p.user_id) FROM {S}.game_room_players p JOIN {S}.game_rooms r ON r.id=p.room_id
                           WHERE r.status IN ('waiting','playing')) AS players_in_rooms,
                        (SELECT COUNT(*) FROM {S}.game_users WHERE last_login_at > NOW() - INTERVAL '15 minutes') AS online_recent""")
                    stats = cur.fetchone()
                    cur.execute(f"""SELECT id, nickname, avatar_emoji, games_played, games_won, chips_balance, last_login_at
                                    FROM {S}.game_users ORDER BY last_login_at DESC NULLS LAST LIMIT 30""")
                    return ok({'rooms': rooms, 'stats': stats, 'recent_players': cur.fetchall()})

                if action == 'room_detail':
                    rid = params.get('room_id')
                    cur.execute(f"SELECT * FROM {S}.game_rooms WHERE id=%s", (rid,))
                    room = cur.fetchone()
                    if not room:
                        return err(404, 'Комната не найдена')
                    if room['game_type'] == 'poker' and isinstance(room.get('state'), dict):
                        room['state'].pop('deck', None)  # админ видит карты игроков, колоду скрываем
                    cur.execute(f"""SELECT p.user_id, p.side, p.chips, u.nickname, u.avatar_emoji FROM {S}.game_room_players p
                                    JOIN {S}.game_users u ON u.id=p.user_id WHERE p.room_id=%s ORDER BY p.seat_index""", (rid,))
                    room['players'] = cur.fetchall()
                    cur.execute(f"""SELECT m.move_number, m.move_data, m.created_at, u.nickname FROM {S}.game_moves m
                                    JOIN {S}.game_users u ON u.id=m.user_id WHERE m.room_id=%s ORDER BY m.move_number DESC LIMIT 50""", (rid,))
                    room['moves'] = cur.fetchall()
                    cur.execute(f"""SELECT c.message, c.created_at, u.nickname FROM {S}.game_chat_messages c
                                    JOIN {S}.game_users u ON u.id=c.user_id WHERE c.room_id=%s ORDER BY c.created_at DESC LIMIT 50""", (rid,))
                    room['chat'] = cur.fetchall()
                    return ok(room)

                if action == 'close_room':
                    cur.execute(f"UPDATE {S}.game_rooms SET status='finished', updated_at=CURRENT_TIMESTAMP WHERE id=%s AND status!='finished' RETURNING id",
                                (body.get('room_id'),))
                    done = cur.fetchone()
                    conn.commit()
                    return ok({'success': bool(done)})

                if action == 'sync':
                    sync_all_active(cur)
                    conn.commit()
                    return ok({'success': True})

                if action == 'admin_tournaments':
                    sync_all_active(cur)
                    conn.commit()
                    cur.execute(f"""SELECT t.*, w.nickname AS winner_nickname,
                                      (SELECT COUNT(*) FROM {S}.game_tournament_players WHERE tournament_id=t.id) AS players_count
                                    FROM {S}.game_tournaments t LEFT JOIN {S}.game_users w ON w.id=t.winner_id ORDER BY t.id DESC LIMIT 100""")
                    return ok({'tournaments': cur.fetchall()})

                if action == 'admin_tournament':
                    sync_all_active(cur)
                    conn.commit()
                    t = tournament_view(cur, params.get('tournament_id'))
                    return ok(t) if t else err(404, 'Турнир не найден')

                if action == 'create_tournament':
                    name = (body.get('name') or '').strip()[:100]
                    gt = body.get('game_type')
                    if not name:
                        return err(400, 'Укажите название')
                    if gt not in TOURNEY_GAMES:
                        return err(400, 'Турниры доступны для шахмат и шашек')
                    try:
                        mn = max(2, int(body.get('min_players', 4)))
                        mx = min(64, int(body.get('max_players', 16)))
                        fee = max(0, int(body.get('entry_fee', 0)))
                    except Exception:
                        return err(400, 'Некорректные числа')
                    if mx < mn:
                        return err(400, 'Максимум игроков меньше минимума')
                    cur.execute(f"""INSERT INTO {S}.game_tournaments (name, description, game_type, min_players, max_players, entry_fee, starts_at, created_by)
                                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                                (name, (body.get('description') or '')[:1000], gt, mn, mx, fee, body.get('starts_at') or None, admin_id))
                    tid = cur.fetchone()['id']
                    conn.commit()
                    return ok({'success': True, 'id': tid})

                if action == 'start_tournament':
                    tid = body.get('tournament_id')
                    cur.execute(f"SELECT * FROM {S}.game_tournaments WHERE id=%s FOR UPDATE", (tid,))
                    t = cur.fetchone()
                    if not t:
                        return err(404, 'Турнир не найден')
                    if t['status'] != 'registration':
                        return err(400, 'Турнир уже запущен или завершён')
                    cur.execute(f"SELECT user_id FROM {S}.game_tournament_players WHERE tournament_id=%s", (tid,))
                    ids = [r['user_id'] for r in cur.fetchall()]
                    if len(ids) < t['min_players']:
                        return err(400, f"Мало участников: {len(ids)} из минимум {t['min_players']}")
                    cur.execute(f"UPDATE {S}.game_tournaments SET status='active' WHERE id=%s", (tid,))
                    make_round(cur, t, 1, ids)
                    t['current_round'] = 1
                    sync_tournament(cur, tid)
                    conn.commit()
                    return ok({'success': True})

                if action == 'cancel_tournament':
                    tid = body.get('tournament_id')
                    cur.execute(f"SELECT * FROM {S}.game_tournaments WHERE id=%s FOR UPDATE", (tid,))
                    t = cur.fetchone()
                    if not t or t['status'] in ('finished', 'cancelled'):
                        return err(400, 'Турнир нельзя отменить')
                    refund_all(cur, tid)
                    cur.execute(f"""UPDATE {S}.game_rooms SET status='finished', updated_at=CURRENT_TIMESTAMP
                                    WHERE status!='finished' AND id IN (SELECT room_id FROM {S}.game_tournament_matches WHERE tournament_id=%s AND room_id IS NOT NULL)""", (tid,))
                    cur.execute(f"UPDATE {S}.game_tournaments SET status='cancelled', finished_at=CURRENT_TIMESTAMP WHERE id=%s", (tid,))
                    conn.commit()
                    return ok({'success': True})

            # ---- Действия игроков ----
            if action in ('tournaments', 'tournament', 'join_tournament', 'leave_tournament'):
                if not gu:
                    return err(401, 'Требуется вход в игровой раздел')

                if action == 'tournaments':
                    sync_all_active(cur)
                    conn.commit()
                    cur.execute(f"""SELECT t.id, t.name, t.description, t.game_type, t.status, t.min_players, t.max_players, t.entry_fee,
                                      t.prize_pool, t.starts_at, t.current_round, w.nickname AS winner_nickname,
                                      (SELECT COUNT(*) FROM {S}.game_tournament_players WHERE tournament_id=t.id) AS players_count,
                                      EXISTS(SELECT 1 FROM {S}.game_tournament_players WHERE tournament_id=t.id AND user_id=%s) AS joined
                                    FROM {S}.game_tournaments t LEFT JOIN {S}.game_users w ON w.id=t.winner_id
                                    WHERE t.status != 'cancelled' ORDER BY (t.status='registration') DESC, (t.status='active') DESC, t.id DESC LIMIT 50""",
                                (gu['id'],))
                    return ok({'tournaments': cur.fetchall()})

                if action == 'tournament':
                    sync_all_active(cur)
                    conn.commit()
                    t = tournament_view(cur, params.get('tournament_id'), gu['id'])
                    return ok(t) if t else err(404, 'Турнир не найден')

                if action == 'join_tournament':
                    tid = body.get('tournament_id')
                    cur.execute(f"SELECT * FROM {S}.game_tournaments WHERE id=%s FOR UPDATE", (tid,))
                    t = cur.fetchone()
                    if not t:
                        return err(404, 'Турнир не найден')
                    if t['status'] != 'registration':
                        return err(400, 'Регистрация закрыта')
                    cur.execute(f"SELECT COUNT(*) AS c FROM {S}.game_tournament_players WHERE tournament_id=%s", (tid,))
                    if cur.fetchone()['c'] >= t['max_players']:
                        return err(400, 'Все места заняты')
                    cur.execute(f"SELECT 1 FROM {S}.game_tournament_players WHERE tournament_id=%s AND user_id=%s", (tid, gu['id']))
                    if cur.fetchone():
                        return err(400, 'Вы уже участвуете')
                    fee = t['entry_fee']
                    if fee:
                        cur.execute(f"UPDATE {S}.game_users SET chips_balance = chips_balance - %s WHERE id=%s AND chips_balance >= %s RETURNING id",
                                    (fee, gu['id'], fee))
                        if not cur.fetchone():
                            return err(400, 'Недостаточно фишек для взноса')
                    cur.execute(f"INSERT INTO {S}.game_tournament_players (tournament_id,user_id,fee_paid) VALUES (%s,%s,%s)", (tid, gu['id'], fee))
                    cur.execute(f"UPDATE {S}.game_tournaments SET prize_pool = prize_pool + %s WHERE id=%s", (fee, tid))
                    conn.commit()
                    return ok({'success': True})

                if action == 'leave_tournament':
                    tid = body.get('tournament_id')
                    cur.execute(f"SELECT * FROM {S}.game_tournaments WHERE id=%s FOR UPDATE", (tid,))
                    t = cur.fetchone()
                    if not t or t['status'] != 'registration':
                        return err(400, 'Выйти можно только до начала турнира')
                    cur.execute(f"DELETE FROM {S}.game_tournament_players WHERE tournament_id=%s AND user_id=%s RETURNING fee_paid", (tid, gu['id']))
                    row = cur.fetchone()
                    if row and row['fee_paid']:
                        cur.execute(f"UPDATE {S}.game_users SET chips_balance = chips_balance + %s WHERE id=%s", (row['fee_paid'], gu['id']))
                        cur.execute(f"UPDATE {S}.game_tournaments SET prize_pool = prize_pool - %s WHERE id=%s", (row['fee_paid'], tid))
                    conn.commit()
                    return ok({'success': True})

            return err(400, 'Неизвестное действие')
    except Exception as e:
        conn.rollback()
        PENDING_PUSH.clear()
        return err(500, f'Ошибка сервера: {e}')
    finally:
        conn.close()
        flush_push()
