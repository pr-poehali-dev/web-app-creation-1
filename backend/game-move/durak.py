'''
Движок переводного подкидного дурака на 36 карт (2-6 игроков).
Чистая логика без БД: состояние хранится в game_rooms.state.
Карта = ранг + масть: '6S', 'TH', 'AD' (T = десятка; S пики, H червы, D бубны, C трефы).
'''
import random
from typing import Dict, Any, List, Optional

RANKS = '6789TJQKA'
SUITS = 'SHDC'
HAND_SIZE = 6
MAX_ATTACKS = 6
TURN_SECONDS = 60
MAX_SKIPS = 3


def rank(card: str) -> int:
    return RANKS.index(card[0])


def suit(card: str) -> str:
    return card[1]


def can_beat(att: str, dfn: str, trump: str) -> bool:
    if suit(att) == suit(dfn):
        return rank(dfn) > rank(att)
    return suit(dfn) == trump and suit(att) != trump


def next_active(s: Dict[str, Any], uid: str) -> Optional[str]:
    order = s['order']
    n = len(order)
    i = order.index(uid)
    for k in range(1, n + 1):
        c = order[(i + k) % n]
        if c != uid and c not in s['out']:
            return c
    return None


def new_game(order: List[str]) -> Dict[str, Any]:
    deck = [r + sd for r in RANKS for sd in SUITS]
    random.shuffle(deck)
    hands = {u: [] for u in order}
    for _ in range(HAND_SIZE):
        for u in order:
            hands[u].append(deck.pop())
    trump_card = deck[0] if deck else hands[order[-1]][-1]
    trump = suit(trump_card)
    best = None
    for u in order:
        tr = [rank(c) for c in hands[u] if suit(c) == trump]
        if tr and (best is None or min(tr) < best[0]):
            best = (min(tr), u)
    attacker = best[1] if best else random.choice(order)
    s = {
        'phase': 'playing', 'order': list(order), 'hands': hands, 'deck': deck,
        'trump': trump, 'trump_card': trump_card, 'attacker': attacker, 'defender': None,
        'table': [], 'passed': [], 'taking': False, 'out': [], 'loser': None,
        'round': 1, 'discard': 0, 'log': [],
    }
    s['defender'] = next_active(s, attacker)
    _log(s, t='deal', by=attacker)
    return s


def _log(s, **ev):
    log = s.setdefault('log', [])
    log.append(ev)
    del log[:-8]


def _table_ranks(s) -> set:
    r = set()
    for p in s['table']:
        r.add(p['a'][0])
        if p['d']:
            r.add(p['d'][0])
    return r


def _unbeaten(s) -> list:
    return [p for p in s['table'] if p['d'] is None]


def can_add_card(s, uid: str, card: str) -> bool:
    if card not in s['hands'].get(uid, []):
        return False
    if uid == s['defender'] or uid in s['out']:
        return False
    t = s['table']
    if not t:
        return uid == s['attacker']
    if len(t) >= MAX_ATTACKS:
        return False
    if len(_unbeaten(s)) + 1 > len(s['hands'][s['defender']]):
        return False
    return card[0] in _table_ranks(s)


def can_add_any(s, uid: str) -> bool:
    return any(can_add_card(s, uid, c) for c in s['hands'].get(uid, []))


def _refill_sequence(s) -> List[str]:
    order = s['order']
    n = len(order)
    i = order.index(s['attacker'])
    seq = [order[(i + k) % n] for k in range(n)]
    seq = [u for u in seq if u != s['defender']] + [s['defender']]
    return [u for u in seq if u not in s['out']]


def _refill(s):
    for u in _refill_sequence(s):
        h = s['hands'][u]
        while len(h) < HAND_SIZE and s['deck']:
            h.append(s['deck'].pop())


def _update_out(s):
    if s['deck']:
        return
    for u in s['order']:
        if u not in s['out'] and not s['hands'][u]:
            s['out'].append(u)
            _log(s, t='out', by=u)


def _finish(s, remaining: List[str]):
    s['phase'] = 'finished'
    s['loser'] = remaining[0] if len(remaining) == 1 else None
    s['table'] = []
    s['passed'] = []
    s['taking'] = False
    _log(s, t='finish', by=s['loser'])


def _after_round(s, took: bool):
    d = s['defender']
    _refill(s)
    _update_out(s)
    remaining = [u for u in s['order'] if u not in s['out']]
    s['round'] += 1
    if len(remaining) <= 1:
        _finish(s, remaining)
        return
    if took:
        na = next_active(s, d)
    else:
        na = d if d not in s['out'] else next_active(s, d)
    s['attacker'] = na
    s['defender'] = next_active(s, na)


def _end_bito(s):
    s['discard'] += sum(2 if p['d'] else 1 for p in s['table'])
    s['table'] = []
    s['passed'] = []
    s['taking'] = False
    _log(s, t='bito', by=s['attacker'])
    _after_round(s, took=False)


def _end_take(s):
    d = s['defender']
    n = 0
    for p in s['table']:
        s['hands'][d].append(p['a'])
        n += 1
        if p['d']:
            s['hands'][d].append(p['d'])
            n += 1
    s['table'] = []
    s['passed'] = []
    s['taking'] = False
    _log(s, t='took', by=d, n=n)
    _after_round(s, took=True)


def resolve(s):
    if not s['table'] or s['phase'] != 'playing':
        return
    if _unbeaten(s) and not s['taking']:
        return
    d = s['defender']
    room_for_more = len(s['table']) < MAX_ATTACKS and len(_unbeaten(s)) + 1 <= len(s['hands'][d])
    if room_for_more:
        for p in s['order']:
            if p == d or p in s['out'] or not s['hands'][p] or p in s['passed']:
                continue
            return
    if s['taking']:
        _end_take(s)
    else:
        _end_bito(s)


def current_turn(s) -> Optional[str]:
    if s.get('phase') != 'playing':
        return None
    if not s['table']:
        return s['attacker']
    if _unbeaten(s) and not s['taking']:
        return s['defender']
    for p in [s['attacker']] + [u for u in s['order'] if u != s['attacker']]:
        if p != s['defender'] and p not in s['out'] and p not in s['passed'] and s['hands'][p]:
            return p
    return s['attacker']


def apply_action(s, uid: str, action: str, body: Dict[str, Any]) -> Optional[str]:
    if uid in s['out']:
        return 'Вы уже вышли из игры'
    card = body.get('card')
    hand = s['hands'][uid]

    if action == 'attack':
        if not isinstance(card, str) or not can_add_card(s, uid, card):
            if uid == s['defender']:
                return 'Вы сейчас отбиваетесь'
            if not s['table'] and uid != s['attacker']:
                return 'Сейчас атакует другой игрок'
            return 'Эту карту сейчас нельзя подкинуть'
        hand.remove(card)
        s['table'].append({'a': card, 'd': None})
        s['passed'] = []
        _log(s, t='attack', by=uid, card=card)

    elif action == 'defend':
        if uid != s['defender']:
            return 'Сейчас вы не отбиваетесь'
        if s['taking']:
            return 'Вы уже решили взять карты'
        target = body.get('target')
        if not isinstance(card, str) or card not in hand:
            return 'У вас нет такой карты'
        if not isinstance(target, int) or not (0 <= target < len(s['table'])) or s['table'][target]['d']:
            return 'Выберите непобитую карту на столе'
        att = s['table'][target]['a']
        if not can_beat(att, card, s['trump']):
            return 'Этой картой нельзя побить'
        hand.remove(card)
        s['table'][target]['d'] = card
        s['passed'] = []
        _log(s, t='defend', by=uid, card=card, target=att)

    elif action == 'transfer':
        if uid != s['defender']:
            return 'Перевести может только отбивающийся'
        if s['taking']:
            return 'Вы уже решили взять карты'
        if not s['deck']:
            return 'Когда колода закончилась, переводить нельзя'
        t = s['table']
        if not t or any(p['d'] for p in t):
            return 'Перевести можно, пока не побита ни одна карта'
        if not isinstance(card, str) or card not in hand:
            return 'У вас нет такой карты'
        if card[0] != t[0]['a'][0]:
            return 'Для перевода нужна карта того же достоинства'
        nd = next_active(s, uid)
        if nd is None or len(t) + 1 > len(s['hands'][nd]) or len(t) + 1 > MAX_ATTACKS:
            return 'У следующего игрока не хватит карт для перевода'
        hand.remove(card)
        t.append({'a': card, 'd': None})
        s['attacker'] = uid
        s['defender'] = nd
        s['passed'] = []
        _log(s, t='transfer', by=uid, card=card, to=nd)

    elif action == 'take':
        if uid != s['defender']:
            return 'Брать карты может только отбивающийся'
        if not _unbeaten(s) or s['taking']:
            return 'Сейчас нечего брать'
        s['taking'] = True
        s['passed'] = []
        _log(s, t='take', by=uid)

    elif action == 'swap':
        six = '6' + s['trump']
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

    elif action == 'pass':
        if uid == s['defender']:
            return 'Отбивающийся не может сказать «бито»'
        if not s['table']:
            return 'Сначала нужно атаковать'
        if uid not in s['passed']:
            s['passed'].append(uid)

    else:
        return 'Неизвестное действие'

    resolve(s)
    return None


def auto_move(s, uid: str):
    if uid == s['defender']:
        return 'take', {}
    if not s['table']:
        hand = sorted(s['hands'][uid], key=lambda c: (suit(c) == s['trump'], rank(c)))
        return 'attack', {'card': hand[0]}
    return 'pass', {}


def forfeit(s, uid: str):
    s['phase'] = 'finished'
    s['loser'] = uid
    s['table'] = []
    s['passed'] = []
    s['taking'] = False
    _log(s, t='forfeit', by=uid)
