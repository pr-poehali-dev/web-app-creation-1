// Система синхронизации данных между всеми пользователями
// Обновление происходит при взаимодействии пользователя с интерфейсом

interface SyncEvent {
  type: 'offer_updated' | 'request_updated' | 'auction_updated' | 'order_updated' | 'contract_updated';
  timestamp: number;
  id?: string;
}

const SYNC_KEY = 'data_sync_events';

class DataSyncManager {
  private listeners: Map<string, Set<() => void>> = new Map();
  private lastCheck: number = Date.now();
  private intervalId: number | null = null;

  constructor() {
    // Слушаем изменения в других вкладках через storage event
    window.addEventListener('storage', this.handleStorageChange);
    
    // Проверяем при взаимодействии пользователя
    this.attachUserInteractionListeners();
    
    // Проверяем каждые 30 секунд на случай бездействия
    this.startBackgroundCheck();
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

  private checkForUpdates = () => {
    const eventsStr = localStorage.getItem(SYNC_KEY);
    if (eventsStr) {
      try {
        const event: SyncEvent = JSON.parse(eventsStr);
        if (event.timestamp > this.lastCheck) {
          console.log(`🔄 DataSync: detected ${event.type} update, notifying listeners...`);
          this.notifyListeners(event.type);
          this.lastCheck = event.timestamp;
        }
      } catch (error) {
        console.error('Error checking sync:', error);
      }
    }
  };

  private attachUserInteractionListeners() {
    // Проверяем при возврате на вкладку
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkForUpdates();
      }
    });

    // Проверяем при фокусе на окно
    window.addEventListener('focus', () => {
      this.checkForUpdates();
    });

    // Проверяем при клике в любом месте страницы
    document.addEventListener('click', () => {
      this.checkForUpdates();
    }, { passive: true });

    // Проверяем при скролле
    window.addEventListener('scroll', () => {
      this.checkForUpdates();
    }, { passive: true });

    // Проверяем при свайпе/касании (мобильные устройства)
    document.addEventListener('touchstart', () => {
      this.checkForUpdates();
    }, { passive: true });

    document.addEventListener('touchmove', () => {
      this.checkForUpdates();
    }, { passive: true });

    document.addEventListener('touchend', () => {
      this.checkForUpdates();
    }, { passive: true });

    // Проверяем при навигации (popstate = кнопка "Назад")
    window.addEventListener('popstate', () => {
      this.checkForUpdates();
    });
  }

  private startBackgroundCheck() {
    // Проверяем каждые 5 секунд (только localStorage, без запросов к серверу)
    this.intervalId = window.setInterval(() => {
      this.checkForUpdates();
    }, 5000);
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
    console.log(`📢 DataSync: publishing ${event.type} event`, eventWithTimestamp);
    localStorage.setItem(SYNC_KEY, JSON.stringify(eventWithTimestamp));
    
    // Сразу уведомляем текущую вкладку
    this.notifyListeners(event.type);
  }

  destroy() {
    window.removeEventListener('storage', this.handleStorageChange);
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }
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

export const notifyContractUpdated = (id?: string) => {
  dataSync.publish({ type: 'contract_updated', timestamp: Date.now(), id });
};