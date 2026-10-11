import func2url from '../../../backend/func2url.json';
import { getGameToken } from './gameAuth';

const GAME_MOVE_API = (func2url as Record<string, string>)['game-move'] || '';

export type DurakAction = 'start' | 'attack' | 'defend' | 'transfer' | 'take' | 'pass' | 'timeout';

export interface DurakPair {
  a: string;
  d: string | null;
}

export interface DurakLogEvent {
  t: string;
  by?: string | null;
  card?: string;
  to?: string;
  n?: number;
}

export interface DurakState {
  phase: 'playing' | 'finished';
  order: string[];
  hands: Record<string, string[]>;
  counts: Record<string, number>;
  deck_count: number;
  trump: string;
  trump_card: string;
  attacker: string;
  defender: string;
  table: DurakPair[];
  passed: string[];
  taking: boolean;
  out: string[];
  loser: string | null;
  round: number;
  discard: number;
  log: DurakLogEvent[];
  turn_left: number | null;
}

const RANKS = '6789TJQKA';
const MAX_ATTACKS = 6;

export const rankOf = (card: string) => RANKS.indexOf(card[0]);

export const canBeat = (att: string, dfn: string, trump: string): boolean => {
  if (att[1] === dfn[1]) return rankOf(dfn) > rankOf(att);
  return dfn[1] === trump && att[1] !== trump;
};

export const sortHand = (hand: string[], trump: string): string[] =>
  [...hand].sort((x, y) => {
    const tx = x[1] === trump ? 1 : 0;
    const ty = y[1] === trump ? 1 : 0;
    if (tx !== ty) return tx - ty;
    if (x[1] !== y[1]) return x[1].localeCompare(y[1]);
    return rankOf(x) - rankOf(y);
  });

export const tableRanks = (table: DurakPair[]): Set<string> => {
  const set = new Set<string>();
  table.forEach((p) => {
    set.add(p.a[0]);
    if (p.d) set.add(p.d[0]);
  });
  return set;
};

export const canAddCard = (s: DurakState, uid: string, card: string): boolean => {
  if (uid === s.defender || s.out.includes(uid) || s.phase !== 'playing') return false;
  if (s.table.length === 0) return uid === s.attacker;
  if (s.table.length >= MAX_ATTACKS) return false;
  const unbeaten = s.table.filter((p) => !p.d).length;
  if (unbeaten + 1 > (s.counts[s.defender] ?? 0)) return false;
  return tableRanks(s.table).has(card[0]);
};

export const nextActive = (s: DurakState, uid: string): string | null => {
  const n = s.order.length;
  const i = s.order.indexOf(uid);
  for (let k = 1; k <= n; k++) {
    const c = s.order[(i + k) % n];
    if (c !== uid && !s.out.includes(c)) return c;
  }
  return null;
};

export const canTransferCard = (s: DurakState, card: string): boolean => {
  if (s.taking || s.table.length === 0 || s.table.some((p) => p.d)) return false;
  if (card[0] !== s.table[0].a[0]) return false;
  const nd = nextActive(s, s.defender);
  if (!nd) return false;
  return s.table.length + 1 <= (s.counts[nd] ?? 0) && s.table.length + 1 <= MAX_ATTACKS;
};

export const sendDurakAction = async (
  roomId: number,
  action: DurakAction,
  extra?: { card?: string; target?: number }
): Promise<{ success: boolean; error?: string }> => {
  const token = getGameToken();
  const response = await fetch(GAME_MOVE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Game-Token': token } : {}) },
    body: JSON.stringify({ room_id: roomId, action, ...extra }),
  });
  const data = await response.json();
  if (!response.ok) return { success: false, error: data.error || 'Не удалось выполнить действие' };
  return data;
};
