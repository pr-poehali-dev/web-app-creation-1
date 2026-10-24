'''
Управление игровыми комнатами (шахматы/шашки/покер): список, создание, присоединение.
Args: event - dict with httpMethod, body, queryStringParameters, headers (X-Game-Token)
      context - object with attributes: request_id
Returns: HTTP response dict with statusCode, headers, body
'''

import json
import os
import random
import string
import time
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import jwt
import tournaments
import nardy

DATABASE_URL = os.environ.get('DATABASE_URL')
DB_SCHEMA = os.environ.get('DB_SCHEMA', 't_p42562714_web_app_creation_1')
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', '')
JWT_ALGORITHM = 'HS256'
GAME_JWT_ISSUER = 'games-section'

CHESS_INITIAL_STATE = {
    'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
}


def _initial_checkers_board():
    board = [[None] * 8 for _ in range(8)]
    for row in range(3):
        for col in range(8):
            if (row + col) % 2 == 1:
                board[row][col] = 'b'
    for row in range(5, 8):
        for col in range(8):
            if (row + col) % 2 == 1:
                board[row][col] = 'w'
    return board


CHECKERS_INITIAL_STATE = {
    'board': _initial_checkers_board(),
    'must_continue': None
}


def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def get_user_from_token(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    headers = event.get('headers', {}) or {}
    token = headers.get('X-Game-Token') or headers.get('x-game-token')
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get('iss') != GAME_JWT_ISSUER:
            return None
        return {'id': payload['game_user_id'], 'nickname': payload['nickname']}
    except Exception:
        return None


def cors_headers() -> Dict[str, str]:
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Game-Token, X-Admin-Id',
        'Access-Control-Max-Age': '86400'
    }


def error_response(status: int, message: str) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': cors_headers(),
        'body': json.dumps({'error': message}),
        'isBase64Encoded': False
    }


def _sanitize_poker_state(state: Dict[str, Any], viewer_user_id: int) -> Dict[str, Any]:
    """Скрывает карманные карты чужих игроков от текущего зрителя.
    Свои карты видны всегда; чужие — только на шоудауне (last_result уже содержит открытые карты)."""
    sanitized = dict(state)
    players = sanitized.get('players')
    if isinstance(players, dict):
        new_players = {}
        for uid_str, pdata in players.items():
            pdata = dict(pdata)
            if uid_str != str(viewer_user_id):
                pdata.pop('hole_cards', None)
            new_players[uid_str] = pdata
        sanitized['players'] = new_players
    sanitized.pop('deck', None)
    return sanitized


def _sanitize_durak_state(state: Dict[str, Any], viewer_user_id: int) -> Dict[str, Any]:
    """Скрывает колоду и чужие карты: остаются свои карты и количество карт у остальных."""
    sanitized = dict(state)
    hands = sanitized.get('hands')
    if isinstance(hands, dict):
        sanitized['counts'] = {uid: len(h) for uid, h in hands.items()}
        sanitized['hands'] = {uid: h for uid, h in hands.items() if uid == str(viewer_user_id)}
    deadline = sanitized.pop('deadline', None)
    sanitized['turn_left'] = max(0, int(deadline - time.time())) if deadline and sanitized.get('phase') == 'playing' else None
    sanitized.pop('skips', None)
    sanitized['deck_count'] = len(sanitized.pop('deck', []) or [])
    return sanitized


def _sanitize_baarys_state(state: Dict[str, Any], viewer_user_id: int) -> Dict[str, Any]:
    """Скрывает колоду и карты соперника: остаются свои карты и количество карт у соперника."""
    sanitized = dict(state)
    hands = sanitized.get('hands')
    if isinstance(hands, dict):
        sanitized['counts'] = {uid: len(h) for uid, h in hands.items()}
        sanitized['hands'] = {uid: h for uid, h in hands.items() if uid == str(viewer_user_id)}
    deadline = sanitized.pop('deadline', None)
    sanitized['turn_left'] = max(0, int(deadline - time.time())) if deadline and sanitized.get('phase') == 'playing' else None
    sanitized.pop('skips', None)
    sanitized['deck_count'] = len(sanitized.pop('deck', []) or [])
    return sanitized


def initial_state_for(game_type: str) -> Dict[str, Any]:
    if game_type == 'nardy':
        return nardy.initial_state()
    if game_type == 'chess':
        return CHESS_INITIAL_STATE
    if game_type == 'checkers':
        return CHECKERS_INITIAL_STATE
    if game_type == 'poker':
        return {'pot': 0, 'community_cards': [], 'stage': 'waiting', 'deck_seed': None}
    return {}


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': '', 'isBase64Encoded': False}

    if (event.get('queryStringParameters') or {}).get('action') in tournaments.ACTIONS:
        return tournaments.handle(event, context)

    user = get_user_from_token(event)
    if not user:
        return error_response(401, 'Требуется вход в игровой раздел')

    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        game_type = params.get('game_type')

        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                if params.get('my_active'):
                    # Комнаты, где пользователь участвует и партия ещё не завершена —
                    # чтобы лобби могло предложить "вернуться в игру" после случайного выхода.
                    cur.execute(
                        f"""SELECT r.id, r.game_type, r.room_name, r.status, r.max_players,
                               r.created_at, r.updated_at, r.created_by,
                               u.nickname as created_by_nickname,
                               (SELECT COUNT(*) FROM {DB_SCHEMA}.game_room_players WHERE room_id = r.id) as players_count
                           FROM {DB_SCHEMA}.game_rooms r
                           JOIN {DB_SCHEMA}.game_room_players p ON p.room_id = r.id
                           JOIN {DB_SCHEMA}.game_users u ON u.id = r.created_by
                           WHERE p.user_id = %s AND r.status IN ('waiting', 'playing')
                           ORDER BY r.updated_at DESC""",
                        (user['id'],)
                    )
                    active_rooms = cur.fetchall()
                    return {
                        'statusCode': 200,
                        'headers': cors_headers(),
                        'body': json.dumps([dict(r) for r in active_rooms], default=str),
                        'isBase64Encoded': False
                    }

                if params.get('room_id'):
                    cur.execute(
                        f"""SELECT r.*, u.nickname as created_by_nickname
                           FROM {DB_SCHEMA}.game_rooms r
                           JOIN {DB_SCHEMA}.game_users u ON u.id = r.created_by
                           WHERE r.id = %s""",
                        (params['room_id'],)
                    )
                    room = cur.fetchone()
                    if not room:
                        return error_response(404, 'Комната не найдена')

                    cur.execute(
                        f"""SELECT p.*, u.nickname, u.avatar_emoji, u.avatar_url,
                                  COALESCE(p.last_seen_at > NOW() - INTERVAL '10 seconds', FALSE) AS online
                           FROM {DB_SCHEMA}.game_room_players p
                           JOIN {DB_SCHEMA}.game_users u ON u.id = p.user_id
                           WHERE p.room_id = %s ORDER BY p.seat_index""",
                        (params['room_id'],)
                    )
                    players = cur.fetchall()

                    cur.execute(
                        f"UPDATE {DB_SCHEMA}.game_room_players SET last_seen_at = NOW() WHERE room_id = %s AND user_id = %s",
                        (params['room_id'], user['id'])
                    )
                    conn.commit()

                    room_data = dict(room)
                    room_data['players'] = [dict(p) for p in players]

                    if room_data['game_type'] == 'poker' and room_data.get('state'):
                        room_data['state'] = _sanitize_poker_state(room_data['state'], user['id'])
                    if room_data['game_type'] == 'durak' and room_data.get('state'):
                        room_data['state'] = _sanitize_durak_state(room_data['state'], user['id'])
                    if room_data['game_type'] == 'baarys' and room_data.get('state'):
                        room_data['state'] = _sanitize_baarys_state(room_data['state'], user['id'])

                    return {
                        'statusCode': 200,
                        'headers': cors_headers(),
                        'body': json.dumps(room_data, default=str),
                        'isBase64Encoded': False
                    }

                query = f"""SELECT r.id, r.game_type, r.room_name, r.status, r.max_players,
                                  r.is_private, r.created_at, r.created_by, r.invite_code,
                                  u.nickname as created_by_nickname,
                                  (SELECT COUNT(*) FROM {DB_SCHEMA}.game_room_players WHERE room_id = r.id) as players_count
                           FROM {DB_SCHEMA}.game_rooms r
                           JOIN {DB_SCHEMA}.game_users u ON u.id = r.created_by
                           WHERE r.status = 'waiting' AND r.is_private = FALSE"""
                query_params = []
                if game_type:
                    query += " AND r.game_type = %s"
                    query_params.append(game_type)
                query += " ORDER BY r.created_at DESC LIMIT 50"

                cur.execute(query, query_params)
                rooms = cur.fetchall()
                return {
                    'statusCode': 200,
                    'headers': cors_headers(),
                    'body': json.dumps([dict(r) for r in rooms], default=str),
                    'isBase64Encoded': False
                }
        finally:
            conn.close()

    if method == 'POST':
        try:
            body = json.loads(event.get('body', '{}'))
        except (json.JSONDecodeError, TypeError):
            return error_response(400, 'Некорректный запрос')

        action = body.get('action')

        if action == 'create':
            game_type = body.get('game_type')
            if game_type not in ('chess', 'checkers', 'poker', 'durak', 'baarys', 'nardy'):
                return error_response(400, 'Неизвестный тип игры')

            room_name = (body.get('room_name') or f'Комната {user["nickname"]}')[:64]
            is_private = bool(body.get('is_private'))
            max_players = {'poker': 8, 'durak': 6}.get(game_type, 2)
            # Каждая комната получает код приглашения независимо от приватности —
            # им можно поделиться, а публичность влияет лишь на видимость в общем списке.
            invite_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

            conn = get_db_connection()
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        f"""INSERT INTO {DB_SCHEMA}.game_rooms (game_type, room_name, max_players, created_by, state, is_private, invite_code)
                           VALUES (%s, %s, %s, %s, %s, %s, %s)
                           RETURNING id""",
                        (game_type, room_name, max_players, user['id'],
                         json.dumps(initial_state_for(game_type)), is_private, invite_code)
                    )
                    room_id = cur.fetchone()['id']

                    # Создатель играет чёрными, вошедший вторым — белыми и ходит первым
                    side = 'black' if game_type in ('chess', 'checkers') else ('white' if game_type == 'nardy' else 'seat0')
                    chips = 1000 if game_type == 'poker' else None
                    cur.execute(
                        f"""INSERT INTO {DB_SCHEMA}.game_room_players (room_id, user_id, seat_index, side, chips)
                           VALUES (%s, %s, 0, %s, %s)""",
                        (room_id, user['id'], side, chips)
                    )
                    conn.commit()

                    return {
                        'statusCode': 200,
                        'headers': cors_headers(),
                        'body': json.dumps({'success': True, 'room_id': room_id, 'invite_code': invite_code}),
                        'isBase64Encoded': False
                    }
            finally:
                conn.close()

        elif action == 'join':
            room_id = body.get('room_id')
            invite_code = body.get('invite_code')

            conn = get_db_connection()
            try:
                with conn.cursor() as cur:
                    if invite_code:
                        cur.execute(f"SELECT * FROM {DB_SCHEMA}.game_rooms WHERE invite_code = %s", (invite_code,))
                    else:
                        cur.execute(f"SELECT * FROM {DB_SCHEMA}.game_rooms WHERE id = %s", (room_id,))
                    room = cur.fetchone()

                    if not room:
                        return error_response(404, 'Комната не найдена')
                    cur.execute(
                        f"SELECT id FROM {DB_SCHEMA}.game_room_players WHERE room_id = %s AND user_id = %s",
                        (room['id'], user['id'])
                    )
                    if cur.fetchone():
                        return {
                            'statusCode': 200,
                            'headers': cors_headers(),
                            'body': json.dumps({'success': True, 'room_id': room['id']}),
                            'isBase64Encoded': False
                        }

                    if room['status'] != 'waiting':
                        return error_response(400, 'Игра уже началась или завершена')

                    cur.execute(
                        f"SELECT COUNT(*) as cnt FROM {DB_SCHEMA}.game_room_players WHERE room_id = %s",
                        (room['id'],)
                    )
                    count = cur.fetchone()['cnt']
                    if count >= room['max_players']:
                        return error_response(400, 'Комната заполнена')

                    side = None
                    if room['game_type'] == 'nardy':
                        side = 'black'
                    elif room['game_type'] in ('chess', 'checkers'):
                        side = 'white'
                    else:
                        side = f'seat{count}'
                    chips = 1000 if room['game_type'] == 'poker' else None

                    cur.execute(
                        f"""INSERT INTO {DB_SCHEMA}.game_room_players (room_id, user_id, seat_index, side, chips)
                           VALUES (%s, %s, %s, %s, %s)""",
                        (room['id'], user['id'], count, side, chips)
                    )
                    cur.execute(
                        f"INSERT INTO {DB_SCHEMA}.game_chat_messages (room_id, user_id, message, is_system) VALUES (%s, %s, %s, TRUE)",
                        (room['id'], user['id'], f"{user['nickname']} вошёл(а) в комнату"[:500])
                    )

                    new_count = count + 1
                    # Покер собирает до 8 игроков — не запускаем автоматически при 2,
                    # ждём явного старта стола создателем (action 'start_table').
                    if new_count >= 2 and room['game_type'] not in ('poker', 'durak', 'baarys'):
                        cur.execute(
                            f"UPDATE {DB_SCHEMA}.game_rooms SET status = 'playing', current_turn_user_id = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                            (user['id'] if room['game_type'] in ('chess', 'checkers') else room['created_by'], room['id'])
                        )
                    conn.commit()

                    return {
                        'statusCode': 200,
                        'headers': cors_headers(),
                        'body': json.dumps({'success': True, 'room_id': room['id']}),
                        'isBase64Encoded': False
                    }
            finally:
                conn.close()

        elif action == 'rematch':
            room_id = body.get('room_id')
            if not room_id:
                return error_response(400, 'room_id обязателен')

            conn = get_db_connection()
            try:
                with conn.cursor() as cur:
                    cur.execute(f"SELECT * FROM {DB_SCHEMA}.game_rooms WHERE id = %s FOR UPDATE", (room_id,))
                    room = cur.fetchone()
                    if not room:
                        return error_response(404, 'Комната не найдена')
                    if room['status'] != 'finished':
                        return error_response(400, 'Реванш доступен после окончания партии')
                    cur.execute(
                        f"SELECT 1 FROM {DB_SCHEMA}.game_room_players WHERE room_id = %s AND user_id = %s",
                        (room_id, user['id'])
                    )
                    if not cur.fetchone():
                        return error_response(403, 'Вы не участник этой комнаты')

                    new_id = room.get('rematch_room_id')
                    if not new_id:
                        game_type = room['game_type']
                        invite_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
                        cur.execute(
                            f"""INSERT INTO {DB_SCHEMA}.game_rooms (game_type, room_name, max_players, created_by, state, is_private, invite_code)
                               VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                            (game_type, room['room_name'], room['max_players'], user['id'],
                             json.dumps(initial_state_for(game_type)), room['is_private'], invite_code)
                        )
                        new_id = cur.fetchone()['id']
                        side = 'black' if game_type in ('chess', 'checkers') else ('white' if game_type == 'nardy' else 'seat0')
                        chips = 1000 if game_type == 'poker' else None
                        cur.execute(
                            f"""INSERT INTO {DB_SCHEMA}.game_room_players (room_id, user_id, seat_index, side, chips)
                               VALUES (%s, %s, 0, %s, %s)""",
                            (new_id, user['id'], side, chips)
                        )
                        cur.execute(
                            f"UPDATE {DB_SCHEMA}.game_rooms SET rematch_room_id = %s WHERE id = %s",
                            (new_id, room_id)
                        )
                        cur.execute(
                            f"""INSERT INTO {DB_SCHEMA}.game_chat_messages (room_id, user_id, message, created_at, is_system, media_url, media_type)
                               SELECT %s, user_id, message, created_at, is_system, media_url, media_type
                               FROM (SELECT * FROM {DB_SCHEMA}.game_chat_messages WHERE room_id = %s ORDER BY created_at DESC, id DESC LIMIT 200) h
                               ORDER BY created_at ASC, id ASC""",
                            (new_id, room_id)
                        )
                    conn.commit()
                    return {
                        'statusCode': 200,
                        'headers': cors_headers(),
                        'body': json.dumps({'success': True, 'room_id': new_id}),
                        'isBase64Encoded': False
                    }
            finally:
                conn.close()

        elif action == 'start_table':
            room_id = body.get('room_id')
            if not room_id:
                return error_response(400, 'room_id обязателен')

            conn = get_db_connection()
            try:
                with conn.cursor() as cur:
                    cur.execute(f"SELECT * FROM {DB_SCHEMA}.game_rooms WHERE id = %s", (room_id,))
                    room = cur.fetchone()

                    if not room:
                        return error_response(404, 'Комната не найдена')
                    if room['game_type'] != 'poker':
                        return error_response(400, 'Эта команда только для покера')
                    if room['created_by'] != user['id']:
                        return error_response(403, 'Начать стол может только создатель комнаты')
                    if room['status'] != 'waiting':
                        return error_response(400, 'Стол уже запущен')

                    cur.execute(
                        f"SELECT COUNT(*) as cnt FROM {DB_SCHEMA}.game_room_players WHERE room_id = %s",
                        (room_id,)
                    )
                    count = cur.fetchone()['cnt']
                    if count < 2:
                        return error_response(400, 'Нужно минимум 2 игрока для начала')

                    cur.execute(
                        f"UPDATE {DB_SCHEMA}.game_rooms SET status = 'playing', updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                        (room_id,)
                    )
                    conn.commit()

                    return {
                        'statusCode': 200,
                        'headers': cors_headers(),
                        'body': json.dumps({'success': True}),
                        'isBase64Encoded': False
                    }
            finally:
                conn.close()

        elif action == 'delete':
            room_id = body.get('room_id')
            if not room_id:
                return error_response(400, 'room_id обязателен')

            conn = get_db_connection()
            try:
                with conn.cursor() as cur:
                    cur.execute(f"SELECT * FROM {DB_SCHEMA}.game_rooms WHERE id = %s", (room_id,))
                    room = cur.fetchone()

                    if not room:
                        return error_response(404, 'Комната не найдена')
                    if room['created_by'] != user['id']:
                        return error_response(403, 'Удалить комнату может только её создатель')
                    if room['status'] == 'playing':
                        return error_response(400, 'Нельзя удалить комнату во время игры')

                    cur.execute(f"DELETE FROM {DB_SCHEMA}.game_chat_messages WHERE room_id = %s", (room_id,))
                    cur.execute(f"DELETE FROM {DB_SCHEMA}.game_moves WHERE room_id = %s", (room_id,))
                    cur.execute(f"DELETE FROM {DB_SCHEMA}.game_room_players WHERE room_id = %s", (room_id,))
                    cur.execute(f"DELETE FROM {DB_SCHEMA}.game_rooms WHERE id = %s", (room_id,))
                    conn.commit()

                    return {
                        'statusCode': 200,
                        'headers': cors_headers(),
                        'body': json.dumps({'success': True}),
                        'isBase64Encoded': False
                    }
            finally:
                conn.close()

        elif action == 'leave':
            room_id = body.get('room_id')
            if not room_id:
                return error_response(400, 'room_id обязателен')

            conn = get_db_connection()
            try:
                with conn.cursor() as cur:
                    cur.execute(f"SELECT * FROM {DB_SCHEMA}.game_rooms WHERE id = %s", (room_id,))
                    room = cur.fetchone()

                    if not room:
                        return error_response(404, 'Комната не найдена')

                    cur.execute(
                        f"SELECT id FROM {DB_SCHEMA}.game_room_players WHERE room_id = %s AND user_id = %s",
                        (room_id, user['id'])
                    )
                    if not cur.fetchone():
                        return error_response(403, 'Вы не участник этой комнаты')

                    # Партия уже идёт — выход засчитывается как поражение (форфейт),
                    # чтобы оставшиеся игроки не зависли в ожидании вышедшего.
                    if room['status'] == 'playing':
                        if room['game_type'] in ('chess', 'checkers', 'nardy'):
                            cur.execute(
                                f"SELECT user_id FROM {DB_SCHEMA}.game_room_players WHERE room_id = %s AND user_id != %s",
                                (room_id, user['id'])
                            )
                            opponent_row = cur.fetchone()
                            winner_id = opponent_row['user_id'] if opponent_row else None

                            cur.execute(
                                f"UPDATE {DB_SCHEMA}.game_rooms SET status = 'finished', winner_id = %s, "
                                f"updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                                (winner_id, room_id)
                            )
                            if winner_id:
                                cur.execute(
                                    f"UPDATE {DB_SCHEMA}.game_users SET games_played = games_played + 1, "
                                    f"games_won = games_won + 1 WHERE id = %s",
                                    (winner_id,)
                                )
                            cur.execute(
                                f"UPDATE {DB_SCHEMA}.game_users SET games_played = games_played + 1 WHERE id = %s",
                                (user['id'],)
                            )
                            cur.execute(
                                f"DELETE FROM {DB_SCHEMA}.game_room_players WHERE room_id = %s AND user_id = %s",
                                (room_id, user['id'])
                            )
                            conn.commit()
                            return {
                                'statusCode': 200,
                                'headers': cors_headers(),
                                'body': json.dumps({'success': True, 'forfeited': True}),
                                'isBase64Encoded': False
                            }

                        if room['game_type'] == 'baarys':
                            state = room['state'] or {}
                            cur.execute(
                                f"SELECT user_id FROM {DB_SCHEMA}.game_room_players WHERE room_id = %s AND user_id != %s",
                                (room_id, user['id'])
                            )
                            opp = cur.fetchone()
                            winner_id = opp['user_id'] if opp else None
                            state['phase'] = 'finished'
                            state['winner'] = str(winner_id) if winner_id else None
                            state['reason'] = 'left'
                            state['lead'] = []
                            state.setdefault('log', []).append({'t': 'left', 'by': str(user['id'])})
                            cur.execute(
                                f"UPDATE {DB_SCHEMA}.game_rooms SET state = %s, status = 'finished', winner_id = %s, "
                                f"current_turn_user_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                                (json.dumps(state), winner_id, room_id)
                            )
                            cur.execute(
                                f"UPDATE {DB_SCHEMA}.game_users SET games_played = games_played + 1 WHERE id = %s",
                                (user['id'],)
                            )
                            if winner_id:
                                cur.execute(
                                    f"UPDATE {DB_SCHEMA}.game_users SET games_played = games_played + 1, "
                                    f"games_won = games_won + 1 WHERE id = %s",
                                    (winner_id,)
                            )
                            conn.commit()
                            return {
                                'statusCode': 200,
                                'headers': cors_headers(),
                                'body': json.dumps({'success': True, 'forfeited': True}),
                                'isBase64Encoded': False
                            }

                        if room['game_type'] == 'durak':
                            state = room['state'] or {}
                            cur.execute(
                                f"SELECT user_id FROM {DB_SCHEMA}.game_room_players WHERE room_id = %s",
                                (room_id,)
                            )
                            all_ids = [r['user_id'] for r in cur.fetchall()]
                            state['phase'] = 'finished'
                            state['loser'] = str(user['id'])
                            state['table'] = []
                            state['taking'] = False
                            state.setdefault('log', []).append({'t': 'left', 'by': str(user['id'])})
                            cur.execute(
                                f"UPDATE {DB_SCHEMA}.game_rooms SET state = %s, status = 'finished', winner_id = NULL, "
                                f"current_turn_user_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                                (json.dumps(state), room_id)
                            )
                            cur.execute(
                                f"UPDATE {DB_SCHEMA}.game_users SET games_played = games_played + 1 WHERE id = ANY(%s)",
                                (all_ids,)
                            )
                            winners = [i for i in all_ids if i != user['id']]
                            if winners:
                                cur.execute(
                                    f"UPDATE {DB_SCHEMA}.game_users SET games_won = games_won + 1 WHERE id = ANY(%s)",
                                    (winners,)
                                )
                            conn.commit()
                            return {
                                'statusCode': 200,
                                'headers': cors_headers(),
                                'body': json.dumps({'success': True, 'forfeited': True}),
                                'isBase64Encoded': False
                            }

                        # poker: игрок встаёт из-за стола — сбрасывает текущую раздачу (если участвует)
                        # и передаёт ход дальше, если ходить должен был именно он
                        cur.execute(
                            f"SELECT user_id, chips, seat_index FROM {DB_SCHEMA}.game_room_players "
                            f"WHERE room_id = %s ORDER BY seat_index",
                            (room_id,)
                        )
                        seats = cur.fetchall()
                        state = room['state'] or {}
                        players_state = state.get('players') if isinstance(state.get('players'), dict) else None
                        my_uid = str(user['id'])

                        if players_state and my_uid in players_state:
                            players_state[my_uid]['folded'] = True
                            players_state[my_uid]['has_acted'] = True

                        was_my_turn = room['current_turn_user_id'] == user['id']

                        cur.execute(
                            f"DELETE FROM {DB_SCHEMA}.game_room_players WHERE room_id = %s AND user_id = %s",
                            (room_id, user['id'])
                        )

                        remaining_seats = [s for s in seats if s['user_id'] != user['id']]

                        if len(remaining_seats) <= 1:
                            winner_id = remaining_seats[0]['user_id'] if remaining_seats else None
                            cur.execute(
                                f"UPDATE {DB_SCHEMA}.game_rooms SET status = 'finished', winner_id = %s, "
                                f"state = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                                (winner_id, json.dumps(state), room_id)
                            )
                            if winner_id:
                                cur.execute(
                                    f"UPDATE {DB_SCHEMA}.game_users SET games_played = games_played + 1, "
                                    f"games_won = games_won + 1 WHERE id = %s",
                                    (winner_id,)
                                )
                            cur.execute(
                                f"UPDATE {DB_SCHEMA}.game_users SET games_played = games_played + 1 WHERE id = %s",
                                (user['id'],)
                            )
                        else:
                            next_turn_user_id = room['current_turn_user_id']
                            if was_my_turn:
                                order = [s['user_id'] for s in remaining_seats]
                                next_turn_user_id = order[0] if order else None
                            cur.execute(
                                f"UPDATE {DB_SCHEMA}.game_rooms SET state = %s, current_turn_user_id = %s, "
                                f"updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                                (json.dumps(state), next_turn_user_id, room_id)
                            )

                        conn.commit()
                        return {
                            'statusCode': 200,
                            'headers': cors_headers(),
                            'body': json.dumps({'success': True, 'forfeited': True}),
                            'isBase64Encoded': False
                        }

                    cur.execute(
                        f"DELETE FROM {DB_SCHEMA}.game_room_players WHERE room_id = %s AND user_id = %s",
                        (room_id, user['id'])
                    )

                    cur.execute(
                        f"SELECT COUNT(*) as cnt FROM {DB_SCHEMA}.game_room_players WHERE room_id = %s",
                        (room_id,)
                    )
                    remaining = cur.fetchone()['cnt']

                    if remaining == 0:
                        cur.execute(f"DELETE FROM {DB_SCHEMA}.game_chat_messages WHERE room_id = %s", (room_id,))
                        cur.execute(f"DELETE FROM {DB_SCHEMA}.game_moves WHERE room_id = %s", (room_id,))
                        cur.execute(f"DELETE FROM {DB_SCHEMA}.game_rooms WHERE id = %s", (room_id,))

                    conn.commit()

                    return {
                        'statusCode': 200,
                        'headers': cors_headers(),
                        'body': json.dumps({'success': True, 'room_deleted': remaining == 0}),
                        'isBase64Encoded': False
                    }
            finally:
                conn.close()

        return error_response(400, 'Неизвестное действие')

    return error_response(405, 'Method not allowed')