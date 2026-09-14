// Действия в покерной партии: раздача, fold/check/call/raise.
// Использует общую функцию game-move (шахматы+шашки+покер), тип игры сервер
// определяет по комнате.
import func2url from '../../../backend/func2url.json';
import { getGameToken } from './gameAuth';

const GAME_MOVE_API = (func2url as Record<string, string>)['game-move'] || '';

export type PokerAction = 'start_hand' | 'fold' | 'check' | 'call' | 'raise';

export interface PokerActionResult {
  success: boolean;
  stage?: string;
  status?: string;
  winner_id?: number | null;
  error?: string;
}

export interface PokerPlayerState {
  hole_cards?: string[];
  bet_this_round: number;
  total_bet_this_hand: number;
  folded: boolean;
  all_in: boolean;
  has_acted: boolean;
}

export interface PokerLastResult {
  winnings: Record<string, number>;
  hands: Record<string, string>;
  community_cards: string[];
  hole_cards: Record<string, string[]>;
}

export interface PokerState {
  hand_number: number;
  community_cards: string[];
  stage: 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  pot: number;
  dealer_seat_index: number;
  current_bet: number;
  players: Record<string, PokerPlayerState>;
  last_result: PokerLastResult | null;
}

export const sendPokerAction = async (
  roomId: number,
  action: PokerAction,
  amount?: number
): Promise<PokerActionResult> => {
  const token = getGameToken();
  const response = await fetch(GAME_MOVE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Game-Token': token } : {}),
    },
    body: JSON.stringify({ room_id: roomId, action, amount }),
  });
  const data = await response.json();
  if (!response.ok) {
    return { success: false, error: data.error || 'Не удалось выполнить действие' };
  }
  return data;
};
