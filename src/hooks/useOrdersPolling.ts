import { useEffect, useRef, useState } from 'react';
import { ordersAPI } from '@/services/api';

interface UseOrdersPollingOptions {
  enabled: boolean;
  interval?: number;
  onNewOrder?: (order: any) => void;
  onNewMessage?: (message: any) => void;
}

export function useOrdersPolling({
  enabled,
  interval = 10000,
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
      
      try {
        const response = await ordersAPI.getAll('sale');
        const orders = response.orders || [];
        
        const newOrders = orders.filter((order: any) => {
          const orderDate = new Date(order.createdAt || order.created_at);
          return orderDate > lastCheck;
        });

        if (newOrders.length > 0 && onNewOrder) {
          newOrders.forEach((order: any) => onNewOrder(order));
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