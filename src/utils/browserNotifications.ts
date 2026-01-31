/**
 * Простая система браузерных уведомлений
 * Работает без Service Worker и VAPID ключей
 */

export interface BrowserNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
  onClick?: () => void;
}

/**
 * Проверка поддержки уведомлений
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

/**
 * Получить текущее разрешение на уведомления
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Запросить разрешение на уведомления
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    console.warn('Браузер не поддерживает уведомления');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  } catch (error) {
    console.error('Ошибка запроса разрешения:', error);
    return 'denied';
  }
}

/**
 * Показать браузерное уведомление
 */
export function showBrowserNotification(options: BrowserNotificationOptions): Notification | null {
  if (!isNotificationSupported()) {
    console.warn('Уведомления не поддерживаются');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Разрешение на уведомления не предоставлено');
    return null;
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/logo-192.png',
      tag: options.tag,
      data: options.data,
      badge: '/logo-192.png',
      requireInteraction: false,
    });

    if (options.onClick) {
      notification.onclick = () => {
        window.focus();
        options.onClick?.();
        notification.close();
      };
    }

    // Автоматически закрываем через 5 секунд
    setTimeout(() => notification.close(), 5000);

    return notification;
  } catch (error) {
    console.error('Ошибка показа уведомления:', error);
    return null;
  }
}

/**
 * Показать уведомление о новом заказе
 */
export function notifyNewOrder(orderTitle: string, orderId: string) {
  showBrowserNotification({
    title: 'Новый заказ!',
    body: `Получен заказ на "${orderTitle}"`,
    tag: `order-${orderId}`,
    onClick: () => {
      window.location.href = `/my-orders?id=${orderId}`;
    }
  });
}

/**
 * Показать уведомление о принятии заказа
 */
export function notifyOrderAccepted(orderTitle: string, orderId: string) {
  showBrowserNotification({
    title: 'Заказ принят!',
    body: `Ваш заказ "${orderTitle}" принят в работу`,
    tag: `order-accepted-${orderId}`,
    onClick: () => {
      window.location.href = `/my-orders?id=${orderId}`;
    }
  });
}

/**
 * Показать уведомление о встречном предложении
 */
export function notifyCounterOffer(orderTitle: string, price: number, orderId: string) {
  showBrowserNotification({
    title: 'Встречное предложение',
    body: `Новая цена по заказу "${orderTitle}": ${price.toLocaleString('ru-RU')} ₽`,
    tag: `counter-${orderId}`,
    onClick: () => {
      window.location.href = `/my-orders?id=${orderId}`;
    }
  });
}

/**
 * Показать уведомление о новом сообщении
 */
export function notifyNewMessage(senderName: string, message: string, orderId: string) {
  showBrowserNotification({
    title: `Сообщение от ${senderName}`,
    body: message.length > 50 ? message.substring(0, 50) + '...' : message,
    tag: `message-${orderId}`,
    onClick: () => {
      window.location.href = `/my-orders?id=${orderId}`;
    }
  });
}
