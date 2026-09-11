// Отправка хода в шахматную партию на сервер для проверки и сохранения.
import func2url from '../../../backend/func2url.json';
import { getGameToken } from './gameAuth';

const GAME_CHESS_API = (func2url as Record<string, string>)['game-chess'] || '';

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
  const response = await fetch(GAME_CHESS_API, {
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
