import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { setupPushNotifications } from '@/services/pushNotifications';
import { getSession } from '@/utils/auth';

export default function NotificationPermissionBanner() {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);

      const dismissed = localStorage.getItem('notification_banner_dismissed');
      if (Notification.permission === 'default' && !dismissed) {
        setTimeout(() => setShow(true), 2000);
      }

      // Если разрешение уже выдано — всегда переподписываемся (на случай смены VAPID ключа)
      if (Notification.permission === 'granted') {
        const session = getSession();
        if (session?.id) {
          // Сбрасываем старую подписку и создаём новую
          import('@/services/pushNotifications').then(({ checkPushSubscription, subscribeToPushNotifications, sendSubscriptionToServer, registerServiceWorker }) => {
            registerServiceWorker().then(async (reg) => {
              if (!reg) return;
              await navigator.serviceWorker.ready;
              // Отписываемся от старой подписки чтобы создать новую с актуальным ключом
              const existing = await reg.pushManager.getSubscription();
              if (existing) await existing.unsubscribe();
              const newSub = await subscribeToPushNotifications(reg);
              if (newSub) await sendSubscriptionToServer(newSub, String(session.id));
            }).catch(() => {});
          });
        }
      }
    }
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const session = getSession();
      const userId = session?.id ? String(session.id) : null;

      if (!userId) {
        setShow(false);
        return;
      }

      const success = await setupPushNotifications(userId);
      if (success) {
        setPermission('granted');
        setShow(false);
      } else if (Notification.permission === 'denied') {
        setPermission('denied');
        setShow(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('notification_banner_dismissed', 'true');
  };

  if (!show || permission !== 'default') {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] shadow-2xl border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
            <Icon name="Bell" className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Включить уведомления?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Получайте мгновенные уведомления о новых заказах, сообщениях и важных событиях
            </p>
            <div className="flex gap-2">
              <Button onClick={handleEnable} size="sm" className="flex-1" disabled={loading}>
                {loading ? (
                  <Icon name="Loader2" className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Icon name="Check" className="mr-1.5 h-4 w-4" />
                )}
                {loading ? 'Подключение...' : 'Включить'}
              </Button>
              <Button onClick={handleDismiss} variant="outline" size="sm" disabled={loading}>
                Позже
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}