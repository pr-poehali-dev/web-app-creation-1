import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { 
  setupPushNotifications, 
  checkPushSubscription, 
  unsubscribeFromPush 
} from '@/services/pushNotifications';

interface NotificationSettingsProps {
  userId: string;
}

export default function NotificationSettings({ userId }: NotificationSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkNotificationSupport();
    checkCurrentSubscription();
  }, []);

  const checkNotificationSupport = () => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    
    if (!supported) {
      toast({
        title: 'Уведомления не поддерживаются',
        description: 'Ваш браузер не поддерживает push-уведомления',
        variant: 'destructive',
      });
    }
  };

  const checkCurrentSubscription = async () => {
    setIsLoading(true);
    try {
      const subscription = await checkPushSubscription();
      setIsEnabled(!!subscription);
    } catch (error) {
      console.error('Ошибка проверки подписки:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (!isSupported) return;

    setIsLoading(true);

    try {
      if (enabled) {
        const success = await setupPushNotifications(userId);
        if (success) {
          setIsEnabled(true);
          toast({
            title: 'Уведомления включены',
            description: 'Вы будете получать важные обновления',
          });
        } else {
          toast({
            title: 'Не удалось включить уведомления',
            description: 'Проверьте разрешения браузера',
            variant: 'destructive',
          });
        }
      } else {
        const success = await unsubscribeFromPush();
        if (success) {
          setIsEnabled(false);
          toast({
            title: 'Уведомления отключены',
            description: 'Вы больше не будете получать push-уведомления',
          });
        } else {
          toast({
            title: 'Ошибка',
            description: 'Не удалось отключить уведомления',
            variant: 'destructive',
          });
        }
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
                    Откликах на ваши запросы и предложения
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

            <Button
              variant="outline"
              size="sm"
              onClick={checkCurrentSubscription}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                  Проверка...
                </>
              ) : (
                <>
                  <Icon name="RefreshCw" className="mr-2 h-4 w-4" />
                  Проверить статус
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}