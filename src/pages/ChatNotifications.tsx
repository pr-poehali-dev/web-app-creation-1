import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Icon from '@/components/ui/icon';
import { getSession } from '@/utils/auth';
import { ordersAPI } from '@/services/api';
import type { ChatNotification } from '@/types/chat';

interface ChatNotificationsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function ChatNotifications({ isAuthenticated, onLogout }: ChatNotificationsProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const currentUser = getSession();
  
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }

    const loadNotifications = async () => {
      try {
        const ordersResponse = await ordersAPI.getAll('all');
        const allOrders = ordersResponse.orders || [];
        
        const notificationsData: ChatNotification[] = [];
        
        for (const order of allOrders) {
          try {
            const messagesResponse = await ordersAPI.getMessagesByOrder(order.id);
            const messages = messagesResponse.messages || [];
            
            if (messages.length > 0) {
              const lastMessage = messages[messages.length - 1];
              const unreadMessages = messages.filter((msg: any) => 
                !msg.is_read && msg.sender_id?.toString() !== currentUser.id?.toString()
              );
              
              const isSeller = order.seller_id?.toString() === currentUser.id?.toString();
              const isMessageFromOtherUser = lastMessage.sender_id?.toString() !== currentUser.id?.toString();
              
              notificationsData.push({
                id: order.id,
                orderId: order.id,
                orderNumber: order.orderNumber || order.order_number || 'ORD-000',
                orderTitle: order.title,
                messagePreview: lastMessage.message,
                senderName: isSeller ? (order.buyerName || order.buyer_name || 'Покупатель') : (order.sellerName || order.seller_name || 'Продавец'),
                senderType: isSeller ? 'buyer' : 'seller',
                timestamp: new Date(lastMessage.created_at || lastMessage.timestamp),
                isRead: !isMessageFromOtherUser || lastMessage.is_read,
                unreadCount: unreadMessages.length
              });
            }
          } catch (error) {
            console.error(`Error loading messages for order ${order.id}:`, error);
          }
        }
        
        notificationsData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        setNotifications(notificationsData);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, [isAuthenticated, currentUser, navigate]);

  const handleNotificationClick = (notification: ChatNotification) => {
    navigate(`/my-orders?orderId=${notification.orderId}`);
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true, unreadCount: 0 }))
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="container mx-auto px-4 py-8 flex-1">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-6 flex-1">
        <BackButton />

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Сообщения в чатах</h1>
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount}</Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
              >
                Прочитать все
              </Button>
            )}
          </div>
          <p className="text-muted-foreground">
            Новые сообщения по вашим заказам и откликам
          </p>
        </div>

        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Icon name="MessageSquare" className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Нет сообщений</h3>
              <p className="text-muted-foreground text-center">
                У вас пока нет сообщений в чатах
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  !notification.isRead ? 'border-primary border-2' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${
                      notification.senderType === 'buyer' 
                        ? 'bg-blue-100 dark:bg-blue-900' 
                        : 'bg-green-100 dark:bg-green-900'
                    }`}>
                      <Icon 
                        name={notification.senderType === 'buyer' ? 'User' : 'Store'} 
                        className="h-5 w-5" 
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">
                              {notification.orderTitle}
                            </h3>
                            {notification.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs px-1.5 py-0">
                                {notification.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {notification.orderNumber} • {notification.senderName}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(notification.timestamp).toLocaleString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.messagePreview}
                      </p>
                    </div>

                    <Icon 
                      name="ChevronRight" 
                      className="h-5 w-5 text-muted-foreground flex-shrink-0" 
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}