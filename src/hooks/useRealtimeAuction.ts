import { useState, useEffect, useRef, useCallback } from 'react';
import type { Auction, AuctionBid } from '@/types/auction';

interface UseRealtimeAuctionOptions {
  auctionId: string | undefined;
  enabled: boolean; // Активировать только на странице активного аукциона
  interval?: number; // Интервал опроса в мс (по умолчанию 5000 = 5 сек)
}

export function useRealtimeAuction({ auctionId, enabled, interval = 5000 }: UseRealtimeAuctionOptions) {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<AuctionBid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const previousBidsCountRef = useRef<number>(0);

  const fetchAuctionData = useCallback(async () => {
    if (!auctionId) return;

    try {
      if (!isLoading) setIsRefreshing(true);

      const userId = localStorage.getItem('userId');
      const response = await fetch(
        `https://functions.poehali.dev/9fd62fb3-48c7-4d72-8bf2-05f33093f80f?id=${auctionId}`,
        {
          headers: userId ? { 'X-User-Id': userId } : {},
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data) {
          setAuction({
            ...data,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            createdAt: new Date(data.createdAt),
          });

          if (data.bids && Array.isArray(data.bids)) {
            const newBids = data.bids.map((bid: any) => ({
              ...bid,
              timestamp: new Date(bid.timestamp),
            }));
            
            // Проверяем есть ли новые ставки
            if (newBids.length > previousBidsCountRef.current) {
              // Новая ставка - показываем уведомление
              try {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=');
                audio.volume = 0.5;
                audio.play().catch(() => {});
              } catch {}
            }

            setBids(newBids);
            previousBidsCountRef.current = newBids.length;
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch auction:', error);
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [auctionId, isLoading]);

  // Управление опросом
  useEffect(() => {
    if (!enabled || !auctionId || auction?.status !== 'active') {
      // Очищаем интервал если аукцион неактивен или не на странице
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      
      // Но первоначальная загрузка всё равно нужна
      if (!auction && enabled && auctionId) {
        fetchAuctionData();
      }
      return;
    }

    // Первоначальная загрузка
    fetchAuctionData();

    // Запускаем периодический опрос ТОЛЬКО для активных аукционов
    intervalIdRef.current = setInterval(fetchAuctionData, interval);

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [enabled, auctionId, auction?.status, interval, fetchAuctionData]);

  // Останавливаем опрос когда вкладка неактивна
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Вкладка неактивна - останавливаем опрос
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }
      } else {
        // Вкладка активна - возобновляем опрос ТОЛЬКО для активных аукционов
        if (enabled && auctionId && auction?.status === 'active' && !intervalIdRef.current) {
          fetchAuctionData(); // Сразу обновляем
          intervalIdRef.current = setInterval(fetchAuctionData, interval);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, auctionId, auction?.status, interval, fetchAuctionData]);

  return {
    auction,
    bids,
    isLoading,
    isRefreshing,
    refetch: fetchAuctionData,
  };
}
