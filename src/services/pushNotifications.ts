const PUBLIC_VAPID_KEY = 'BPw4oGZUpjPIztMsjqSfeAp-lODNozuVR2WWcPkS7QH93gXm1cNCUs6eNv3pVJMnxCKlVRUTXNQPVssRTq8CDAE';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
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

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.error('Браузер не поддерживает уведомления');
    return 'denied';
  }

  return await Notification.requestPermission();
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.error('Service Worker не поддерживается');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    return registration;
  } catch (error) {
    console.error('Ошибка регистрации Service Worker:', error);
    return null;
  }
}

export async function subscribeToPushNotifications(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
    });
    return subscription;
  } catch (error) {
    // Конфликт VAPID — сбрасываем и пробуем снова
    try {
      const existing = await registration.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
      });
      return subscription;
    } catch (retryError) {
      console.error('Ошибка подписки на push-уведомления:', retryError);
      return null;
    }
  }
}

export async function sendSubscriptionToServer(
  subscription: PushSubscription,
  userId: string
): Promise<boolean> {
  try {
    const response = await fetch('https://functions.poehali.dev/51a6c510-719b-44bb-840d-80b4bfe2484c', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userId,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.error(`HTTP ${response.status} push-subscribe:`, errBody);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Ошибка отправки подписки на сервер:', error);
    return false;
  }
}

export async function setupPushNotifications(userId: string): Promise<boolean> {
  try {
    // 1. Запрашиваем разрешение
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return false;
    }

    // 2. Регистрируем Service Worker
    const registration = await registerServiceWorker();
    if (!registration) {
      console.error('Не удалось зарегистрировать Service Worker');
      return false;
    }

    // Ждем, пока Service Worker станет активным
    await navigator.serviceWorker.ready;

    // 3. Подписываемся на push-уведомления
    const subscription = await subscribeToPushNotifications(registration);
    if (!subscription) {
      console.error('Не удалось подписаться на push-уведомления');
      return false;
    }

    // 4. Отправляем подписку на сервер
    const success = await sendSubscriptionToServer(subscription, userId);
    return success;
  } catch (error) {
    console.error('Ошибка настройки push-уведомлений:', error);
    return false;
  }
}

export async function checkPushSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error('Ошибка проверки подписки:', error);
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const subscription = await checkPushSubscription();
    if (!subscription) {
      return true;
    }

    const success = await subscription.unsubscribe();
    return success;
  } catch (error) {
    console.error('Ошибка отписки от push-уведомлений:', error);
    return false;
  }
}