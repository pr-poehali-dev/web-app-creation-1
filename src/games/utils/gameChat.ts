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
  is_system?: boolean;
  media_url?: string | null;
  media_type?: 'image' | 'audio' | null;
  avatar_url?: string | null;
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

export const sendChatMessage = async (roomId: number, message: string, media?: string): Promise<void> => {
  const response = await fetch(GAME_CHAT_API, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ room_id: roomId, message, ...(media ? { media } : {}) }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Не удалось отправить сообщение');
  }
};

export const fileToDataUrl = (file: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const imageToDataUrl = (file: File, maxSide = 1280, quality = 0.82): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Не удалось прочитать картинку'));
    };
    img.src = url;
  });
