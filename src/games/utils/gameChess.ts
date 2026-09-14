// Отправка хода в шахматную партию на сервер для проверки и сохранения.
// Использует общую для всех настольных игр функцию game-move (объединена с шашками,
// чтобы уложиться в лимит backend-функций) — тип игры сервер определяет по комнате.
import func2url from '../../../backend/func2url.json';
import { getGameToken } from './gameAuth';

const GAME_MOVE_API = (func2url as Record<string, string>)['game-move'] || '';

export interface MoveResult {
  success: boolean;
  fen?: string;
  is_check?: boolean;
  is_checkmate?: boolean;
  is_stalemate?: boolean;
  is_draw?: boolean;
  status?: string;
  winner_id?: number | null;
  error?: string;
}

export const sendChessMove = async (roomId: number, moveUci: string): Promise<MoveResult> => {
  const token = getGameToken();
  const response = await fetch(GAME_MOVE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Game-Token': token } : {}),
    },
    body: JSON.stringify({ room_id: roomId, move: moveUci }),
  });
  const data = await response.json();
  if (!response.ok) {
    return { success: false, error: data.error || 'Не удалось сделать ход' };
  }
  return data;
};