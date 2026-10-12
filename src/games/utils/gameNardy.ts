import func2url from '../../../backend/func2url.json';
import { getGameToken } from './gameAuth';

const GAME_MOVE_API = (func2url as Record<string, string>)['game-move'] || '';

export interface NardyLegalMove {
  from: number;
  die: number;
  to: number | null;
}

export interface NardyState {
  pts_w: number[];
  pts_b: number[];
  off_w: number;
  off_b: number;
  turn: 'w' | 'b';
  rolled: boolean;
  dice: number[];
  last_roll: number[] | null;
  legal: NardyLegalMove[];
  winner: 'w' | 'b' | null;
  seq: number;
  event: { t: string; by: 'w' | 'b' } | null;
}

export const sendNardyAction = async (
  roomId: number,
  action: 'roll' | 'move',
  extra?: { from?: number; die?: number }
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
