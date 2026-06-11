import { useEffect, useRef, useState } from 'react';
import { ordersAPI } from '@/services/api';
import type { Order } from '@/types/order';

interface UseOrdersPollingOptions {
  enabled: boolean;
  interval?: number;
  onNewOrder?: (order: Order) => void;
  onNewMessage?: (message: Order) => void;
}

export function useOrdersPolling({
  enabled,
  interval = 60000,
  onNewOrder,
  onNewMessage,
}: UseOrdersPollingOptions) {
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout>();
  const checkForUpdatesRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    const checkForUpdates = async () => {
      if (document.hidden) return;
      
      try {
        const response = await ordersAPI.getAll('sale');
        const orders = response.orders || [];
        
        const newOrders = orders.filter((order: Order) => {
          const orderDate = new Date(order.createdAt || order.created_at);
          return orderDate > lastCheck;
        });

        if (newOrders.length > 0 && onNewOrder) {
          newOrders.forEach((order: Order) => onNewOrder(order));
          setLastCheck(new Date());
        }
      } catch (error) {
        console.error('Error polling orders:', error);
      }
    };

    checkForUpdatesRef.current = checkForUpdates;
    intervalRef.current = setInterval(checkForUpdates, interval);

    const handlePushOrder = () => checkForUpdatesRef.current?.();
    window.addEventListener('push:new_order', handlePushOrder);

    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'REFRESH_ORDERS') checkForUpdatesRef.current?.();
    };
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('push:new_order', handlePushOrder);
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    };
  }, [enabled, interval, lastCheck, onNewOrder, onNewMessage]);

  return { lastCheck };
}