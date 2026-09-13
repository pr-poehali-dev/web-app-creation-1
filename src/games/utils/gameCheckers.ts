// Отправка хода в шашечную партию на сервер для проверки и сохранения.
import func2url from '../../../backend/func2url.json';
import { getGameToken } from './gameAuth';
import { CBoard } from './checkersEngine';

const GAME_CHECKERS_API = (func2url as Record<string, string>)['game-checkers'] || '';

export interface CheckersMoveResult {
  success: boolean;
  board?: CBoard;
  must_continue?: [number, number] | null;
  promoted?: boolean;
  status?: string;
  winner_id?: number | null;
  error?: string;
}

export const sendCheckersMove = async (
  roomId: number,
  from: [number, number],
  to: [number, number]
): Promise<CheckersMoveResult> => {
  const token = getGameToken();
  const response = await fetch(GAME_CHECKERS_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Game-Token': token } : {}),
    },
    body: JSON.stringify({ room_id: roomId, from, to }),
  });
  const data = await response.json();
  if (!response.ok) {
    return { success: false, error: data.error || 'Не удалось сделать ход' };
  }
  return data;
};
