// Независимая система аутентификации игрового раздела.
// Использует собственные ключи хранилища и собственный backend, никак не пересекается
// с основной системой пользователей сайта (src/utils/auth.ts).
import func2url from '../../../backend/func2url.json';

const GAME_TOKEN_KEY = 'game_token';
const GAME_USER_KEY = 'game_user';

export interface GameUser {
  id: number;
  nickname: string;
  avatar_emoji: string;
  avatar_url?: string | null;
  notify_chat?: boolean;
  notify_turn?: boolean;
  chips_balance: number;
  games_played: number;
  games_won: number;
  pin_set?: boolean;
}

interface GameAuthResponse {
  success: boolean;
  user?: GameUser;
  token?: string;
  error?: string;
  pin_created?: boolean;
}

// URL функции пропишется автоматически после публикации backend (game-auth).
// До этого момента запросы корректно завершатся ошибкой соединения — страница это обработает.
const GAME_AUTH_API = (func2url as Record<string, string>)['game-auth'] || '';

export const getGameAuthApiUrl = () => GAME_AUTH_API;

export const registerGameUser = async (nickname: string, pin: string): Promise<GameAuthResponse> => {
  if (!GAME_AUTH_API) {
    return { success: false, error: 'Игровой раздел ещё разворачивается, попробуйте через пару минут' };
  }
  try {
    const response = await fetch(GAME_AUTH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', nickname, pin }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      return { success: false, error: data.error || 'Ошибка регистрации' };
    }
    saveGameSession(data.user, data.token);
    return { success: true, user: data.user, token: data.token };
  } catch {
    return { success: false, error: 'Ошибка соединения с сервером' };
  }
};

export const loginGameUser = async (nickname: string, pin: string): Promise<GameAuthResponse> => {
  if (!GAME_AUTH_API) {
    return { success: false, error: 'Игровой раздел ещё разворачивается, попробуйте через пару минут' };
  }
  try {
    const response = await fetch(GAME_AUTH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', nickname, pin }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      return { success: false, error: data.error || 'Неверный никнейм или пароль' };
    }
    saveGameSession(data.user, data.token);
    return { success: true, user: data.user, token: data.token, pin_created: data.pin_created };
  } catch {
    return { success: false, error: 'Ошибка соединения с сервером' };
  }
};

export const saveGameSession = (user: GameUser, token: string): void => {
  localStorage.setItem(GAME_USER_KEY, JSON.stringify(user));
  localStorage.setItem(GAME_TOKEN_KEY, token);
  window.dispatchEvent(new Event('gameSessionChanged'));
};

export const getGameSession = (): GameUser | null => {
  try {
    const stored = localStorage.getItem(GAME_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const getGameToken = (): string | null => {
  return localStorage.getItem(GAME_TOKEN_KEY);
};

export const refreshGameSession = async (): Promise<void> => {
  const token = getGameToken();
  if (!token || !GAME_AUTH_API) return;
  try {
    if (navigator.storage?.persist) navigator.storage.persist();
    const response = await fetch(GAME_AUTH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', token }),
    });
    if (response.status === 401) {
      clearGameSession();
      return;
    }
    const data = await response.json();
    if (response.ok && data.success && data.token) saveGameSession(data.user, data.token);
  } catch {
    // нет связи — остаёмся в системе
  }
};

export const clearGameSession = (): void => {
  localStorage.removeItem(GAME_USER_KEY);
  localStorage.removeItem(GAME_TOKEN_KEY);
  window.dispatchEvent(new Event('gameSessionChanged'));
};

export const updateGameAvatar = async (image: string | null): Promise<{ success: boolean; error?: string }> => {
  const token = getGameToken();
  if (!token || !GAME_AUTH_API) return { success: false, error: 'Нужно войти заново' };
  try {
    const response = await fetch(GAME_AUTH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(image ? { action: 'set_avatar', token, image } : { action: 'clear_avatar', token }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) return { success: false, error: data.error || 'Не удалось сохранить фото' };
    const user = getGameSession();
    if (user) saveGameSession({ ...user, avatar_url: data.avatar_url }, token);
    return { success: true };
  } catch {
    return { success: false, error: 'Ошибка соединения с сервером' };
  }
};


export const updateGameNotifySettings = async (
  notifyChat: boolean,
  notifyTurn: boolean
): Promise<{ success: boolean; error?: string }> => {
  const token = getGameToken();
  if (!token || !GAME_AUTH_API) return { success: false, error: 'Нужно войти заново' };
  try {
    const response = await fetch(GAME_AUTH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_notify', token, notify_chat: notifyChat, notify_turn: notifyTurn }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) return { success: false, error: data.error || 'Не удалось сохранить' };
    const user = getGameSession();
    if (user) saveGameSession({ ...user, notify_chat: notifyChat, notify_turn: notifyTurn }, token);
    return { success: true };
  } catch {
    return { success: false, error: 'Ошибка соединения с сервером' };
  }
};

export const changeGamePin = async (pin: string, oldPin?: string): Promise<{ success: boolean; error?: string }> => {
  const token = getGameToken();
  if (!token || !GAME_AUTH_API) return { success: false, error: 'Нужно войти заново' };
  try {
    const response = await fetch(GAME_AUTH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_pin', token, pin, old_pin: oldPin }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) return { success: false, error: data.error || 'Не удалось сохранить пароль' };
    return { success: true };
  } catch {
    return { success: false, error: 'Ошибка соединения с сервером' };
  }
};
