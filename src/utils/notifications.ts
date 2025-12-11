type NotificationType = 'order' | 'message' | 'auction' | 'request' | 'system';

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
    
    const all: Notification[] = JSON.parse(stored).map((n: any) => ({
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
