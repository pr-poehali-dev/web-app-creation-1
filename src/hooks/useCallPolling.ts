/**
 * Polling входящих звонков через БД каждые 2 секунды.
 * Когда пользователь авторизован — проверяет все свои активные заказы.
 * При обнаружении звонка — вызывает storeIncomingCall для показа IncomingCallAlert.
 */
import { useEffect, useRef } from 'react';
import { getSession } from '@/utils/auth';
import { fetchPendingCall, storeIncomingCall, clearIncomingCall } from '@/services/videoCallService';
import { ordersAPI } from '@/services/api';

const POLL_INTERVAL = 2500;

export function useCallPolling(enabled: boolean) {
  const activeOrderIdsRef = useRef<string[]>([]);
  const seenCallTimesRef = useRef<Record<string, number>>({});
  const myUserIdRef = useRef<string>('');

  // Каждые 30 сек обновляем список активных заказов
  useEffect(() => {
    if (!enabled) return;

    const refreshOrders = async () => {
      const session = getSession();
      if (!session?.id) return;
      myUserIdRef.current = String(session.id);
      try {
        const res = await ordersAPI.getAll('all');
        const orders = (res.orders || []) as Array<{ id: string; status: string }>;
        activeOrderIdsRef.current = orders
          .filter(o => ['pending', 'new', 'negotiating', 'accepted'].includes(o.status))
          .map(o => String(o.id));
      } catch {
        // сеть недоступна — оставляем старый список
      }
    };

    refreshOrders();
    const id = setInterval(refreshOrders, 30000);
    return () => clearInterval(id);
  }, [enabled]);

  // Каждые 2.5 сек опрашиваем БД для каждого заказа
  useEffect(() => {
    if (!enabled) return;

    const poll = async () => {
      if (document.hidden) return;
      const myId = myUserIdRef.current;
      if (!myId) return;

      for (const orderId of activeOrderIdsRef.current) {
        const call = await fetchPendingCall(orderId);

        if (!call) {
          // Если звонка нет — может уже отклонили
          continue;
        }

        // Не показываем свой собственный звонок инициатору
        if (call.callerId === myId) continue;

        if (seenCallTimesRef.current[orderId] === call.calledAt) continue;

        // Новый звонок!
        seenCallTimesRef.current[orderId] = call.calledAt ?? 0;
        storeIncomingCall({ ...call, orderId });
        break; // показываем один звонок за раз
      }
    };

    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [enabled]);
}