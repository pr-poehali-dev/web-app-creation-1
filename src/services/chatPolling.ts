import { ChatMessage } from '@/types/order';
import func2url from '@/../../backend/func2url.json';

type MessageHandler = (messages: ChatMessage[]) => void;

class ChatPollingService {
  private pollingInterval: number | null = null;
  private lastTimestamp: string | null = null;
  private messageHandlers: MessageHandler[] = [];
  private orderId: string = '';
  private apiUrl: string = func2url['chat-poll'] || '';
  private isPolling: boolean = false;
  private pollDelay: number = 5000; // Проверка каждые 5 секунд

  start(orderId: string, initialTimestamp?: string) {
    if (this.isPolling && this.orderId === orderId) {
      console.log('✅ Polling уже запущен для этого чата');
      return;
    }

    this.stop(); // Останавливаем предыдущий polling
    
    this.orderId = orderId;
    this.lastTimestamp = initialTimestamp || null;
    this.isPolling = true;

    console.log(`🔄 Запущен polling для чата ${orderId}`);

    // Первый запрос сразу
    this.poll();

    // Регулярные запросы
    this.pollingInterval = window.setInterval(() => {
      this.poll();
    }, this.pollDelay);
  }

  private async poll() {
    if (!this.isPolling || !this.orderId) return;

    try {
      const params = new URLSearchParams({ orderId: this.orderId });
      if (this.lastTimestamp) {
        params.append('since', this.lastTimestamp);
      }

      const response = await fetch(`${this.apiUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('⚠️ Ошибка polling:', response.status);
        return;
      }

      const data = await response.json();
      
      if (data.messages && data.messages.length > 0) {
        console.log(`📨 Получено ${data.messages.length} новых сообщений`);
        
        // Обновляем lastTimestamp последним сообщением
        const lastMessage = data.messages[data.messages.length - 1];
        this.lastTimestamp = lastMessage.timestamp;

        // Преобразуем в ChatMessage
        const messages: ChatMessage[] = data.messages.map((msg: any) => ({
          id: msg.id,
          senderId: msg.senderId,
          message: msg.message,
          timestamp: new Date(msg.timestamp),
        }));

        // Отправляем обработчикам
        this.messageHandlers.forEach(handler => handler(messages));
      }

    } catch (error) {
      console.error('❌ Ошибка при polling:', error);
    }
  }

  stop() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    this.lastTimestamp = null;
    console.log('🛑 Polling остановлен');
  }

  onMessage(handler: MessageHandler) {
    this.messageHandlers.push(handler);
  }

  removeMessageHandler(handler: MessageHandler) {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  isActive(): boolean {
    return this.isPolling;
  }

  setPollingDelay(delay: number) {
    this.pollDelay = delay;
    // Перезапускаем polling с новой задержкой
    if (this.isPolling && this.orderId) {
      this.start(this.orderId, this.lastTimestamp || undefined);
    }
  }
}

// Singleton instance
export const chatPolling = new ChatPollingService();
