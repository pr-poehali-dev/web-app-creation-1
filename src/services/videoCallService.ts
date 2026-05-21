import funcUrl from '../../backend/func2url.json';
import { getSession } from '@/utils/auth';

export type CallMode = 'video' | 'audio';

export interface VideoCallPayload {
  orderId: string;
  callerId: string;
  callerName: string;
  roomId: string;
  callMode: CallMode;
  type: 'incoming_call' | 'call_accepted' | 'call_declined' | 'call_ended';
  calledAt?: number;
}

const CALL_SIGNAL_URL = funcUrl['call-signal'];

function getUserId(): string {
  return localStorage.getItem('userId') || '';
}

// Генерируем уникальный ID комнаты для заказа
export function getRoomId(orderId: string): string {
  return `erttp-order-${orderId}`;
}

// Ссылка на Jitsi комнату (с настройками режима)
export function getJitsiUrl(roomId: string, mode: CallMode = 'video'): string {
  const base = `https://meet.jit.si/${roomId}`;
  if (mode === 'audio') {
    // startWithVideoMuted=1 отключает видео при старте
    return `${base}#config.startWithVideoMuted=true&config.startWithAudioMuted=false`;
  }
  return base;
}

// ─── Запись звонка в БД (инициатор) ────────────────────────────────────────
export async function initiateCall(
  orderId: string,
  callMode: CallMode = 'video'
): Promise<VideoCallPayload | null> {
  const session = getSession();
  if (!session?.id) return null;

  const callerId = String(session.id);
  const callerName = getCurrentUserName();
  const roomId = getRoomId(orderId);

  const payload: VideoCallPayload = {
    orderId,
    callerId,
    callerName,
    roomId,
    callMode,
    type: 'incoming_call',
    calledAt: Date.now(),
  };

  try {
    const res = await fetch(`${CALL_SIGNAL_URL}?action=call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': callerId },
      body: JSON.stringify({ orderId, callerId, callerName, roomId, callMode }),
    });
    if (!res.ok) return null;
    return payload;
  } catch {
    return null;
  }
}

// ─── Снять звонок из БД (отклонён/завершён) ────────────────────────────────
export async function clearCallSignal(orderId: string): Promise<void> {
  const userId = getUserId();
  if (!userId) return;
  try {
    await fetch(`${CALL_SIGNAL_URL}?action=clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
      body: JSON.stringify({ orderId }),
    });
  } catch {
    // игнорируем
  }
}

// ─── Получить текущий звонок для заказа (polling получателем) ──────────────
export async function fetchPendingCall(orderId: string): Promise<VideoCallPayload | null> {
  const userId = getUserId();
  if (!userId) return null;
  try {
    const res = await fetch(
      `${CALL_SIGNAL_URL}?orderId=${encodeURIComponent(orderId)}`,
      { headers: { 'X-User-Id': userId } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.call || null;
  } catch {
    return null;
  }
}

// ─── localStorage для мгновенного показа на той же вкладке ─────────────────
export function storeIncomingCall(payload: VideoCallPayload) {
  localStorage.setItem('incoming_call', JSON.stringify({
    ...payload,
    timestamp: Date.now(),
  }));
  window.dispatchEvent(new CustomEvent('incoming_video_call', { detail: payload }));
}

export function clearIncomingCall() {
  localStorage.removeItem('incoming_call');
  window.dispatchEvent(new CustomEvent('call_cleared'));
}

// ─── Получить имя текущего пользователя ────────────────────────────────────
export function getCurrentUserName(): string {
  const session = getSession();
  if (!session) return 'Пользователь';
  if (session.companyName) return session.companyName;
  return `${session.firstName || ''} ${session.lastName || ''}`.trim() || 'Пользователь';
}

// ─── Legacy: отправка push (оставляем как доп. уведомление) ────────────────
export async function sendCallNotification(
  targetUserId: string,
  payload: VideoCallPayload
): Promise<boolean> {
  try {
    const response = await fetch(funcUrl['push-send'], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: targetUserId,
        title: `📞 Входящий ${payload.callMode === 'audio' ? 'аудио' : 'видео'}звонок от ${payload.callerName}`,
        message: 'Нажмите чтобы принять звонок по заказу',
        url: `/my-orders?orderId=${payload.orderId}`,
        type: 'video_call',
        callData: payload,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
