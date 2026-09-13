'''
Логика ходов в русские шашки: валидация каждого хода на сервере, обязательные взятия
(в том числе цепочкой), превращение в дамки, определение победителя.
Доска — 8x8 JSON-массив: null | "w" | "b" | "W" | "B" (заглавные — дамки).
Args: event - dict with httpMethod, body, headers (X-Game-Token)
      context - object with attributes: request_id
Returns: HTTP response dict with statusCode, headers, body
'''

import json
import os
from typing import Dict, Any, Optional, List, Tuple
import psycopg2
from psycopg2.extras import RealDictCursor
import jwt

DATABASE_URL = os.environ.get('DATABASE_URL')
DB_SCHEMA = os.environ.get('DB_SCHEMA', 't_p42562714_web_app_creation_1')
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', '')
JWT_ALGORITHM = 'HS256'
GAME_JWT_ISSUER = 'games-section'

DIRS = [(-1, -1), (-1, 1), (1, -1), (1, 1)]
Board = List[List[Optional[str]]]


def initial_board() -> Board:
    board: Board = [[None] * 8 for _ in range(8)]
    for row in range(3):
        for col in range(8):
            if (row + col) % 2 == 1:
                board[row][col] = 'b'
    for row in range(5, 8):
        for col in range(8):
            if (row + col) % 2 == 1:
                board[row][col] = 'w'
    return board


def in_bounds(r: int, c: int) -> bool:
    return 0 <= r < 8 and 0 <= c < 8


def is_white(p: Optional[str]) -> bool:
    return p in ('w', 'W')


def is_black(p: Optional[str]) -> bool:
    return p in ('b', 'B')


def is_king(p: Optional[str]) -> bool:
    return p in ('W', 'B')


def same_side(p: Optional[str], side: str) -> bool:
    return is_white(p) if side == 'white' else is_black(p)


def enemy_side(p: Optional[str], side: str) -> bool:
    return is_black(p) if side == 'white' else is_white(p)


class Move:
    def __init__(self, fr: Tuple[int, int], to: Tuple[int, int], captured: Optional[Tuple[int, int]] = None):
        self.fr = fr
        self.to = to
        self.captured = captured


def man_captures(board: Board, row: int, col: int, side: str) -> List[Move]:
    moves = []
    for dr, dc in DIRS:
        mr, mc = row + dr, col + dc
        tr, tc = row + 2 * dr, col + 2 * dc
        if in_bounds(tr, tc) and in_bounds(mr, mc) and enemy_side(board[mr][mc], side) and board[tr][tc] is None:
            moves.append(Move((row, col), (tr, tc), (mr, mc)))
    return moves


def man_simple_moves(board: Board, row: int, col: int, side: str) -> List[Move]:
    moves = []
    dr = -1 if side == 'white' else 1
    for dc in (-1, 1):
        r, c = row + dr, col + dc
        if in_bounds(r, c) and board[r][c] is None:
            moves.append(Move((row, col), (r, c)))
    return moves


def king_moves(board: Board, row: int, col: int, side: str) -> Tuple[List[Move], List[Move]]:
    simple = []
    captures = []
    for dr, dc in DIRS:
        r, c = row + dr, col + dc
        while in_bounds(r, c) and board[r][c] is None:
            simple.append(Move((row, col), (r, c)))
            r += dr
            c += dc
        if in_bounds(r, c) and enemy_side(board[r][c], side):
            cap_r, cap_c = r, c
            lr, lc = r + dr, c + dc
            while in_bounds(lr, lc) and board[lr][lc] is None:
                captures.append(Move((row, col), (lr, lc), (cap_r, cap_c)))
                lr += dr
                lc += dc
    return simple, captures


def piece_moves(board: Board, row: int, col: int, side: str) -> Tuple[List[Move], List[Move]]:
    piece = board[row][col]
    if not piece or not same_side(piece, side):
        return [], []
    if is_king(piece):
        return king_moves(board, row, col, side)
    return man_simple_moves(board, row, col, side), man_captures(board, row, col, side)


def all_legal_moves(board: Board, side: str, forced: Optional[Tuple[int, int]] = None) -> List[Move]:
    all_captures: List[Move] = []
    all_simple: List[Move] = []
    for r in range(8):
        for c in range(8):
            piece = board[r][c]
            if not piece or not same_side(piece, side):
                continue
            if forced and (forced[0] != r or forced[1] != c):
                continue
            simple, captures = piece_moves(board, r, c, side)
            all_captures.extend(captures)
            all_simple.extend(simple)
    if all_captures:
        return all_captures
    return [] if forced else all_simple


def apply_move(board: Board, move: Move) -> Tuple[Board, bool]:
    new_board = [row[:] for row in board]
    fr, fc = move.fr
    tr, tc = move.to
    piece = new_board[fr][fc]
    new_board[fr][fc] = None
    promoted = False
    if piece == 'w' and tr == 0:
        piece = 'W'
        promoted = True
    elif piece == 'b' and tr == 7:
        piece = 'B'
        promoted = True
    new_board[tr][tc] = piece
    if move.captured:
        cr, cc = move.captured
        new_board[cr][cc] = None
    return new_board, promoted


def count_pieces(board: Board, side: str) -> int:
    return sum(1 for row in board for p in row if same_side(p, side))


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


def parse_cell(value: Any) -> Optional[Tuple[int, int]]:
    if not isinstance(value, list) or len(value) != 2:
        return None
    try:
        r, c = int(value[0]), int(value[1])
    except (TypeError, ValueError):
        return None
    if not in_bounds(r, c):
        return None
    return (r, c)


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
    from_cell = parse_cell(body.get('from'))
    to_cell = parse_cell(body.get('to'))

    if not room_id or not from_cell or not to_cell:
        return error_response(400, 'room_id, from и to обязательны')

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(f"SELECT * FROM {DB_SCHEMA}.game_rooms WHERE id = %s", (room_id,))
            room = cur.fetchone()

            if not room:
                return error_response(404, 'Комната не найдена')
            if room['game_type'] != 'checkers':
                return error_response(400, 'Эта комната не для шашек')
            if room['status'] != 'playing':
                return error_response(400, 'Игра ещё не началась или уже завершена')
            if room['current_turn_user_id'] != user['id']:
                return error_response(400, 'Сейчас не ваш ход')

            cur.execute(
                f"SELECT side FROM {DB_SCHEMA}.game_room_players WHERE room_id = %s AND user_id = %s",
                (room_id, user['id'])
            )
            player = cur.fetchone()
            if not player:
                return error_response(403, 'Вы не участник этой партии')

            side = player['side']
            state = room['state'] or {}
            board = state.get('board') or initial_board()
            forced = state.get('must_continue')
            forced_tuple = (forced[0], forced[1]) if forced else None

            legal = all_legal_moves(board, side, forced_tuple)
            chosen = next((m for m in legal if m.fr == from_cell and m.to == to_cell), None)
            if not chosen:
                return error_response(400, 'Недопустимый ход по правилам шашек')

            new_board, promoted = apply_move(board, chosen)

            must_continue = None
            if chosen.captured and not promoted:
                _, further_captures = piece_moves(new_board, chosen.to[0], chosen.to[1], side)
                if further_captures:
                    must_continue = list(chosen.to)
            elif chosen.captured and promoted:
                # После превращения в дамку доп. взятия по правилам не обязательны в эту же очередь,
                # но большинство сводов (в т.ч. русские шашки) разрешают их — проверяем как дамка.
                _, further_captures = piece_moves(new_board, chosen.to[0], chosen.to[1], side)
                if further_captures:
                    must_continue = list(chosen.to)

            cur.execute(
                f"SELECT COALESCE(MAX(move_number), 0) + 1 as next_num FROM {DB_SCHEMA}.game_moves WHERE room_id = %s",
                (room_id,)
            )
            move_number = cur.fetchone()['next_num']

            cur.execute(
                f"""INSERT INTO {DB_SCHEMA}.game_moves (room_id, user_id, move_number, move_data)
                   VALUES (%s, %s, %s, %s)""",
                (room_id, user['id'], move_number, json.dumps({'from': list(from_cell), 'to': list(to_cell)}))
            )

            opponent_side = 'black' if side == 'white' else 'white'
            opponent_has_pieces = count_pieces(new_board, opponent_side) > 0

            game_over = False
            winner_id = None
            next_turn_user_id = room['current_turn_user_id']

            if must_continue:
                next_turn_user_id = user['id']
            else:
                cur.execute(
                    f"SELECT user_id FROM {DB_SCHEMA}.game_room_players WHERE room_id = %s AND user_id != %s",
                    (room_id, user['id'])
                )
                opponent_row = cur.fetchone()
                opponent_user_id = opponent_row['user_id'] if opponent_row else None

                if not opponent_has_pieces:
                    game_over = True
                    winner_id = user['id']
                elif opponent_user_id and not all_legal_moves(new_board, opponent_side):
                    game_over = True
                    winner_id = user['id']
                else:
                    next_turn_user_id = opponent_user_id

            new_state = dict(state)
            new_state['board'] = new_board
            new_state['must_continue'] = must_continue
            new_state['last_move'] = {'from': list(from_cell), 'to': list(to_cell)}

            new_status = 'finished' if game_over else 'playing'

            cur.execute(
                f"""UPDATE {DB_SCHEMA}.game_rooms
                   SET state = %s, status = %s, winner_id = %s,
                       current_turn_user_id = %s, updated_at = CURRENT_TIMESTAMP
                   WHERE id = %s""",
                (json.dumps(new_state), new_status, winner_id, next_turn_user_id, room_id)
            )

            if winner_id:
                cur.execute(
                    f"UPDATE {DB_SCHEMA}.game_users SET games_played = games_played + 1, games_won = games_won + 1 WHERE id = %s",
                    (winner_id,)
                )
                cur.execute(
                    f"""UPDATE {DB_SCHEMA}.game_users SET games_played = games_played + 1
                       WHERE id IN (SELECT user_id FROM {DB_SCHEMA}.game_room_players WHERE room_id = %s AND user_id != %s)""",
                    (room_id, winner_id)
                )

            conn.commit()

            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': json.dumps({
                    'success': True,
                    'board': new_board,
                    'must_continue': must_continue,
                    'promoted': promoted,
                    'status': new_status,
                    'winner_id': winner_id
                }),
                'isBase64Encoded': False
            }
    finally:
        conn.close()
