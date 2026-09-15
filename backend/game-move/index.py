'''
Единая функция ходов для всех настольных игр раздела (шахматы + шашки) — объединена
из бывших game-chess и game-checkers, чтобы уложиться в лимит backend-функций проекта.
Тип игры определяется по самой комнате (room.game_type), клиенту достаточно передать
либо шахматный ход в формате UCI (move), либо шашечный ход клетками (from/to).

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
import chess

DATABASE_URL = os.environ.get('DATABASE_URL')
DB_SCHEMA = os.environ.get('DB_SCHEMA', 't_p42562714_web_app_creation_1')
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', '')
JWT_ALGORITHM = 'HS256'
GAME_JWT_ISSUER = 'games-section'


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


# ──────────────────────────────────────────────────────────────────────────
# Шашки: правила русских шашек (обязательные взятия цепочкой, дамки)
# ──────────────────────────────────────────────────────────────────────────

DIRS = [(-1, -1), (-1, 1), (1, -1), (1, 1)]
Board = List[List[Optional[str]]]


def checkers_initial_board() -> Board:
    board = [[None for _ in range(8)] for _ in range(8)]
    for row in range(3):
        for col in range(8):
            if (row + col) % 2 == 1:
                board[row][col] = 'b'
    for row in range(5, 8):
        for col in range(8):
            if (row + col) % 2 == 1:
                board[row][col] = 'w'
    return board


def cb_in_bounds(r: int, c: int) -> bool:
    return 0 <= r < 8 and 0 <= c < 8


def cb_is_white(p):
    return p == 'w' or p == 'W'


def cb_is_black(p):
    return p == 'b' or p == 'B'


def cb_is_king(p):
    return p == 'W' or p == 'B'


def cb_same_side(p, side):
    return cb_is_white(p) if side == 'white' else cb_is_black(p)


def cb_enemy_side(p, side):
    return cb_is_black(p) if side == 'white' else cb_is_white(p)


class CMove:
    def __init__(self, fr, to, captured=None):
        self.fr = fr
        self.to = to
        self.captured = captured


def cb_man_captures(board, row, col, side):
    moves = []
    for dr, dc in DIRS:
        mr, mc = row + dr, col + dc
        tr, tc = row + 2 * dr, col + 2 * dc
        if cb_in_bounds(tr, tc) and cb_in_bounds(mr, mc) and cb_enemy_side(board[mr][mc], side) and board[tr][tc] is None:
            moves.append(CMove((row, col), (tr, tc), (mr, mc)))
    return moves


def cb_man_simple_moves(board, row, col, side):
    moves = []
    dr = -1 if side == 'white' else 1
    for dc in (-1, 1):
        r, c = row + dr, col + dc
        if cb_in_bounds(r, c) and board[r][c] is None:
            moves.append(CMove((row, col), (r, c)))
    return moves


def cb_king_moves(board, row, col, side):
    simple = []
    captures = []
    for dr, dc in DIRS:
        r, c = row + dr, col + dc
        while cb_in_bounds(r, c) and board[r][c] is None:
            simple.append(CMove((row, col), (r, c)))
            r += dr
            c += dc
        if cb_in_bounds(r, c) and cb_enemy_side(board[r][c], side):
            cap_r, cap_c = r, c
            lr, lc = r + dr, c + dc
            while cb_in_bounds(lr, lc) and board[lr][lc] is None:
                captures.append(CMove((row, col), (lr, lc), (cap_r, cap_c)))
                lr += dr
                lc += dc
    return simple, captures


def cb_piece_moves(board, row, col, side):
    piece = board[row][col]
    if not piece or not cb_same_side(piece, side):
        return [], []
    if cb_is_king(piece):
        return cb_king_moves(board, row, col, side)
    return cb_man_simple_moves(board, row, col, side), cb_man_captures(board, row, col, side)


def cb_all_legal_moves(board, side, forced=None):
    all_captures = []
    all_simple = []
    for r in range(8):
        for c in range(8):
            piece = board[r][c]
            if not piece or not cb_same_side(piece, side):
                continue
            if forced and (forced[0] != r or forced[1] != c):
                continue
            simple, captures = cb_piece_moves(board, r, c, side)
            all_captures.extend(captures)
            all_simple.extend(simple)
    if all_captures:
        return all_captures
    if forced:
        return []
    return all_simple


def cb_apply_move(board, move):
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


def cb_count_pieces(board, side):
    total = 0
    for row in board:
        for p in row:
            if cb_same_side(p, side):
                total += 1
    return total


def cb_parse_cell(value):
    if not isinstance(value, list) or len(value) != 2:
        return None
    try:
        r = int(value[0])
        c = int(value[1])
    except (TypeError, ValueError):
        return None
    if not cb_in_bounds(r, c):
        return None
    return (r, c)


def handle_checkers_move(cur, conn, room, user, body):
    room_id = room['id']
    from_cell = cb_parse_cell(body.get('from'))
    to_cell = cb_parse_cell(body.get('to'))

    if not from_cell or not to_cell:
        return error_response(400, 'from и to обязательны')

    if room['status'] != 'playing':
        return error_response(400, 'Игра ещё не началась или уже завершена')
    if room['current_turn_user_id'] != user['id']:
        return error_response(400, 'Сейчас не ваш ход')

    cur.execute(
        "SELECT side FROM " + DB_SCHEMA + ".game_room_players WHERE room_id = %s AND user_id = %s",
        (room_id, user['id'])
    )
    player = cur.fetchone()
    if not player:
        return error_response(403, 'Вы не участник этой партии')

    side = player['side']
    state = room['state'] or {}
    board = state.get('board') or checkers_initial_board()
    forced = state.get('must_continue')
    forced_tuple = (forced[0], forced[1]) if forced else None

    legal = cb_all_legal_moves(board, side, forced_tuple)
    chosen = None
    for m in legal:
        if m.fr == from_cell and m.to == to_cell:
            chosen = m
            break
    if not chosen:
        return error_response(400, 'Недопустимый ход по правилам шашек')

    new_board, promoted = cb_apply_move(board, chosen)

    must_continue = None
    if chosen.captured:
        _, further_captures = cb_piece_moves(new_board, chosen.to[0], chosen.to[1], side)
        if further_captures:
            must_continue = list(chosen.to)

    cur.execute(
        "SELECT COALESCE(MAX(move_number), 0) + 1 as next_num FROM " + DB_SCHEMA + ".game_moves WHERE room_id = %s",
        (room_id,)
    )
    move_number = cur.fetchone()['next_num']

    cur.execute(
        "INSERT INTO " + DB_SCHEMA + ".game_moves (room_id, user_id, move_number, move_data) VALUES (%s, %s, %s, %s)",
        (room_id, user['id'], move_number, json.dumps({'from': list(from_cell), 'to': list(to_cell)}))
    )

    opponent_side = 'black' if side == 'white' else 'white'
    opponent_has_pieces = cb_count_pieces(new_board, opponent_side) > 0

    game_over = False
    winner_id = None
    next_turn_user_id = room['current_turn_user_id']

    if must_continue:
        next_turn_user_id = user['id']
    else:
        cur.execute(
            "SELECT user_id FROM " + DB_SCHEMA + ".game_room_players WHERE room_id = %s AND user_id != %s",
            (room_id, user['id'])
        )
        opponent_row = cur.fetchone()
        opponent_user_id = opponent_row['user_id'] if opponent_row else None

        if not opponent_has_pieces:
            game_over = True
            winner_id = user['id']
        elif opponent_user_id and not cb_all_legal_moves(new_board, opponent_side):
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
        "UPDATE " + DB_SCHEMA + ".game_rooms SET state = %s, status = %s, winner_id = %s, "
        "current_turn_user_id = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
        (json.dumps(new_state), new_status, winner_id, next_turn_user_id, room_id)
    )

    if winner_id:
        cur.execute(
            "UPDATE " + DB_SCHEMA + ".game_users SET games_played = games_played + 1, "
            "games_won = games_won + 1 WHERE id = %s",
            (winner_id,)
        )
        cur.execute(
            "UPDATE " + DB_SCHEMA + ".game_users SET games_played = games_played + 1 "
            "WHERE id IN (SELECT user_id FROM " + DB_SCHEMA + ".game_room_players WHERE room_id = %s AND user_id != %s)",
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


# ──────────────────────────────────────────────────────────────────────────
# Шахматы: валидация через python-chess
# ──────────────────────────────────────────────────────────────────────────

def handle_chess_move(cur, conn, room, user, body):
    room_id = room['id']
    move_uci = body.get('move')

    if not move_uci:
        return error_response(400, 'move обязателен')
    if room['status'] != 'playing':
        return error_response(400, 'Игра ещё не началась или уже завершена')
    if room['current_turn_user_id'] != user['id']:
        return error_response(400, 'Сейчас не ваш ход')

    cur.execute(
        "SELECT side FROM " + DB_SCHEMA + ".game_room_players WHERE room_id = %s AND user_id = %s",
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
        "SELECT COALESCE(MAX(move_number), 0) + 1 as next_num FROM " + DB_SCHEMA + ".game_moves WHERE room_id = %s",
        (room_id,)
    )
    move_number = cur.fetchone()['next_num']

    cur.execute(
        "INSERT INTO " + DB_SCHEMA + ".game_moves (room_id, user_id, move_number, move_data) VALUES (%s, %s, %s, %s)",
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
            "SELECT user_id FROM " + DB_SCHEMA + ".game_room_players WHERE room_id = %s AND user_id != %s",
            (room_id, user['id'])
        )
        opponent = cur.fetchone()
        next_turn_user_id = opponent['user_id'] if opponent else None

    cur.execute(
        "UPDATE " + DB_SCHEMA + ".game_rooms SET state = %s, status = %s, winner_id = %s, "
        "current_turn_user_id = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
        (json.dumps(new_state), new_status, winner_id, next_turn_user_id, room_id)
    )

    if winner_id:
        cur.execute(
            "UPDATE " + DB_SCHEMA + ".game_users SET games_played = games_played + 1, "
            "games_won = games_won + 1 WHERE id = %s",
            (winner_id,)
        )
        cur.execute(
            "UPDATE " + DB_SCHEMA + ".game_users SET games_played = games_played + 1 "
            "WHERE id IN (SELECT user_id FROM " + DB_SCHEMA + ".game_room_players WHERE room_id = %s AND user_id != %s)",
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


# ──────────────────────────────────────────────────────────────────────────
# Покер: Техасский Холдем на несколько игроков (до 8), с раздачей карт,
# кругами торгов (fold/check/call/raise), side-пoтами и определением победителя
# по комбинации из 7 карт (2 карманные + 5 общих).
# ──────────────────────────────────────────────────────────────────────────

import random as _random
from itertools import combinations as _combinations
from collections import Counter as _Counter

POKER_RANKS = '23456789TJQKA'
POKER_SUITS = 'SHDC'
SMALL_BLIND = 10
BIG_BLIND = 20


def poker_new_deck() -> List[str]:
    deck = [r + s for r in POKER_RANKS for s in POKER_SUITS]
    _random.shuffle(deck)
    return deck


def poker_card_rank(card: str) -> int:
    return POKER_RANKS.index(card[0]) + 2


def poker_evaluate_5(cards: List[str]):
    ranks = sorted([poker_card_rank(c) for c in cards], reverse=True)
    suits = [c[1] for c in cards]
    is_flush = len(set(suits)) == 1
    unique_ranks = sorted(set(ranks), reverse=True)
    is_straight = False
    straight_high = None
    if len(unique_ranks) == 5:
        if unique_ranks[0] - unique_ranks[4] == 4:
            is_straight = True
            straight_high = unique_ranks[0]
        elif unique_ranks == [14, 5, 4, 3, 2]:
            is_straight = True
            straight_high = 5
    counts = _Counter(ranks)
    groups = sorted(counts.items(), key=lambda x: (-x[1], -x[0]))
    count_pattern = [g[1] for g in groups]
    group_ranks = [g[0] for g in groups]
    if is_straight and is_flush:
        return (8, straight_high)
    if count_pattern[0] == 4:
        return (7, group_ranks[0], group_ranks[1])
    if count_pattern[0] == 3 and count_pattern[1] == 2:
        return (6, group_ranks[0], group_ranks[1])
    if is_flush:
        return (5,) + tuple(ranks)
    if is_straight:
        return (4, straight_high)
    if count_pattern[0] == 3:
        return (3, group_ranks[0]) + tuple(group_ranks[1:])
    if count_pattern[0] == 2 and count_pattern[1] == 2:
        return (2, group_ranks[0], group_ranks[1], group_ranks[2])
    if count_pattern[0] == 2:
        return (1, group_ranks[0]) + tuple(group_ranks[1:])
    return (0,) + tuple(ranks)


def poker_evaluate_7(cards7: List[str]):
    best = None
    for combo in _combinations(cards7, 5):
        score = poker_evaluate_5(list(combo))
        if best is None or score > best:
            best = score
    return best


POKER_HAND_NAMES = {
    8: 'Стрит-флеш', 7: 'Каре', 6: 'Фулл-хаус', 5: 'Флеш',
    4: 'Стрит', 3: 'Сет', 2: 'Две пары', 1: 'Пара', 0: 'Старшая карта'
}


def poker_hand_name(score) -> str:
    return POKER_HAND_NAMES[score[0]]


def poker_compute_pots(contributions: Dict[str, int], folded_set) -> List[Tuple[int, List[str]]]:
    levels = sorted(set(v for v in contributions.values() if v > 0))
    pots = []
    prev = 0
    for level in levels:
        amount = 0
        eligible = []
        for uid, contrib in contributions.items():
            if contrib > prev:
                amount += min(contrib, level) - prev
            if contrib >= level and uid not in folded_set:
                eligible.append(uid)
        if amount > 0:
            pots.append((amount, eligible))
        prev = level
    return pots


def poker_settle_pots(pots, hole_cards, community_cards, seat_order) -> Tuple[Dict[str, int], Dict[str, Any]]:
    winnings: Dict[str, int] = {}
    hand_info: Dict[str, Any] = {}
    for amount, eligible in pots:
        if len(eligible) == 1:
            winnings[eligible[0]] = winnings.get(eligible[0], 0) + amount
            continue
        scores = {}
        for uid in eligible:
            score = poker_evaluate_7(hole_cards[uid] + community_cards)
            scores[uid] = score
            hand_info[uid] = poker_hand_name(score)
        best_score = max(scores.values())
        winners = [uid for uid, s in scores.items() if s == best_score]
        share = amount // len(winners)
        remainder = amount - share * len(winners)
        winners_sorted = sorted(winners, key=lambda u: seat_order.index(u))
        for i, uid in enumerate(winners_sorted):
            winnings[uid] = winnings.get(uid, 0) + share + (1 if i < remainder else 0)
    return winnings, hand_info


def poker_next_active_seat(seat_order: List[str], current: str, players: Dict[str, Any]) -> Optional[str]:
    n = len(seat_order)
    idx = seat_order.index(current)
    for i in range(1, n + 1):
        cand = seat_order[(idx + i) % n]
        p = players[cand]
        if not p['folded'] and not p['all_in']:
            return cand
    return None


def poker_round_complete(seat_order: List[str], players: Dict[str, Any], current_bet: int) -> bool:
    active = [u for u in seat_order if not players[u]['folded'] and not players[u]['all_in']]
    if len(active) <= 1:
        return True
    return all(players[u]['has_acted'] and players[u]['bet_this_round'] == current_bet for u in active)


def poker_get_seat_order(cur, room_id) -> List[str]:
    cur.execute(
        "SELECT user_id FROM " + DB_SCHEMA + ".game_room_players WHERE room_id = %s ORDER BY seat_index",
        (room_id,)
    )
    return [str(r['user_id']) for r in cur.fetchall()]


def poker_start_hand(cur, room_id: int, seat_order: List[str], chips: Dict[str, int], dealer_seat_index: int) -> Dict[str, Any]:
    deck = poker_new_deck()
    players: Dict[str, Any] = {}
    for uid in seat_order:
        players[uid] = {
            'hole_cards': [deck.pop(), deck.pop()],
            'bet_this_round': 0,
            'total_bet_this_hand': 0,
            'folded': False,
            'all_in': chips[uid] <= 0,
            'has_acted': False,
        }

    n = len(seat_order)
    sb_seat = (dealer_seat_index + 1) % n if n > 2 else dealer_seat_index
    bb_seat = (dealer_seat_index + 2) % n if n > 2 else (dealer_seat_index + 1) % n
    sb_uid = seat_order[sb_seat]
    bb_uid = seat_order[bb_seat]

    def post_blind(uid: str, amount: int):
        pay = min(amount, chips[uid])
        chips[uid] -= pay
        players[uid]['bet_this_round'] += pay
        players[uid]['total_bet_this_hand'] += pay
        if chips[uid] == 0:
            players[uid]['all_in'] = True

    post_blind(sb_uid, SMALL_BLIND)
    post_blind(bb_uid, BIG_BLIND)

    current_bet = BIG_BLIND
    first_to_act = seat_order[(bb_seat + 1) % n]
    # Если после блайндов первый по очереди уже all-in/сфолдил (у 2 игроков), находим следующего
    if players[first_to_act]['all_in'] or players[first_to_act]['folded']:
        nxt = poker_next_active_seat(seat_order, first_to_act, players)
        if nxt:
            first_to_act = nxt

    return {
        'hand_number': 1,
        'deck': deck,
        'community_cards': [],
        'stage': 'preflop',
        'pot': sum(p['total_bet_this_hand'] for p in players.values()),
        'dealer_seat_index': dealer_seat_index,
        'current_bet': current_bet,
        'players': players,
        'last_result': None,
    }, first_to_act


def poker_advance_stage(state: Dict[str, Any]) -> None:
    active_count = sum(1 for p in state['players'].values() if not p['folded'])
    if active_count <= 1:
        state['stage'] = 'showdown'
        return
    if state['stage'] == 'preflop':
        state['deck'].pop()  # burn card
        state['community_cards'] = [state['deck'].pop() for _ in range(3)]
        state['stage'] = 'flop'
    elif state['stage'] == 'flop':
        state['deck'].pop()
        state['community_cards'].append(state['deck'].pop())
        state['stage'] = 'turn'
    elif state['stage'] == 'turn':
        state['deck'].pop()
        state['community_cards'].append(state['deck'].pop())
        state['stage'] = 'river'
    elif state['stage'] == 'river':
        state['stage'] = 'showdown'
        return
    state['current_bet'] = 0
    for p in state['players'].values():
        p['bet_this_round'] = 0
        if not p['folded'] and not p['all_in']:
            p['has_acted'] = False


def poker_finish_hand(cur, room, state: Dict[str, Any], seat_order: List[str], chips: Dict[str, int]):
    contributions = {uid: state['players'][uid]['total_bet_this_hand'] for uid in seat_order}
    folded = {uid for uid in seat_order if state['players'][uid]['folded']}
    pots = poker_compute_pots(contributions, folded)
    hole_cards = {uid: state['players'][uid]['hole_cards'] for uid in seat_order}

    # Если карты ещё не полностью открыты (все, кроме одного, сфолдили до ривера) —
    # достаём общие карты для отображения, но эвалюатор в этом случае не нужен для одного eligible.
    community = state['community_cards']

    winnings, hand_info = poker_settle_pots(pots, hole_cards, community, seat_order)
    for uid, amount in winnings.items():
        chips[uid] += amount

    for uid in seat_order:
        cur.execute(
            "UPDATE " + DB_SCHEMA + ".game_room_players SET chips = %s WHERE room_id = %s AND user_id = %s",
            (chips[uid], room['id'], uid)
        )

    state['last_result'] = {
        'winnings': winnings,
        'hands': hand_info,
        'community_cards': community,
        'hole_cards': hole_cards,
    }
    state['stage'] = 'showdown'

    poker_post_hand_summary(cur, room, seat_order, winnings, hand_info, folded)

    remaining_players = [uid for uid in seat_order if chips[uid] > 0]
    game_over = len(remaining_players) <= 1
    winner_id = int(remaining_players[0]) if game_over and remaining_players else None
    return game_over, winner_id


def poker_post_hand_summary(cur, room, seat_order: List[str], winnings: Dict[str, int], hand_info: Dict[str, Any], folded) -> None:
    '''Пишет в чат комнаты системное сообщение с итогом раздачи (кто и сколько выиграл),
    чтобы игроки видели историю партий, не открывая логи вручную.'''
    winners = {uid: amount for uid, amount in winnings.items() if amount > 0}
    if not winners:
        return

    cur.execute(
        "SELECT id, nickname FROM " + DB_SCHEMA + ".game_users WHERE id = ANY(%s)",
        ([int(uid) for uid in seat_order],)
    )
    nicknames = {str(r['id']): r['nickname'] for r in cur.fetchall()}

    parts = []
    for uid, amount in sorted(winners.items(), key=lambda kv: -kv[1]):
        name = nicknames.get(uid, '?')
        hand_name = hand_info.get(uid)
        if hand_name:
            parts.append(f"{name} выиграл(а) {amount} фишек ({hand_name})")
        else:
            parts.append(f"{name} забрал(а) банк {amount} фишек (соперники сбросили карты)")

    message = 'Итог раздачи: ' + '; '.join(parts)
    system_author_id = int(seat_order[0])

    cur.execute(
        "INSERT INTO " + DB_SCHEMA + ".game_chat_messages (room_id, user_id, message, is_system) VALUES (%s, %s, %s, TRUE)",
        (room['id'], system_author_id, message[:500])
    )


def handle_poker_action(cur, conn, room, user, body):
    room_id = room['id']
    action = body.get('action')
    if action not in ('start_hand', 'fold', 'check', 'call', 'raise'):
        return error_response(400, 'Неизвестное покерное действие')

    cur.execute(
        "SELECT user_id, chips, seat_index FROM " + DB_SCHEMA + ".game_room_players WHERE room_id = %s ORDER BY seat_index",
        (room_id,)
    )
    player_rows = cur.fetchall()
    seat_order = [str(r['user_id']) for r in player_rows]
    chips = {str(r['user_id']): (r['chips'] or 0) for r in player_rows}
    my_uid = str(user['id'])

    if my_uid not in seat_order:
        return error_response(403, 'Вы не участник этой партии')

    state = room['state'] or {}

    if action == 'start_hand':
        if room['status'] != 'playing':
            return error_response(400, 'Игра ещё не началась')
        if state.get('stage') not in (None, 'showdown', 'waiting'):
            return error_response(400, 'Раздача уже идёт')
        if len([uid for uid in seat_order if chips[uid] > 0]) < 2:
            return error_response(400, 'Недостаточно игроков с фишками для новой раздачи')

        prev_dealer = state.get('dealer_seat_index', -1)
        dealer_seat_index = (prev_dealer + 1) % len(seat_order)
        # пропускаем игроков без фишек при назначении дилера
        attempts = 0
        while chips[seat_order[dealer_seat_index]] <= 0 and attempts < len(seat_order):
            dealer_seat_index = (dealer_seat_index + 1) % len(seat_order)
            attempts += 1

        new_state, first_to_act = poker_start_hand(cur, room_id, seat_order, chips, dealer_seat_index)
        new_state['hand_number'] = state.get('hand_number', 0) + 1

        for uid in seat_order:
            cur.execute(
                "UPDATE " + DB_SCHEMA + ".game_room_players SET chips = %s WHERE room_id = %s AND user_id = %s",
                (chips[uid], room_id, uid)
            )

        cur.execute(
            "UPDATE " + DB_SCHEMA + ".game_rooms SET state = %s, current_turn_user_id = %s, "
            "updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (json.dumps(new_state), int(first_to_act), room_id)
        )
        conn.commit()
        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps({'success': True, 'stage': new_state['stage']}),
            'isBase64Encoded': False
        }

    # Ходовые действия (fold/check/call/raise) — требуют активной раздачи и своей очереди
    if state.get('stage') not in ('preflop', 'flop', 'turn', 'river'):
        return error_response(400, 'Сейчас нет активного круга торгов')
    if room['current_turn_user_id'] != user['id']:
        return error_response(400, 'Сейчас не ваш ход')

    players_state = state['players']
    p = players_state.get(my_uid)
    if not p or p['folded'] or p['all_in']:
        return error_response(400, 'Вы не можете сейчас действовать')

    if action == 'fold':
        p['folded'] = True
        p['has_acted'] = True
    elif action == 'check':
        if p['bet_this_round'] != state['current_bet']:
            return error_response(400, 'Нельзя чекать — есть неуравненная ставка')
        p['has_acted'] = True
    elif action == 'call':
        to_call = state['current_bet'] - p['bet_this_round']
        if to_call <= 0:
            return error_response(400, 'Нечего коллировать, используйте чек')
        pay = min(to_call, chips[my_uid])
        chips[my_uid] -= pay
        p['bet_this_round'] += pay
        p['total_bet_this_hand'] += pay
        if chips[my_uid] == 0:
            p['all_in'] = True
        p['has_acted'] = True
    elif action == 'raise':
        amount = body.get('amount')
        if not isinstance(amount, (int, float)) or amount <= state['current_bet']:
            return error_response(400, 'Сумма рейза должна быть больше текущей ставки')
        amount = int(amount)
        pay = amount - p['bet_this_round']
        if pay > chips[my_uid]:
            return error_response(400, 'Недостаточно фишек для такого рейза')
        chips[my_uid] -= pay
        p['bet_this_round'] += pay
        p['total_bet_this_hand'] += pay
        state['current_bet'] = max(state['current_bet'], p['bet_this_round'])
        if chips[my_uid] == 0:
            p['all_in'] = True
        p['has_acted'] = True
        for other_uid in seat_order:
            if other_uid != my_uid and not players_state[other_uid]['folded'] and not players_state[other_uid]['all_in']:
                players_state[other_uid]['has_acted'] = False

    cur.execute(
        "UPDATE " + DB_SCHEMA + ".game_room_players SET chips = %s WHERE room_id = %s AND user_id = %s",
        (chips[my_uid], room_id, my_uid)
    )

    state['pot'] = sum(pl['total_bet_this_hand'] for pl in players_state.values())

    game_over = False
    winner_id = None
    next_turn_user_id = None

    if poker_round_complete(seat_order, players_state, state['current_bet']):
        active_count = sum(1 for pl in players_state.values() if not pl['folded'])
        if active_count <= 1 or state['stage'] == 'river':
            game_over_hand, showdown_winner = poker_finish_hand(cur, room, state, seat_order, chips)
            game_over = game_over_hand
            winner_id = showdown_winner
            next_turn_user_id = None
        else:
            poker_advance_stage(state)
            first_uid = poker_next_active_seat(seat_order, seat_order[state['dealer_seat_index']], players_state)
            next_turn_user_id = int(first_uid) if first_uid else None
    else:
        nxt = poker_next_active_seat(seat_order, my_uid, players_state)
        next_turn_user_id = int(nxt) if nxt else None

    new_status = 'finished' if game_over else 'playing'

    cur.execute(
        "UPDATE " + DB_SCHEMA + ".game_rooms SET state = %s, status = %s, winner_id = %s, "
        "current_turn_user_id = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
        (json.dumps(state), new_status, winner_id, next_turn_user_id, room_id)
    )

    if winner_id:
        cur.execute(
            "UPDATE " + DB_SCHEMA + ".game_users SET games_played = games_played + 1, "
            "games_won = games_won + 1 WHERE id = %s",
            (winner_id,)
        )
        cur.execute(
            "UPDATE " + DB_SCHEMA + ".game_users SET games_played = games_played + 1 "
            "WHERE id IN (SELECT user_id FROM " + DB_SCHEMA + ".game_room_players WHERE room_id = %s AND user_id != %s)",
            (room_id, winner_id)
        )

    conn.commit()

    return {
        'statusCode': 200,
        'headers': cors_headers(),
        'body': json.dumps({
            'success': True,
            'stage': state['stage'],
            'status': new_status,
            'winner_id': winner_id
        }),
        'isBase64Encoded': False
    }


# ──────────────────────────────────────────────────────────────────────────

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
    if not room_id:
        return error_response(400, 'room_id обязателен')

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM " + DB_SCHEMA + ".game_rooms WHERE id = %s", (room_id,))
        room = cur.fetchone()

        if not room:
            return error_response(404, 'Комната не найдена')

        if room['game_type'] == 'chess':
            result = handle_chess_move(cur, conn, room, user, body)
        elif room['game_type'] == 'checkers':
            result = handle_checkers_move(cur, conn, room, user, body)
        elif room['game_type'] == 'poker':
            result = handle_poker_action(cur, conn, room, user, body)
        else:
            result = error_response(400, 'Неизвестный тип игры для этой комнаты')

        cur.close()
        return result
    finally:
        conn.close()