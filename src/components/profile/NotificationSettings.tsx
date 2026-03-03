import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { setupPushNotifications, unsubscribeFromPush, checkPushSubscription } from '@/services/pushNotifications';

interface NotificationSettingsProps {
  userId: string;
}

export default function NotificationSettings({ userId }: NotificationSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    if (!('Notification' in window)) {
      setIsLoading(false);
      return;
    }
    setIsBlocked(Notification.permission === 'denied');
    try {
      const sub = await checkPushSubscription();
      setIsEnabled(!!sub && Notification.permission === 'granted');
    } catch {
      setIsEnabled(false);
    }
    setIsLoading(false);
  };

  const handleToggle = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      if (enabled) {
        // Один клик — браузер сам покажет диалог разрешения, затем подписка
        const success = await setupPushNotifications(userId);
        if (success) {
          setIsEnabled(true);
          setIsBlocked(false);
          toast({ title: 'Уведомления включены', description: 'Будете получать уведомления о заказах и сообщениях' });
        } else {
          const perm = Notification.permission;
          if (perm === 'denied') {
            setIsBlocked(true);
            toast({
              title: 'Браузер заблокировал уведомления',
              description: 'Нажмите 🔒 у адресной строки → Уведомления → Разрешить, затем обновите страницу',
              variant: 'destructive',
            });
          } else {
            toast({ title: 'Не удалось включить', description: 'Попробуйте ещё раз', variant: 'destructive' });
          }
        }
      } else {
        await unsubscribeFromPush();
        setIsEnabled(false);
        toast({ title: 'Уведомления отключены' });
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Попробуйте ещё раз', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon name="Bell" className="h-5 w-5" />
            <CardTitle>Push-уведомления</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Ваш браузер не поддерживает push-уведомления. Используйте Chrome, Firefox или Edge.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon name="Bell" className="h-5 w-5" />
          <CardTitle>Push-уведомления</CardTitle>
        </div>
        <CardDescription>
          Мгновенные уведомления о новых откликах, сообщениях и заказах прямо в браузере
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="push-toggle" className="text-base">
              {isEnabled ? 'Уведомления включены' : 'Включить уведомления'}
            </Label>
            <p className="text-sm text-muted-foreground">
              {isEnabled
                ? 'Вы получаете уведомления на этом устройстве'
                : 'При включении браузер запросит разрешение'}
            </p>
          </div>
          <Switch
            id="push-toggle"
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={isLoading || isBlocked}
          />
        </div>

        {isBlocked && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm space-y-2">
            <p className="font-semibold flex items-center gap-2">
              <Icon name="AlertCircle" className="h-4 w-4" />
              Уведомления заблокированы в браузере
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-1">
              <li>Нажмите на замок 🔒 слева от адреса сайта</li>
              <li>Найдите строку «Уведомления» → выберите «Разрешить»</li>
              <li>Обновите страницу и включите снова</li>
            </ol>
          </div>
        )}

        {isEnabled && (
          <div className="p-3 bg-primary/5 rounded-lg text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Вы получаете уведомления о:</p>
            <ul className="space-y-0.5 ml-2">
              <li>• Новых откликах на ваши запросы и предложения</li>
              <li>• Встречных предложениях цены</li>
              <li>• Принятии и отклонении заказов</li>
              <li>• Новых сообщениях по заказам</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
