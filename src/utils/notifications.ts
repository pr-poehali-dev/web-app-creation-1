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

export function playNotificationSound(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const times = [0, 0.15, 0.3];
    times.forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.12);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.12);
    });
  } catch (e) {
    console.debug('Audio not available', e);
  }
}

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

  if ('Notification' in window && Notification.permission === 'granted') {
    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser.id?.toString() === sellerId) {
          playNotificationSound();
          new Notification('Новый заказ!', {
            body: `${buyerName} заказал ${quantity} ${unit}`,
            icon: '/favicon.png',
            badge: '/favicon.png',
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