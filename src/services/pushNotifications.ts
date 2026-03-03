const PUBLIC_VAPID_KEY = 'BI2ZLgIe4irdciCdMl4ai3cm_edH19mxvX7K-NKyY_O9zukg90NMrgWbnyWDAEV214ffrZ524T5Tg5ui3bafxsI';
const PUSH_SUBSCRIBE_URL = 'https://functions.poehali.dev/51a6c510-719b-44bb-840d-80b4bfe2484c';

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
  if (!('Notification' in window)) return 'denied';
  const permission = await Notification.requestPermission();
  return permission;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return registration;
  } catch {
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
  } catch {
    return null;
  }
}

export async function sendSubscriptionToServer(
  subscription: PushSubscription,
  userId: string
): Promise<boolean> {
  try {
    const response = await fetch(PUSH_SUBSCRIBE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription, userId }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function removeSubscriptionFromServer(userId: string): Promise<boolean> {
  try {
    const response = await fetch(PUSH_SUBSCRIBE_URL, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function setupPushNotifications(userId: string): Promise<boolean> {
  try {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') return false;

    const registration = await registerServiceWorker();
    if (!registration) return false;

    await navigator.serviceWorker.ready;

    // Сначала пробуем получить существующую подписку
    let subscription = await registration.pushManager.getSubscription();

    // Если нет — создаём новую
    if (!subscription) {
      subscription = await subscribeToPushNotifications(registration);
    }

    if (!subscription) return false;

    return await sendSubscriptionToServer(subscription, userId);
  } catch {
    return false;
  }
}

export async function checkPushSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function unsubscribeFromPush(userId?: string): Promise<boolean> {
  try {
    const subscription = await checkPushSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
    // Всегда деактивируем на сервере
    if (userId) {
      await removeSubscriptionFromServer(userId);
    }
    return true;
  } catch {
    return false;
  }
}
