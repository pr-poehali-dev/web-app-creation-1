import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';

interface NotificationsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

type NotificationType = 'order' | 'message' | 'auction' | 'request' | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  link?: string;
}

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  order: 'ShoppingCart',
  message: 'MessageSquare',
  auction: 'Gavel',
  request: 'FileText',
  system: 'Bell',
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  order: 'text-blue-500',
  message: 'text-green-500',
  auction: 'text-purple-500',
  request: 'text-orange-500',
  system: 'text-gray-500',
};

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'order',
    title: 'Новый заказ',
    message: 'Получен новый заказ на "Офисная мебель" от ООО "МебельСтрой"',
    isRead: false,
    createdAt: new Date('2024-11-29T14:30:00'),
    link: '/active-orders',
  },
  {
    id: '2',
    type: 'auction',
    title: 'Новая ставка на аукционе',
    message: 'На ваш аукцион "Строительные материалы" сделана новая ставка: 18 500 ₽',
    isRead: false,
    createdAt: new Date('2024-11-29T12:15:00'),
    link: '/my-auctions',
  },
  {
    id: '3',
    type: 'message',
    title: 'Новое сообщение',
    message: 'Вам написал ИП Иванов А.А. по предложению "Стройматериалы оптом"',
    isRead: false,
    createdAt: new Date('2024-11-29T10:45:00'),
  },
  {
    id: '4',
    type: 'request',
    title: 'Отклик на запрос',
    message: 'Получен новый отклик на ваш запрос "Поставка офисной мебели"',
    isRead: true,
    createdAt: new Date('2024-11-28T16:20:00'),
    link: '/my-requests',
  },
  {
    id: '5',
    type: 'system',
    title: 'Модерация завершена',
    message: 'Ваше предложение "Строительные материалы" прошло модерацию и опубликовано',
    isRead: true,
    createdAt: new Date('2024-11-28T09:00:00'),
    link: '/my-offers',
  },
  {
    id: '6',
    type: 'auction',
    title: 'Аукцион скоро завершится',
    message: 'Ваш аукцион "Оборудование для склада" завершится через 2 часа',
    isRead: true,
    createdAt: new Date('2024-11-27T18:30:00'),
    link: '/my-auctions',
  },
];

export default function Notifications({ isAuthenticated, onLogout }: NotificationsProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getSession();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }

    setTimeout(() => {
      setNotifications(MOCK_NOTIFICATIONS);
      setIsLoading(false);
    }, 800);
  }, [isAuthenticated, currentUser, navigate]);

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(n => !n.isRead);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    toast({
      title: 'Успешно',
      description: 'Все уведомления отмечены как прочитанные',
    });
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
    toast({
      title: 'Успешно',
      description: 'Уведомление удалено',
    });
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}д назад`;
    if (hours > 0) return `${hours}ч назад`;
    if (minutes > 0) return `${minutes}м назад`;
    return 'Только что';
  };

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const iconName = NOTIFICATION_ICONS[notification.type];
    const iconColor = NOTIFICATION_COLORS[notification.type];

    return (
      <Card 
        className={`hover:shadow-md transition-shadow cursor-pointer ${
          !notification.isRead ? 'border-l-4 border-l-primary bg-primary/5' : ''
        }`}
        onClick={() => handleNotificationClick(notification)}
      >
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className={`flex-shrink-0 ${iconColor}`}>
              <Icon name={iconName as any} className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-base">{notification.title}</h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!notification.isRead && (
                    <Badge variant="default" className="bg-primary">Новое</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(notification.id);
                    }}
                  >
                    <Icon name="X" className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {notification.message}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Icon name="Clock" className="h-3 w-3" />
                  {getTimeAgo(notification.createdAt)}
                </span>
                {!notification.isRead && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notification.id);
                    }}
                  >
                    Отметить прочитанным
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
              <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
              Назад
            </Button>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  Уведомления
                  {unreadCount > 0 && (
                    <Badge variant="default" className="bg-primary">
                      {unreadCount}
                    </Badge>
                  )}
                </h1>
                <p className="text-muted-foreground mt-1">
                  Все важные события и обновления
                </p>
              </div>
              {unreadCount > 0 && (
                <Button variant="outline" onClick={handleMarkAllAsRead}>
                  <Icon name="CheckCheck" className="mr-2 h-4 w-4" />
                  Отметить все прочитанными
                </Button>
              )}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="all">
                Все уведомления
              </TabsTrigger>
              <TabsTrigger value="unread">
                Непрочитанные
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="h-32 animate-pulse bg-muted" />
                  ))}
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-20">
                  <Icon name="Bell" className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
                  <h3 className="text-xl font-semibold mb-2">
                    {activeTab === 'all' ? 'Нет уведомлений' : 'Нет непрочитанных уведомлений'}
                  </h3>
                  <p className="text-muted-foreground mb-8">
                    {activeTab === 'all' 
                      ? 'Здесь будут отображаться важные события'
                      : 'Все уведомления прочитаны'
                    }
                  </p>
                  {activeTab === 'unread' && notifications.length > 0 && (
                    <Button variant="outline" onClick={() => setActiveTab('all')}>
                      <Icon name="Eye" className="mr-2 h-4 w-4" />
                      Показать все
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                      Показано: <span className="font-semibold text-foreground">{filteredNotifications.length}</span> уведомлений
                    </p>
                  </div>

                  <div className="space-y-4">
                    {filteredNotifications.map((notification) => (
                      <NotificationCard key={notification.id} notification={notification} />
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
