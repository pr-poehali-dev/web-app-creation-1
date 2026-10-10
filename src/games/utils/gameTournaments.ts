// API турниров и мониторинга игровых комнат (backend: game-rooms).
import func2url from '../../../backend/func2url.json';
import { getGameToken } from './gameAuth';

export const GAME_ADMIN_API = (func2url as Record<string, string>)['game-rooms'] || '';

export interface Tournament {
  id: number;
  name: string;
  description?: string;
  game_type: 'chess' | 'checkers';
  status: 'registration' | 'active' | 'finished' | 'cancelled';
  min_players: number;
  max_players: number;
  entry_fee: number;
  move_timeout_minutes: number;
  prize_pool: number;
  starts_at: string | null;
  current_round: number;
  winner_nickname?: string | null;
  players_count: number;
  joined?: boolean;
  players?: { user_id: number; nickname: string; avatar_emoji: string; eliminated: boolean }[];
  matches?: TournamentMatch[];
}

export interface TournamentMatch {
  id: number;
  round: number;
  match_index: number;
  player1_id: number | null;
  player2_id: number | null;
  p1_nickname: string | null;
  p2_nickname: string | null;
  room_id: number | null;
  winner_id: number | null;
  status: string;
}

export const adminCall = async (action: string, opts: { query?: Record<string, string | number>; body?: object } = {}) => {
  if (!GAME_ADMIN_API) throw new Error('Сервис ещё разворачивается');
  const adminId = localStorage.getItem('userId') || '';
  const qs = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(opts.query || {}).map(([k, v]) => [k, String(v)])) });
  const res = await fetch(`${GAME_ADMIN_API}?${qs}`, {
    method: opts.body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Id': adminId },
    body: opts.body ? JSON.stringify({ action, ...opts.body }) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка');
  return data;
};

export const playerCall = async (action: string, opts: { query?: Record<string, string | number>; body?: object } = {}) => {
  if (!GAME_ADMIN_API) throw new Error('Сервис ещё разворачивается');
  const qs = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(opts.query || {}).map(([k, v]) => [k, String(v)])) });
  const res = await fetch(`${GAME_ADMIN_API}?${qs}`, {
    method: opts.body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', 'X-Game-Token': getGameToken() || '' },
    body: opts.body ? JSON.stringify({ action, ...opts.body }) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка');
  return data;
};

export const STATUS_LABEL: Record<string, string> = {
  registration: 'Регистрация',
  active: 'Идёт',
  finished: 'Завершён',
  cancelled: 'Отменён',
};
export const GAME_LABEL: Record<string, string> = { chess: 'Шахматы', checkers: 'Шашки', poker: 'Покер' };

export const formatTimeout = (min: number) =>
  min >= 1440 && min % 1440 === 0 ? `${min / 1440} сут.` : min >= 60 && min % 60 === 0 ? `${min / 60} ч` : `${min} мин`;
