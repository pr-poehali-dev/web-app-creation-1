// Чат внутри игровой комнаты.
import func2url from '../../../backend/func2url.json';
import { getGameToken } from './gameAuth';

const GAME_CHAT_API = (func2url as Record<string, string>)['game-chat'] || '';

export interface ChatMessage {
  id: number;
  user_id: number;
  message: string;
  created_at: string;
  nickname: string;
  avatar_emoji: string;
}

function authHeaders(): HeadersInit {
  const token = getGameToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'X-Game-Token': token } : {}),
  };
}

export const getChatMessages = async (roomId: number): Promise<ChatMessage[]> => {
  const response = await fetch(`${GAME_CHAT_API}?room_id=${roomId}`, { headers: authHeaders() });
  if (!response.ok) throw new Error('Не удалось загрузить чат');
  return response.json();
};

export const sendChatMessage = async (roomId: number, message: string): Promise<void> => {
  const response = await fetch(GAME_CHAT_API, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ room_id: roomId, message }),
  });
  if (!response.ok) throw new Error('Не удалось отправить сообщение');
};
