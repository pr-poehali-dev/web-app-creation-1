type NotificationType = 'order' | 'message' | 'auction' | 'request' | 'system' | 'new_order' | 'order_accepted' | 'order_message';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  link?: string;
  userId?: string;
}

const STORAGE_KEY = 'marketplace_notifications';

export function addNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
): void {
  const notifications = getNotifications(userId);
  
  const newNotification: Notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    title,
    message,
    isRead: false,
    createdAt: new Date(),
    link,
    userId,
  };

  notifications.unshift(newNotification);
  
  const maxNotifications = 100;
  if (notifications.length > maxNotifications) {
    notifications.splice(maxNotifications);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

export function getNotifications(userId: string): Notification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const all: Notification[] = JSON.parse(stored).map((n: Notification & { createdAt: string }) => ({
      ...n,
      createdAt: new Date(n.createdAt),
    }));
    
    return all.filter(n => n.userId === userId);
  } catch (error) {
    console.error('Error loading notifications:', error);
    return [];
  }
}

export function markAsRead(notificationId: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const notifications: Notification[] = JSON.parse(stored);
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

export function getUnreadCount(userId: string): number {
  const notifications = getNotifications(userId);
  return notifications.filter(n => !n.isRead).length;
}

export function clearNotifications(userId: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const all: Notification[] = JSON.parse(stored);
    const filtered = all.filter(n => n.userId !== userId);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
}

export function notifyAuctionWinner(
  winnerId: string,
  auctionTitle: string,
  winningBid: number,
  auctionId: string
): void {
  addNotification(
    winnerId,
    'auction',
    '🎉 Поздравляем! Вы выиграли аукцион',
    `Вы выиграли аукцион "${auctionTitle}" со ставкой ${winningBid.toLocaleString('ru-RU')} ₽. Свяжитесь с продавцом для передачи товара.`,
    `/auction/${auctionId}`
  );
}

export function notifyAuctionSeller(
  sellerId: string,
  auctionTitle: string,
  winnerName: string,
  winningBid: number,
  auctionId: string
): void {
  addNotification(
    sellerId,
    'auction',
    'Аукцион завершен',
    `Ваш аукцион "${auctionTitle}" завершен. Победитель: ${winnerName} со ставкой ${winningBid.toLocaleString('ru-RU')} ₽.`,
    `/auction/${auctionId}`
  );
}

export function notifyNewOrder(
  sellerId: string,
  offerTitle: string,
  buyerName: string,
  quantity: number,
  unit: string,
  orderId: string
): void {
  addNotification(
    sellerId,
    'new_order',
    '🛒 Новый заказ!',
    `Получен заказ на "${offerTitle}" от ${buyerName}. Количество: ${quantity} ${unit}`,
    `/my-orders`
  );

  // КРИТИЧНО: Показываем пуш-уведомление ТОЛЬКО продавцу, а не покупателю
  if ('Notification' in window && Notification.permission === 'granted') {
    // Проверяем, что текущий пользователь - это продавец
    const currentUserStr = localStorage.getItem('marketplace_session');
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr);
        // Показываем уведомление только если текущий пользователь = продавец
        if (currentUser.id?.toString() === sellerId) {
          new Notification('Новый заказ!', {
            body: `${buyerName} заказал ${quantity} ${unit}`,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: `order-${orderId}`,
            requireInteraction: true,
          });
        }
      } catch (e) {
        console.error('Error checking user for notification:', e);
      }
    }
  }
}

export function notifyOrderAccepted(
  buyerId: string,
  sellerName: string,
  offerTitle: string,
  orderId: string
): void {
  addNotification(
    buyerId,
    'order_accepted',
    '✅ Заказ принят!',
    `Продавец ${sellerName} принял ваш заказ на "${offerTitle}"`,
    `/my-orders`
  );

}

export function notifyNewMessage(
  recipientId: string,
  senderName: string,
  message: string,
  orderId: string
): void {
  addNotification(
    recipientId,
    'order_message',
    '💬 Новое сообщение',
    `${senderName}: ${message.slice(0, 50)}${message.length > 50 ? '...' : ''}`,
    `/my-orders`
  );

}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {

    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}