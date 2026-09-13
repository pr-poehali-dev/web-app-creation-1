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
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import jwt

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
        'Access-Control-Allow-Headers': 'Content-Type, X-Game-Token',
        'Access-Control-Max-Age': '86400'
    }


def error_response(status: int, message: str) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': cors_headers(),
        'body': json.dumps({'error': message}),
        'isBase64Encoded': False
    }


def initial_state_for(game_type: str) -> Dict[str, Any]:
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

    user = get_user_from_token(event)
    if not user:
        return error_response(401, 'Требуется вход в игровой раздел')

    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        game_type = params.get('game_type')

        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
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
                        f"""SELECT p.*, u.nickname, u.avatar_emoji
                           FROM {DB_SCHEMA}.game_room_players p
                           JOIN {DB_SCHEMA}.game_users u ON u.id = p.user_id
                           WHERE p.room_id = %s ORDER BY p.seat_index""",
                        (params['room_id'],)
                    )
                    players = cur.fetchall()

                    room_data = dict(room)
                    room_data['players'] = [dict(p) for p in players]
                    return {
                        'statusCode': 200,
                        'headers': cors_headers(),
                        'body': json.dumps(room_data, default=str),
                        'isBase64Encoded': False
                    }

                query = f"""SELECT r.id, r.game_type, r.room_name, r.status, r.max_players,
                                  r.is_private, r.created_at, u.nickname as created_by_nickname,
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
            if game_type not in ('chess', 'checkers', 'poker'):
                return error_response(400, 'Неизвестный тип игры')

            room_name = (body.get('room_name') or f'Комната {user["nickname"]}')[:64]
            is_private = bool(body.get('is_private'))
            max_players = 8 if game_type == 'poker' else 2
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

                    side = 'white' if game_type in ('chess', 'checkers') else 'seat0'
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
                    if room['status'] != 'waiting':
                        return error_response(400, 'Игра уже началась или завершена')

                    cur.execute(
                        f"SELECT COUNT(*) as cnt FROM {DB_SCHEMA}.game_room_players WHERE room_id = %s",
                        (room['id'],)
                    )
                    count = cur.fetchone()['cnt']
                    if count >= room['max_players']:
                        return error_response(400, 'Комната заполнена')

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

                    side = None
                    if room['game_type'] in ('chess', 'checkers'):
                        side = 'black'
                    else:
                        side = f'seat{count}'
                    chips = 1000 if room['game_type'] == 'poker' else None

                    cur.execute(
                        f"""INSERT INTO {DB_SCHEMA}.game_room_players (room_id, user_id, seat_index, side, chips)
                           VALUES (%s, %s, %s, %s, %s)""",
                        (room['id'], user['id'], count, side, chips)
                    )

                    new_count = count + 1
                    if new_count >= 2:
                        cur.execute(
                            f"UPDATE {DB_SCHEMA}.game_rooms SET status = 'playing', current_turn_user_id = created_by, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                            (room['id'],)
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

        return error_response(400, 'Неизвестное действие')

    return error_response(405, 'Method not allowed')