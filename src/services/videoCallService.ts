import funcUrl from '../../backend/func2url.json';
import { getSession } from '@/utils/auth';

export interface VideoCallPayload {
  orderId: string;
  callerId: string;
  callerName: string;
  roomId: string;
  type: 'incoming_call' | 'call_accepted' | 'call_declined' | 'call_ended';
}

// Генерируем уникальный ID комнаты для заказа
export function getRoomId(orderId: string): string {
  return `erttp-order-${orderId}`;
}

// Ссылка на Jitsi комнату
export function getJitsiUrl(roomId: string): string {
  return `https://meet.jit.si/${roomId}`;
}

// Отправляем push-уведомление о звонке другому участнику
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
        title: payload.type === 'incoming_call'
          ? `📞 Входящий звонок от ${payload.callerName}`
          : payload.type === 'call_accepted'
          ? '✅ Звонок принят'
          : payload.type === 'call_declined'
          ? '❌ Звонок отклонён'
          : '📵 Звонок завершён',
        message: payload.type === 'incoming_call'
          ? `Нажмите чтобы принять видеозвонок по заказу`
          : payload.type === 'call_accepted'
          ? 'Собеседник принял звонок'
          : payload.type === 'call_declined'
          ? 'Собеседник отклонил звонок'
          : 'Звонок завершён',
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

// Сохраняем входящий звонок в localStorage для IncomingCallAlert
export function storeIncomingCall(payload: VideoCallPayload) {
  localStorage.setItem('incoming_call', JSON.stringify({
    ...payload,
    timestamp: Date.now(),
  }));
  window.dispatchEvent(new CustomEvent('incoming_video_call', { detail: payload }));
}

// Очищаем входящий звонок
export function clearIncomingCall() {
  localStorage.removeItem('incoming_call');
  window.dispatchEvent(new CustomEvent('call_cleared'));
}

// Получить имя текущего пользователя
export function getCurrentUserName(): string {
  const session = getSession();
  if (!session) return 'Пользователь';
  if (session.companyName) return session.companyName;
  return `${session.firstName || ''} ${session.lastName || ''}`.trim() || 'Пользователь';
}