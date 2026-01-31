import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { showBrowserNotification } from '@/utils/browserNotifications';

interface NotificationSettingsProps {
  userId: string;
}

export default function NotificationSettings({ userId }: NotificationSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkNotificationSupport();
    checkCurrentPermission();
  }, []);

  const checkNotificationSupport = () => {
    const supported = 'Notification' in window;
    setIsSupported(supported);
    
    if (!supported) {
      toast({
        title: 'Уведомления не поддерживаются',
        description: 'Ваш браузер не поддерживает уведомления',
        variant: 'destructive',
      });
    }
  };

  const checkCurrentPermission = () => {
    if ('Notification' in window) {
      const permission = Notification.permission;
      setIsEnabled(permission === 'granted');
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (!isSupported) return;

    setIsLoading(true);

    try {
      if (enabled) {
        // Запрашиваем разрешение на уведомления
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          setIsEnabled(true);
          
          // Автоматически включаем email-уведомления
          try {
            const authUrl = 'https://functions.poehali.dev/e95db6c2-d56f-42e2-b3e6-25fbf5e7bc98';
            await fetch(authUrl, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: parseInt(userId),
                emailNotifications: true
              })
            });
          } catch (e) {
            console.error('Не удалось включить email-уведомления:', e);
          }
          
          // Показываем тестовое уведомление
          new Notification('Уведомления включены!', {
            body: 'Теперь вы будете получать важные обновления',
            icon: '/logo-192.png',
          });
          
          toast({
            title: 'Уведомления включены',
            description: 'Вы будете получать важные обновления в браузере и на email',
          });
        } else {
          toast({
            title: 'Разрешение не предоставлено',
            description: 'Пожалуйста, разрешите уведомления в настройках браузера',
            variant: 'destructive',
          });
        }
      } else {
        setIsEnabled(false);
        toast({
          title: 'Уведомления отключены',
          description: 'Чтобы снова включить, переключите тумблер',
        });
      }
    } catch (error) {
      console.error('Ошибка переключения уведомлений:', error);
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при изменении настроек',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon name="Bell" className="h-5 w-5" />
          <CardTitle>Push-уведомления</CardTitle>
        </div>
        <CardDescription>
          Получайте моментальные уведомления об откликах на ваши запросы и предложения
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSupported ? (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-start gap-3">
            <Icon name="AlertCircle" className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-1">Браузер не поддерживается</p>
              <p>Ваш браузер не поддерживает push-уведомления. Попробуйте использовать Chrome, Firefox, Edge или Safari.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications" className="text-base">
                  Включить уведомления
                </Label>
                <p className="text-sm text-muted-foreground">
                  Получайте моментальные уведомления на этом устройстве
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={isEnabled}
                onCheckedChange={handleToggleNotifications}
                disabled={isLoading}
              />
            </div>

            {isEnabled && (
              <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Icon name="CheckCircle" className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Вы получаете уведомления о:</p>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                  <li className="flex items-center gap-2">
                    <Icon name="Dot" className="h-4 w-4" />
                    Новых откликах на ваши запросы и предложения
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="Dot" className="h-4 w-4" />
                    Встречных предложениях цены
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="Dot" className="h-4 w-4" />
                    Принятии и отклонении заказов
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="Dot" className="h-4 w-4" />
                    Новых сообщениях по заказам
                  </li>
                </ul>
              </div>
            )}

            {Notification.permission === 'denied' && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-start gap-3">
                <Icon name="AlertCircle" className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold mb-1">Уведомления заблокированы</p>
                  <p>Вы заблокировали уведомления для этого сайта. Чтобы включить их, откройте настройки браузера и разрешите уведомления для этого сайта.</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={checkCurrentPermission}
                disabled={isLoading}
                className="flex-1"
              >
                <Icon name="RefreshCw" className="mr-2 h-4 w-4" />
                Проверить
              </Button>
              
              {isEnabled && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    showBrowserNotification({
                      title: 'Тестовое уведомление',
                      body: 'Уведомления работают отлично! 🎉',
                    });
                  }}
                  className="flex-1"
                >
                  <Icon name="TestTube" className="mr-2 h-4 w-4" />
                  Тест
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}