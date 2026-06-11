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
  interval = 15000,
  onNewOrder,
  onNewMessage,
}: UseOrdersPollingOptions) {
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout>();

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

    intervalRef.current = setInterval(checkForUpdates, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, lastCheck, onNewOrder, onNewMessage]);

  return { lastCheck };
}