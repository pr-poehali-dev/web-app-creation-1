'''
Движок карточной игры «Баарыс» для двоих (36 карт).
Чистая логика без БД: состояние хранится в game_rooms.state.
Карта = ранг + масть: '6S', 'TH', 'AD' (T = десятка; S пики, H червы, D бубны, C трефы).
'''
import random
from typing import Dict, Any, List, Optional

RANKS = '6789JQKTA'
SUITS = 'SHDC'
HAND_SIZE = 6
TARGET = 101
TURN_SECONDS = 180
MAX_SKIPS = 3
POINTS = {'A': 11, 'T': 10, 'K': 4, 'Q': 3, 'J': 2}
MARRIAGE = 20
TRUMP_MARRIAGE = 40
LAST_TRICK_BONUS = 10


def rank(card: str) -> int:
    return RANKS.index(card[0])


def suit(card: str) -> str:
    return card[1]


def points(card: str) -> int:
    return POINTS.get(card[0], 0)


def can_beat(att: str, dfn: str, trump: str) -> bool:
    if suit(att) == suit(dfn):
        return rank(dfn) > rank(att)
    return suit(dfn) == trump and suit(att) != trump


def find_matching(lead: List[str], cards: List[str], trump: str) -> Optional[List[str]]:
    def rec(i: int, remaining: List[str]) -> Optional[List[str]]:
        if i == len(lead):
            return []
        for c in remaining:
            if can_beat(lead[i], c, trump):
                rest = rec(i + 1, [x for x in remaining if x != c])
                if rest is not None:
                    return [c] + rest
        return None
    return rec(0, list(cards))


def marriage_bonus(cards: List[str], trump: str) -> int:
    ranks = {c[0] for c in cards}
    if 'Q' in ranks and 'K' in ranks:
        return TRUMP_MARRIAGE if suit(cards[0]) == trump else MARRIAGE
    return 0


def _log(s, **ev):
    log = s.setdefault('log', [])
    log.append(ev)
    del log[:-8]


def other(s, uid: str) -> str:
    return s['order'][1] if s['order'][0] == uid else s['order'][0]


def _add(s, uid: str, n: int):
    s['scores'][uid] += n
    s['game_points'][uid] = s['game_points'].get(uid, 0) + n


def _close_game(s):
    s.setdefault('history', []).append({'game_no': s['game_no'], 'points': dict(s['game_points'])})


def _deal(s):
    deck = [r + sd for r in RANKS for sd in SUITS]
    random.shuffle(deck)
    hands = {u: [] for u in s['order']}
    for _ in range(HAND_SIZE):
        for u in s['order']:
            hands[u].append(deck.pop())
    s['hands'] = hands
    s['deck'] = deck
    s['trump_card'] = deck[0]
    s['trump'] = suit(deck[0])
    s['leader'] = other(s, s['dealer'])
    s['game_points'] = {u: 0 for u in s['order']}
    s['lead'] = []
    s['demand'] = False
    s['last_trick'] = None
    _log(s, t='deal', by=s['leader'], n=s['game_no'])


def new_match(order: List[str]) -> Dict[str, Any]:
    s = {
        'phase': 'playing', 'order': list(order), 'scores': {u: 0 for u in order},
        'game_no': 1, 'dealer': random.choice(order), 'winner': None,
        'multiplier': 1, 'reason': None, 'log': [], 'history': [],
    }
    _deal(s)
    return s


def current_turn(s) -> Optional[str]:
    if s.get('phase') != 'playing':
        return None
    if not s['lead']:
        return s['leader']
    return other(s, s['leader'])


def _win(s, uid: str, mult: int, reason: str):
    s['phase'] = 'finished'
    s['winner'] = uid
    s['multiplier'] = mult
    s['reason'] = reason
    s['lead'] = []
    _log(s, t='win', by=uid, n=mult)


def forfeit(s, uid: str):
    _win(s, other(s, uid), 1, 'forfeit')
    _log(s, t='forfeit', by=uid)


def _refill(s, first: str):
    users = (first, other(s, first))
    while s['deck'] and any(len(s['hands'][u]) < HAND_SIZE for u in users):
        for u in users:
            if s['deck'] and len(s['hands'][u]) < HAND_SIZE:
                s['hands'][u].append(s['deck'].pop())


def _validate_cards(hand: List[str], cards) -> Optional[str]:
    if not isinstance(cards, list) or not cards or not all(isinstance(c, str) for c in cards):
        return 'Выберите карты'
    if len(set(cards)) != len(cards):
        return 'Карты не должны повторяться'
    if any(c not in hand for c in cards):
        return 'У вас нет такой карты'
    return None


def _lead(s, uid: str, body) -> Optional[str]:
    if uid != s['leader'] or s['lead']:
        return 'Сейчас не ваш заход'
    hand = s['hands'][uid]
    cards = body.get('cards')
    err = _validate_cards(hand, cards)
    if err:
        return err
    if len(cards) > HAND_SIZE:
        return 'Не больше шести карт'
    if len({suit(c) for c in cards}) != 1:
        return 'Ходить нужно картами одной масти'
    if len(cards) > len(s['hands'][other(s, uid)]):
        return 'У соперника не хватит карт, чтобы ответить'
    demand = bool(body.get('demand'))
    if demand:
        if s['deck']:
            return 'Требовать козыри можно только когда колода закончилась'
        if any(suit(c) != s['trump'] for c in cards):
            return 'Требовать можно только козырными картами'
    for c in cards:
        hand.remove(c)
    s['lead'] = list(cards)
    s['demand'] = demand
    _log(s, t='lead', by=uid, n=len(cards), demand=demand)
    if len(cards) == HAND_SIZE and all(suit(c) == s['trump'] for c in cards):
        _log(s, t='baarys', by=uid)
        _win(s, uid, 2, 'baarys')
        s['lead'] = list(cards)
    return None


def _respond(s, uid: str, body) -> Optional[str]:
    if not s['lead'] or uid == s['leader']:
        return 'Сейчас не ваш ответ'
    hand = s['hands'][uid]
    cards = body.get('cards')
    err = _validate_cards(hand, cards)
    if err:
        return err
    lead = s['lead']
    if len(cards) != len(lead):
        return 'Нужно ответить столькими же картами'
    trump = s['trump']
    match = find_matching(lead, cards, trump)
    beaten = match is not None
    if not beaten and s['demand']:
        have = [c for c in hand if suit(c) == trump]
        given = [c for c in cards if suit(c) == trump]
        if len(given) < min(len(lead), len(have)):
            return 'Соперник потребовал козыри: отдайте все свои козыри'
    for c in cards:
        hand.remove(c)
    leader = s['leader']
    resp = match if beaten else list(cards)
    allc = lead + resp
    pts = sum(points(c) for c in allc)
    bonus = 0
    winner = uid if beaten else leader
    if not beaten and s['game_no'] == 1 and s['deck']:
        bonus = marriage_bonus(lead, trump)
    _add(s, winner, pts + bonus)
    s['last_trick'] = {
        'leader': leader, 'winner': winner, 'lead': list(lead), 'resp': resp,
        'beaten': beaten, 'points': pts, 'bonus': bonus,
    }
    s['lead'] = []
    s['demand'] = False
    _log(s, t='beat' if beaten else 'take', by=winner, n=pts)
    if bonus:
        _log(s, t='bonus', by=winner, n=bonus)
    _refill(s, winner)
    s['leader'] = winner

    if s['scores'][winner] >= TARGET:
        _close_game(s)
        _win(s, winner, 2 if s['game_no'] == 1 else 1, 'points')
        return None

    if not s['deck'] and any(not s['hands'][u] for u in s['order']):
        _add(s, winner, LAST_TRICK_BONUS)
        _log(s, t='last', by=winner, n=LAST_TRICK_BONUS)
        _close_game(s)
        if s['scores'][winner] >= TARGET:
            _win(s, winner, 2 if s['game_no'] == 1 else 1, 'points')
            return None
        _log(s, t='game_end', n=s['game_no'])
        s['game_no'] += 1
        s['dealer'] = winner
        trick = s['last_trick']
        _deal(s)
        s['last_trick'] = trick
    return None


def _swap(s, uid: str) -> Optional[str]:
    six = '6' + s['trump']
    hand = s['hands'][uid]
    if six not in hand:
        return 'У вас нет козырной шестёрки'
    if not s['deck'] or s['trump_card'] == six:
        return 'Козырь уже нельзя поменять'
    if current_turn(s) != uid:
        return 'Поменять козырь можно в свой ход'
    hand.remove(six)
    hand.append(s['trump_card'])
    s['deck'][0] = six
    s['trump_card'] = six
    _log(s, t='swap', by=uid, card=six)
    return None


def apply_action(s, uid: str, action: str, body: Dict[str, Any]) -> Optional[str]:
    if s.get('phase') != 'playing':
        return 'Партия уже закончена'
    if action == 'lead':
        return _lead(s, uid, body)
    if action == 'respond':
        return _respond(s, uid, body)
    if action == 'swap':
        return _swap(s, uid)
    return 'Неизвестное действие'


def auto_move(s, uid: str):
    trump = s['trump']
    hand = s['hands'][uid]
    ordered = sorted(hand, key=lambda c: (suit(c) == trump, rank(c)))
    if not s['lead']:
        return 'lead', {'cards': [ordered[0]]}
    lead = s['lead']
    chosen: List[str] = []
    pool = list(ordered)
    for a in lead:
        pick = next((c for c in pool if can_beat(a, c, trump)), None)
        if pick is None:
            chosen = []
            break
        chosen.append(pick)
        pool.remove(pick)
    if len(chosen) == len(lead):
        return 'respond', {'cards': chosen}
    n = len(lead)
    if s['demand']:
        ordered = sorted(hand, key=lambda c: (suit(c) != trump, rank(c)))
    return 'respond', {'cards': ordered[:n]}
