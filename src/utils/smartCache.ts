/**
 * Умное кэширование с автоматическим обновлением при переходах
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

const CACHE_VERSION = 1;
const CACHE_DURATION = 2 * 60 * 1000; // 2 минуты

export class SmartCache {
  /**
   * Сохранить данные в кэш
   */
  static set<T>(key: string, data: T): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (e) {
      console.warn('Failed to cache data:', e);
    }
  }

  /**
   * Получить данные из кэша (если свежие)
   */
  static get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      
      // Проверяем версию
      if (entry.version !== CACHE_VERSION) {
        this.invalidate(key);
        return null;
      }

      // Проверяем свежесть
      const age = Date.now() - entry.timestamp;
      if (age > CACHE_DURATION) {
        this.invalidate(key);
        return null;
      }

      return entry.data;
    } catch (e) {
      console.warn('Failed to read cache:', e);
      return null;
    }
  }

  /**
   * Инвалидировать кэш (пометить как устаревший)
   */
  static invalidate(key: string): void {
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (e) {
      console.warn('Failed to invalidate cache:', e);
    }
  }

  /**
   * Инвалидировать все связанные кэши
   */
  static invalidateAll(pattern: string): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(`cache_${pattern}`)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Failed to invalidate all caches:', e);
    }
  }

  /**
   * Проверить, нужно ли обновить кэш
   */
  static shouldRefresh(key: string): boolean {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (!cached) return true;

      const entry: CacheEntry<any> = JSON.parse(cached);
      const age = Date.now() - entry.timestamp;
      
      // Если кэшу больше 1 минуты - рекомендуем обновить в фоне
      return age > 60 * 1000;
    } catch (e) {
      return true;
    }
  }
}

/**
 * Пометить что данные были изменены
 */
export function markDataAsUpdated(type: 'offers' | 'requests' | 'orders' | 'auctions'): void {
  SmartCache.invalidateAll(type);
  // Устанавливаем флаг для других страниц
  sessionStorage.setItem(`${type}_updated`, Date.now().toString());
}

/**
 * Проверить были ли обновления с последнего визита страницы
 */
export function checkForUpdates(type: 'offers' | 'requests' | 'orders' | 'auctions'): boolean {
  const lastUpdate = sessionStorage.getItem(`${type}_updated`);
  if (!lastUpdate) return false;
  
  const lastVisit = sessionStorage.getItem(`${type}_last_visit`);
  if (!lastVisit) {
    sessionStorage.setItem(`${type}_last_visit`, Date.now().toString());
    return true;
  }
  
  const wasUpdated = parseInt(lastUpdate) > parseInt(lastVisit);
  if (wasUpdated) {
    sessionStorage.setItem(`${type}_last_visit`, Date.now().toString());
    sessionStorage.removeItem(`${type}_updated`);
  }
  
  return wasUpdated;
}
