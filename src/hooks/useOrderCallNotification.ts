import { useEffect, useRef, useCallback } from 'react';
import { getSession } from '@/utils/auth';
import type { IncomingCallData } from '@/components/IncomingCallModal';

const ORDERS_URL = 'https://functions.poehali.dev/ac0118fc-097c-4d35-a326-6afad0b5f8d4';
const POLL_INTERVAL_MS = 30000;
const STORAGE_KEY = 'last_seen_order_id';

interface UseOrderCallNotificationProps {
  onIncomingCall: (data: IncomingCallData) => void;
  enabled: boolean;
}

export function useOrderCallNotification({ onIncomingCall, enabled }: UseOrderCallNotificationProps) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSeenIdRef = useRef<string | null>(localStorage.getItem(STORAGE_KEY));
  const isFirstPollRef = useRef(true);

  const checkNewOrders = useCallback(async () => {
    const session = getSession();
    if (!session?.id) return;

    try {
      const res = await fetch(`${ORDERS_URL}?type=sale&limit=1&status=new,pending,negotiating`, {
        headers: {
          'X-User-Id': String(session.id),
        },
      });

      if (!res.ok) return;

      const data = await res.json();
      const orders: Array<{ id: string; title?: string; total_amount?: number; order_number?: string }> = data.orders || data || [];

      if (!orders.length) return;

      const latestOrder = orders[0];
      const latestId = String(latestOrder.id);

      // При первом опросе просто запоминаем ID, не звоним
      if (isFirstPollRef.current) {
        isFirstPollRef.current = false;
        if (!lastSeenIdRef.current) {
          lastSeenIdRef.current = latestId;
          localStorage.setItem(STORAGE_KEY, latestId);
        }
        return;
      }

      // Если новый заказ появился
      if (lastSeenIdRef.current !== latestId) {
        lastSeenIdRef.current = latestId;
        localStorage.setItem(STORAGE_KEY, latestId);

        const title = latestOrder.title || 'Новый заказ';
        const amount = latestOrder.total_amount
          ? `на сумму ${Number(latestOrder.total_amount).toLocaleString('ru-RU')} ₽`
          : '';
        const orderNum = latestOrder.order_number ? ` №${latestOrder.order_number}` : '';

        onIncomingCall({
          title: `Новый заказ${orderNum}!`,
          message: `${title} ${amount}`.trim(),
          url: `/my-orders?tab=seller&orderId=${latestId}`,
        });
      }
    } catch {
      // Игнорируем ошибки сети
    }
  }, [onIncomingCall]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Первый опрос через 5 сек после включения
    const initTimer = setTimeout(() => {
      checkNewOrders();
    }, 5000);

    timerRef.current = setInterval(checkNewOrders, POLL_INTERVAL_MS);

    return () => {
      clearTimeout(initTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled, checkNewOrders]);
}
