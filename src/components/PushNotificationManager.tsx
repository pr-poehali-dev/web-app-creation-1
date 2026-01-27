import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed, registerServiceWorker } from '@/utils/pushNotifications';
import { getSession } from '@/utils/auth';

export default function PushNotificationManager() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();
  const currentUser = getSession();

  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setIsSupported(supported);
      
      if (supported) {
        const subscribed = await isPushSubscribed();
        setIsSubscribed(subscribed);
      }
    };
    
    checkSupport();
  }, []);

  const handleSubscribe = async () => {
    if (!currentUser) {
      toast({
        title: 'Требуется авторизация',
        description: 'Войдите в систему для подписки на уведомления',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Регистрируем Service Worker
      await registerServiceWorker();
      
      // Подписываемся на push
      const success = await subscribeToPush(currentUser.id.toString());
      
      if (success) {
        setIsSubscribed(true);
        toast({
          title: '✅ Подписка активирована',
          description: 'Теперь вы будете получать уведомления о новых заказах даже когда сайт закрыт',
        });
      } else {
        toast({
          title: 'Ошибка подписки',
          description: 'Не удалось активировать уведомления. Проверьте разрешения браузера.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[Push] Ошибка подписки:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось активировать уведомления',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    
    try {
      const success = await unsubscribeFromPush(currentUser.id.toString());
      
      if (success) {
        setIsSubscribed(false);
        toast({
          title: 'Подписка отменена',
          description: 'Push-уведомления отключены',
        });
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось отключить уведомления',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[Push] Ошибка отписки:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отключить уведомления',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Push-уведомления</CardTitle>
          <CardDescription>
            Ваш браузер не поддерживает push-уведомления
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon name="Bell" className="h-5 w-5" />
          Push-уведомления
        </CardTitle>
        <CardDescription>
          {isSubscribed 
            ? 'Вы получаете уведомления о новых заказах даже когда сайт закрыт'
            : 'Включите уведомления, чтобы не пропускать новые заказы'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${isSubscribed ? 'bg-green-500' : 'bg-gray-300'}`} />
              <div>
                <p className="text-sm font-medium">
                  {isSubscribed ? 'Активно' : 'Неактивно'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isSubscribed 
                    ? 'Уведомления включены'
                    : 'Уведомления отключены'
                  }
                </p>
              </div>
            </div>
            
            {isSubscribed ? (
              <Button 
                onClick={handleUnsubscribe} 
                variant="outline" 
                size="sm"
                disabled={isLoading}
              >
                {isLoading ? 'Отключение...' : 'Отключить'}
              </Button>
            ) : (
              <Button 
                onClick={handleSubscribe} 
                size="sm"
                disabled={isLoading}
              >
                <Icon name="Bell" className="mr-2 h-4 w-4" />
                {isLoading ? 'Подключение...' : 'Включить'}
              </Button>
            )}
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Как это работает:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Мгновенные уведомления о новых заказах</li>
              <li>Работает даже когда сайт закрыт</li>
              <li>Звук + всплывающее окно в браузере</li>
              <li>Доступно на компьютере и телефоне</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
