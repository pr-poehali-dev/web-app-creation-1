'''
Движок длинных нард для двоих. Чистая логика без БД, состояние хранится в game_rooms.state.
Позиции хранятся абсолютно (0..23): белые стартуют с пункта 0, чёрные с пункта 12,
обе стороны идут по возрастанию номера по кругу. Дом белых 18..23, дом чёрных 6..11.
Внутри движка для текущей стороны используются «свои» индексы 0..23 (0 — голова, 18..23 — дом).
'''
import random
from typing import Dict, Any, List, Optional, Tuple

OFFSET = {'w': 0, 'b': 12}
TOTAL = 15
HOME_START = 18
BLOCK_LEN = 6


def initial_state() -> Dict[str, Any]:
    w = [0] * 24
    b = [0] * 24
    w[0] = TOTAL
    b[12] = TOTAL
    return {
        'pts_w': w, 'pts_b': b, 'off_w': 0, 'off_b': 0,
        'turn': 'w', 'rolled': False, 'dice': [], 'last_roll': None,
        'head_taken': 0, 'head_limit': 1, 'first': {'w': True, 'b': True},
        'legal': [], 'winner': None, 'seq': 0, 'event': None,
    }


def other(side: str) -> str:
    return 'b' if side == 'w' else 'w'


def _mine(state: Dict[str, Any], side: str) -> List[int]:
    arr = state['pts_' + side]
    o = OFFSET[side]
    return [arr[(i + o) % 24] for i in range(24)]


def _opp(state: Dict[str, Any], side: str) -> List[int]:
    arr = state['pts_' + other(side)]
    o = OFFSET[side]
    return [arr[(i + o) % 24] for i in range(24)]


def _single(mine: Tuple[int, ...], oppm: List[int], off: int, head: int, head_limit: int, p: int, d: int):
    if mine[p] <= 0:
        return None
    if p == 0 and head >= head_limit:
        return None
    q = p + d
    new = list(mine)
    new[p] -= 1
    if q >= 24:
        if sum(mine[:HOME_START]) > 0:
            return None
        if q > 24 and sum(mine[HOME_START:p]) > 0:
            return None
        return tuple(new), off + 1, head + (1 if p == 0 else 0)
    if oppm[q] > 0:
        return None
    new[q] += 1
    lo = max(0, q - BLOCK_LEN + 1)
    hi = min(q, 24 - BLOCK_LEN)
    for i in range(lo, hi + 1):
        if all(new[j] > 0 for j in range(i, i + BLOCK_LEN)):
            if not any(oppm[j] > 0 for j in range(i + BLOCK_LEN, 24)):
                return None
    return tuple(new), off, head + (1 if p == 0 else 0)


def _best(mine, oppm, off, head, head_limit, dice: Tuple[int, ...], memo) -> int:
    if not dice:
        return 0
    key = (mine, off, head, dice)
    if key in memo:
        return memo[key]
    best = 0
    for d in set(dice):
        rest = list(dice)
        rest.remove(d)
        rest_t = tuple(sorted(rest))
        for p in range(24):
            if mine[p] <= 0:
                continue
            res = _single(mine, oppm, off, head, head_limit, p, d)
            if res is None:
                continue
            val = 1 + _best(res[0], oppm, res[1], res[2], head_limit, rest_t, memo)
            if val > best:
                best = val
                if best == len(dice):
                    memo[key] = best
                    return best
    memo[key] = best
    return best


def compute_legal(state: Dict[str, Any]) -> List[Dict[str, Any]]:
    side = state['turn']
    dice = tuple(sorted(state.get('dice') or []))
    if not dice:
        return []
    mine = tuple(_mine(state, side))
    oppm = _opp(state, side)
    off = state['off_' + side]
    head = state['head_taken']
    hl = state['head_limit']
    memo: Dict[Any, int] = {}
    m = _best(mine, oppm, off, head, hl, dice, memo)
    if m == 0:
        return []
    options = []
    for d in set(dice):
        rest = list(dice)
        rest.remove(d)
        rest_t = tuple(sorted(rest))
        for p in range(24):
            res = _single(mine, oppm, off, head, hl, p, d)
            if res is None:
                continue
            if 1 + _best(res[0], oppm, res[1], res[2], hl, rest_t, memo) == m:
                options.append((p, d))
    if m == 1 and len(dice) == 2 and dice[0] != dice[1]:
        big = max(dice)
        if any(d == big for _, d in options):
            options = [(p, d) for p, d in options if d == big]
    o = OFFSET[side]
    result = []
    for p, d in options:
        q = p + d
        result.append({'from': (p + o) % 24, 'die': d, 'to': (q + o) % 24 if q < 24 else None})
    return result


def _end_turn(state: Dict[str, Any]) -> None:
    side = state['turn']
    state['first'][side] = False
    state['turn'] = other(side)
    state['rolled'] = False
    state['dice'] = []
    state['legal'] = []
    state['head_taken'] = 0
    state['head_limit'] = 1


def roll(state: Dict[str, Any], rng=random) -> Optional[str]:
    if state.get('winner'):
        return 'Игра окончена'
    if state['rolled']:
        return 'Кубики уже брошены'
    a, b = rng.randint(1, 6), rng.randint(1, 6)
    side = state['turn']
    state['last_roll'] = [a, b]
    state['dice'] = [a] * 4 if a == b else [a, b]
    state['rolled'] = True
    state['head_taken'] = 0
    state['head_limit'] = 2 if (state['first'][side] and a == b and a in (3, 4, 6)) else 1
    state['seq'] += 1
    state['legal'] = compute_legal(state)
    if not state['legal']:
        state['event'] = {'t': 'pass', 'by': side}
        _end_turn(state)
    else:
        state['event'] = {'t': 'roll', 'by': side}
    return None


def move(state: Dict[str, Any], src: Any, die: Any) -> Optional[str]:
    if state.get('winner'):
        return 'Игра окончена'
    if not state['rolled']:
        return 'Сначала бросьте кубики'
    chosen = None
    for m in state['legal']:
        if m['from'] == src and m['die'] == die:
            chosen = m
            break
    if not chosen:
        return 'Так ходить нельзя'
    side = state['turn']
    arr = state['pts_' + side]
    arr[chosen['from']] -= 1
    if chosen['to'] is None:
        state['off_' + side] += 1
    else:
        arr[chosen['to']] += 1
    o = OFFSET[side]
    if (chosen['from'] - o) % 24 == 0:
        state['head_taken'] += 1
    state['dice'].remove(die)
    state['seq'] += 1
    state['event'] = {'t': 'off' if chosen['to'] is None else 'move', 'by': side}
    if state['off_' + side] >= TOTAL:
        state['winner'] = side
        state['dice'] = []
        state['legal'] = []
        state['rolled'] = False
        return None
    state['legal'] = compute_legal(state) if state['dice'] else []
    if not state['legal']:
        _end_turn(state)
    return None
