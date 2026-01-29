// Система синхронизации данных между всеми пользователями
// При изменении данных - все открытые страницы автоматически обновятся

interface SyncEvent {
  type: 'offer_updated' | 'request_updated' | 'auction_updated' | 'order_updated';
  timestamp: number;
  id?: string;
}

const SYNC_KEY = 'data_sync_events';
const CHECK_INTERVAL = 2000; // Проверяем каждые 2 секунды

class DataSyncManager {
  private listeners: Map<string, Set<() => void>> = new Map();
  private lastCheck: number = Date.now();
  private intervalId: number | null = null;

  constructor() {
    // Запускаем проверку изменений
    this.startSync();
    
    // Слушаем изменения в других вкладках через storage event
    window.addEventListener('storage', this.handleStorageChange);
  }

  private handleStorageChange = (e: StorageEvent) => {
    if (e.key === SYNC_KEY && e.newValue) {
      try {
        const event: SyncEvent = JSON.parse(e.newValue);
        if (event.timestamp > this.lastCheck) {
          this.notifyListeners(event.type);
          this.lastCheck = event.timestamp;
        }
      } catch (error) {
        console.error('Error parsing sync event:', error);
      }
    }
  };

  private startSync() {
    // Проверяем изменения каждые 2 секунды
    this.intervalId = window.setInterval(() => {
      const eventsStr = localStorage.getItem(SYNC_KEY);
      if (eventsStr) {
        try {
          const event: SyncEvent = JSON.parse(eventsStr);
          if (event.timestamp > this.lastCheck) {
            this.notifyListeners(event.type);
            this.lastCheck = event.timestamp;
          }
        } catch (error) {
          console.error('Error checking sync:', error);
        }
      }
    }, CHECK_INTERVAL);
  }

  private notifyListeners(type: string) {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in sync callback:', error);
        }
      });
    }
    
    // Также уведомляем слушателей 'all'
    const allCallbacks = this.listeners.get('all');
    if (allCallbacks) {
      allCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in sync callback:', error);
        }
      });
    }
  }

  // Подписка на изменения
  subscribe(type: SyncEvent['type'] | 'all', callback: () => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    // Возвращаем функцию отписки
    return () => {
      const callbacks = this.listeners.get(type);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  // Публикация изменения (вызывается при сохранении данных)
  publish(event: SyncEvent) {
    const eventWithTimestamp = {
      ...event,
      timestamp: Date.now(),
    };
    localStorage.setItem(SYNC_KEY, JSON.stringify(eventWithTimestamp));
    
    // Сразу уведомляем текущую вкладку
    this.notifyListeners(event.type);
  }

  destroy() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }
    window.removeEventListener('storage', this.handleStorageChange);
    this.listeners.clear();
  }
}

// Singleton instance
export const dataSync = new DataSyncManager();

// Хелперы для частых случаев
export const notifyOfferUpdated = (id?: string) => {
  dataSync.publish({ type: 'offer_updated', timestamp: Date.now(), id });
};

export const notifyRequestUpdated = (id?: string) => {
  dataSync.publish({ type: 'request_updated', timestamp: Date.now(), id });
};

export const notifyAuctionUpdated = (id?: string) => {
  dataSync.publish({ type: 'auction_updated', timestamp: Date.now(), id });
};

export const notifyOrderUpdated = (id?: string) => {
  dataSync.publish({ type: 'order_updated', timestamp: Date.now(), id });
};
