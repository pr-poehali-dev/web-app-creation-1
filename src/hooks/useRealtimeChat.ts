import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage } from '@/types/chat';

interface UseRealtimeChatOptions {
  orderId: string;
  enabled: boolean; // Активировать только когда пользователь на странице чата
  interval?: number; // Интервал опроса в мс (по умолчанию 2000 = 2 сек)
}

export function useRealtimeChat({ orderId, enabled, interval = 2000 }: UseRealtimeChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const response = await fetch(
        `https://functions.poehali.dev/ac0118fc-097c-4d35-a326-6afad0b5f8d4?id=${orderId}&messages=true`,
        {
          headers: {
            'X-User-Id': userId,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.messages) {
          setMessages(data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })));
        }
        lastFetchTimeRef.current = Date.now();
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setError('Не удалось загрузить сообщения');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  // Отправка нового сообщения
  const sendMessage = useCallback(async (text: string, attachments?: File[]) => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const response = await fetch(
        'https://functions.poehali.dev/ac0118fc-097c-4d35-a326-6afad0b5f8d4?message=true',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId,
          },
          body: JSON.stringify({
            orderId,
            text,
            attachments: [], // TODO: implement file upload
          }),
        }
      );

      if (response.ok) {
        // Уведомляем dataSync о новом сообщении
        const { notifyOrderUpdated } = await import('@/utils/dataSync');
        notifyOrderUpdated(orderId);
        
        // Сразу обновляем список сообщений
        await fetchMessages();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      throw new Error('Не удалось отправить сообщение');
    }
  }, [orderId, fetchMessages]);

  // Управление опросом
  useEffect(() => {
    if (!enabled || !orderId) {
      // Очищаем интервал если чат неактивен
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      return;
    }

    // Первоначальная загрузка
    fetchMessages();

    // Запускаем периодический опрос
    intervalIdRef.current = setInterval(fetchMessages, interval);

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [enabled, orderId, interval, fetchMessages]);

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
        // Вкладка активна - возобновляем опрос
        if (enabled && orderId && !intervalIdRef.current) {
          fetchMessages(); // Сразу обновляем
          intervalIdRef.current = setInterval(fetchMessages, interval);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, orderId, interval, fetchMessages]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    refetch: fetchMessages,
  };
}