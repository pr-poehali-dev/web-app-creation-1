import func2url from '../../../backend/func2url.json';
import { getGameToken } from './gameAuth';

const GAME_MOVE_API = (func2url as Record<string, string>)['game-move'] || '';

export type BaarysAction = 'start' | 'lead' | 'respond' | 'timeout';

export interface BaarysTrick {
  leader: string;
  winner: string;
  lead: string[];
  resp: string[];
  beaten: boolean;
  points: number;
  bonus: number;
}

export interface BaarysLogEvent {
  t: string;
  by?: string | null;
  n?: number;
  demand?: boolean;
}

export interface BaarysState {
  phase: 'playing' | 'finished';
  order: string[];
  hands: Record<string, string[]>;
  counts: Record<string, number>;
  deck_count: number;
  trump: string;
  trump_card: string;
  leader: string;
  lead: string[];
  demand: boolean;
  scores: Record<string, number>;
  game_no: number;
  dealer: string;
  winner: string | null;
  multiplier: number;
  reason: string | null;
  last_trick: BaarysTrick | null;
  log: BaarysLogEvent[];
  turn_left: number | null;
}

export const TARGET = 101;
const RANKS = '6789TJQKA';

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

export const sendBaarysAction = async (
  roomId: number,
  action: BaarysAction,
  extra?: { cards?: string[]; demand?: boolean }
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
