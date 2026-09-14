// Работа с игровыми комнатами: список, создание, присоединение.
import func2url from '../../../backend/func2url.json';
import { getGameToken } from './gameAuth';

const GAME_ROOMS_API = (func2url as Record<string, string>)['game-rooms'] || '';

export type GameType = 'chess' | 'checkers' | 'poker';

export interface GameRoomListItem {
  id: number;
  game_type: GameType;
  room_name: string;
  status: string;
  max_players: number;
  is_private: boolean;
  created_at: string;
  created_by: number;
  created_by_nickname: string;
  invite_code: string | null;
  players_count: number;
}

export interface GameRoomPlayer {
  id: number;
  room_id: number;
  user_id: number;
  seat_index: number;
  side: string | null;
  chips: number | null;
  nickname: string;
  avatar_emoji: string;
}

export interface GameRoomDetail {
  id: number;
  game_type: GameType;
  room_name: string;
  status: string;
  max_players: number;
  created_by: number;
  created_by_nickname: string;
  state: Record<string, unknown>;
  current_turn_user_id: number | null;
  winner_id: number | null;
  is_private: boolean;
  invite_code: string | null;
  players: GameRoomPlayer[];
}

function authHeaders(): HeadersInit {
  const token = getGameToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'X-Game-Token': token } : {}),
  };
}

export const listGameRooms = async (gameType?: GameType): Promise<GameRoomListItem[]> => {
  const url = gameType ? `${GAME_ROOMS_API}?game_type=${gameType}` : GAME_ROOMS_API;
  const response = await fetch(url, { headers: authHeaders() });
  if (!response.ok) throw new Error('Не удалось загрузить список комнат');
  return response.json();
};

export const getGameRoom = async (roomId: number): Promise<GameRoomDetail> => {
  const response = await fetch(`${GAME_ROOMS_API}?room_id=${roomId}`, { headers: authHeaders() });
  if (!response.ok) throw new Error('Комната не найдена');
  return response.json();
};

export const createGameRoom = async (
  gameType: GameType,
  roomName?: string,
  isPrivate?: boolean
): Promise<{ room_id: number; invite_code?: string }> => {
  const response = await fetch(GAME_ROOMS_API, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ action: 'create', game_type: gameType, room_name: roomName, is_private: isPrivate }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.error || 'Не удалось создать комнату');
  return data;
};

export const joinGameRoom = async (roomId?: number, inviteCode?: string): Promise<{ room_id: number }> => {
  const response = await fetch(GAME_ROOMS_API, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ action: 'join', room_id: roomId, invite_code: inviteCode }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.error || 'Не удалось присоединиться к комнате');
  return data;
};

export const deleteGameRoom = async (roomId: number): Promise<void> => {
  const response = await fetch(GAME_ROOMS_API, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ action: 'delete', room_id: roomId }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.error || 'Не удалось удалить комнату');
};

export const leaveGameRoom = async (roomId: number): Promise<void> => {
  const response = await fetch(GAME_ROOMS_API, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ action: 'leave', room_id: roomId }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.error || 'Не удалось покинуть комнату');
};

// Покерный стол собирает игроков (до 8) в статусе 'waiting' — создатель явно
// запускает игру, когда набралось достаточно участников.
export const startPokerTable = async (roomId: number): Promise<void> => {
  const response = await fetch(GAME_ROOMS_API, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ action: 'start_table', room_id: roomId }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.error || 'Не удалось начать игру');
};