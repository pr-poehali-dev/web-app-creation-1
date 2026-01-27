// Утилиты для работы с push-уведомлениями

// Публичный VAPID ключ (должен быть сгенерирован и добавлен в секреты)
const VAPID_PUBLIC_KEY = 'BNxXqkxXqkxXqkxXqkxXqkxXqkxXqkxXqkxXqkxXqkxXqkxXqkxXqkxXqkxXqk='; // Временный ключ, нужно заменить на реальный

// URL backend функции для push-уведомлений
const PUSH_API_URL = 'https://functions.poehali.dev/f55209b4-4283-4f5b-816f-07d504a91073';

/**
 * Конвертирует base64 VAPID ключ в Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Регистрирует Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker не поддерживается браузером');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    
    console.log('[Push] Service Worker зарегистрирован:', registration);
    
    // Ждём активации Service Worker
    await navigator.serviceWorker.ready;
    console.log('[Push] Service Worker активен');
    
    return registration;
  } catch (error) {
    console.error('[Push] Ошибка регистрации Service Worker:', error);
    return null;
  }
}

/**
 * Запрашивает разрешение на push-уведомления
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Push-уведомления не поддерживаются');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.log('Пользователь запретил уведомления');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Подписывается на push-уведомления
 */
export async function subscribeToPush(userId: string): Promise<boolean> {
  try {
    // Регистрируем Service Worker
    const registration = await registerServiceWorker();
    if (!registration) {
      console.error('[Push] Service Worker не зарегистрирован');
      return false;
    }

    // Запрашиваем разрешение
    const hasPermission = await requestPushPermission();
    if (!hasPermission) {
      console.log('[Push] Нет разрешения на уведомления');
      return false;
    }

    // Создаём подписку
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    console.log('[Push] Подписка создана:', subscription);

    // Отправляем подписку на сервер
    const response = await fetch(PUSH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify({
        action: 'subscribe',
        subscription: subscription.toJSON(),
      }),
    });

    if (!response.ok) {
      throw new Error('Ошибка сохранения подписки на сервере');
    }

    console.log('[Push] Подписка сохранена на сервере');
    localStorage.setItem('push_subscription_enabled', 'true');
    
    return true;
  } catch (error) {
    console.error('[Push] Ошибка подписки:', error);
    return false;
  }
}

/**
 * Отписывается от push-уведомлений
 */
export async function unsubscribeFromPush(userId: string): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log('[Push] Подписка не найдена');
      return true;
    }

    // Отписываемся в браузере
    await subscription.unsubscribe();
    console.log('[Push] Отписка в браузере выполнена');

    // Удаляем подписку с сервера
    await fetch(PUSH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.dumps({
        action: 'unsubscribe',
        subscription: subscription.toJSON(),
      }),
    });

    console.log('[Push] Подписка удалена с сервера');
    localStorage.removeItem('push_subscription_enabled');
    
    return true;
  } catch (error) {
    console.error('[Push] Ошибка отписки:', error);
    return false;
  }
}

/**
 * Проверяет, подписан ли пользователь на push-уведомления
 */
export async function isPushSubscribed(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    return subscription !== null;
  } catch (error) {
    console.error('[Push] Ошибка проверки подписки:', error);
    return false;
  }
}

/**
 * Отправляет push-уведомление пользователю (вызывается с сервера или из admin-панели)
 */
export async function sendPushNotification(
  targetUserId: string,
  notification: {
    title: string;
    body: string;
    icon?: string;
    url?: string;
    tag?: string;
    requireInteraction?: boolean;
  }
): Promise<boolean> {
  try {
    const currentUserId = localStorage.getItem('user_id'); // Или из session
    
    const response = await fetch(PUSH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': currentUserId || '',
      },
      body: JSON.stringify({
        action: 'send',
        userId: targetUserId,
        notification,
      }),
    });

    const result = await response.json();
    console.log('[Push] Уведомление отправлено:', result);
    
    return response.ok;
  } catch (error) {
    console.error('[Push] Ошибка отправки уведомления:', error);
    return false;
  }
}