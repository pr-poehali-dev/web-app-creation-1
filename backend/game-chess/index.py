'''
Логика ходов в шахматы: валидация каждого хода на сервере (python-chess),
обновление состояния партии (FEN), определение шаха/мата/ничьей.
Args: event - dict with httpMethod, body, headers (X-Game-Token)
      context - object with attributes: request_id
Returns: HTTP response dict with statusCode, headers, body
'''

import json
import os
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import jwt
import chess

DATABASE_URL = os.environ.get('DATABASE_URL')
DB_SCHEMA = os.environ.get('DB_SCHEMA', 'public')
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', '')
JWT_ALGORITHM = 'HS256'
GAME_JWT_ISSUER = 'games-section'


def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    with conn.cursor() as cur:
        cur.execute(f"SET search_path TO {DB_SCHEMA}")
    return conn


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


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': '', 'isBase64Encoded': False}

    user = get_user_from_token(event)
    if not user:
        return error_response(401, 'Требуется вход в игровой раздел')

    if method != 'POST':
        return error_response(405, 'Method not allowed')

    try:
        body = json.loads(event.get('body', '{}'))
    except (json.JSONDecodeError, TypeError):
        return error_response(400, 'Некорректный запрос')

    room_id = body.get('room_id')
    move_uci = body.get('move')

    if not room_id or not move_uci:
        return error_response(400, 'room_id и move обязательны')

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM game_rooms WHERE id = %s", (room_id,))
            room = cur.fetchone()

            if not room:
                return error_response(404, 'Комната не найдена')
            if room['game_type'] != 'chess':
                return error_response(400, 'Эта комната не для шахмат')
            if room['status'] != 'playing':
                return error_response(400, 'Игра ещё не началась или уже завершена')
            if room['current_turn_user_id'] != user['id']:
                return error_response(400, 'Сейчас не ваш ход')

            cur.execute(
                "SELECT side FROM game_room_players WHERE room_id = %s AND user_id = %s",
                (room_id, user['id'])
            )
            player = cur.fetchone()
            if not player:
                return error_response(403, 'Вы не участник этой партии')

            state = room['state']
            fen = state.get('fen', chess.STARTING_FEN)
            board = chess.Board(fen)

            expected_color = chess.WHITE if player['side'] == 'white' else chess.BLACK
            if board.turn != expected_color:
                return error_response(400, 'Сейчас не ваш ход')

            try:
                move = chess.Move.from_uci(move_uci)
            except ValueError:
                return error_response(400, 'Некорректный формат хода')

            if move not in board.legal_moves:
                return error_response(400, 'Недопустимый ход по правилам шахмат')

            board.push(move)
            new_fen = board.fen()

            is_checkmate = board.is_checkmate()
            is_stalemate = board.is_stalemate()
            is_draw = board.is_insufficient_material() or board.can_claim_draw()
            is_check = board.is_check()

            cur.execute(
                "SELECT COALESCE(MAX(move_number), 0) + 1 as next_num FROM game_moves WHERE room_id = %s",
                (room_id,)
            )
            move_number = cur.fetchone()['next_num']

            cur.execute(
                """INSERT INTO game_moves (room_id, user_id, move_number, move_data)
                   VALUES (%s, %s, %s, %s)""",
                (room_id, user['id'], move_number, json.dumps({'uci': move_uci, 'fen_after': new_fen}))
            )

            new_state = dict(state)
            new_state['fen'] = new_fen
            new_state['last_move'] = move_uci
            new_state['is_check'] = is_check

            game_over = is_checkmate or is_stalemate or is_draw
            new_status = 'finished' if game_over else 'playing'
            winner_id = None
            if is_checkmate:
                winner_id = user['id']

            next_turn_user_id = None
            if not game_over:
                cur.execute(
                    "SELECT user_id FROM game_room_players WHERE room_id = %s AND user_id != %s",
                    (room_id, user['id'])
                )
                opponent = cur.fetchone()
                next_turn_user_id = opponent['user_id'] if opponent else None

            cur.execute(
                """UPDATE game_rooms
                   SET state = %s, status = %s, winner_id = %s,
                       current_turn_user_id = %s, updated_at = CURRENT_TIMESTAMP
                   WHERE id = %s""",
                (json.dumps(new_state), new_status, winner_id, next_turn_user_id, room_id)
            )

            if winner_id:
                cur.execute(
                    "UPDATE game_users SET games_played = games_played + 1, games_won = games_won + 1 WHERE id = %s",
                    (winner_id,)
                )
                cur.execute(
                    """UPDATE game_users SET games_played = games_played + 1
                       WHERE id IN (SELECT user_id FROM game_room_players WHERE room_id = %s AND user_id != %s)""",
                    (room_id, winner_id)
                )

            conn.commit()

            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': json.dumps({
                    'success': True,
                    'fen': new_fen,
                    'is_check': is_check,
                    'is_checkmate': is_checkmate,
                    'is_stalemate': is_stalemate,
                    'is_draw': is_draw,
                    'status': new_status,
                    'winner_id': winner_id
                }),
                'isBase64Encoded': False
            }
    finally:
        conn.close()
