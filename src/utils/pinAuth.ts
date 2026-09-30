import func2url from '../../backend/func2url.json';
import { getJwtToken } from './auth';

const AUTH_API = func2url.auth;
const PIN_UNLOCKED_KEY = 'pinUnlockedAt';

interface PinResponse {
  success: boolean;
  error?: string;
  attempts_left?: number;
  locked_until?: string;
}

const authHeaders = (): Record<string, string> => {
  const token = getJwtToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const setPin = async (pin: string): Promise<PinResponse> => {
  try {
    const response = await fetch(AUTH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ action: 'set_pin', pin }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      return { success: false, error: data.error || 'Не удалось установить PIN-код' };
    }
    markPinUnlocked();
    return { success: true };
  } catch (error) {
    console.error('setPin error:', error);
    return { success: false, error: 'Ошибка соединения с сервером' };
  }
};

export const verifyPin = async (pin: string): Promise<PinResponse> => {
  try {
    const response = await fetch(AUTH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ action: 'verify_pin', pin }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      return { success: false, error: data.error, attempts_left: data.attempts_left, locked_until: data.locked_until };
    }
    markPinUnlocked();
    return { success: true };
  } catch (error) {
    console.error('verifyPin error:', error);
    return { success: false, error: 'Ошибка соединения с сервером' };
  }
};

export const clearPin = async (): Promise<PinResponse> => {
  try {
    const response = await fetch(AUTH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ action: 'clear_pin' }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      return { success: false, error: data.error || 'Не удалось удалить PIN-код' };
    }
    sessionStorage.removeItem(PIN_UNLOCKED_KEY);
    return { success: true };
  } catch (error) {
    console.error('clearPin error:', error);
    return { success: false, error: 'Ошибка соединения с сервером' };
  }
};

export const markPinUnlocked = (): void => {
  sessionStorage.setItem(PIN_UNLOCKED_KEY, Date.now().toString());
};

export const isPinUnlockedThisSession = (): boolean => {
  return !!sessionStorage.getItem(PIN_UNLOCKED_KEY);
};

export const clearPinUnlockFlag = (): void => {
  sessionStorage.removeItem(PIN_UNLOCKED_KEY);
};