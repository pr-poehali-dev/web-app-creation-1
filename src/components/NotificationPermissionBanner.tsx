import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { requestNotificationPermission } from '@/utils/notifications';

export default function NotificationPermissionBanner() {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      const dismissed = localStorage.getItem('notification_banner_dismissed');
      if (Notification.permission === 'default' && !dismissed) {
        setTimeout(() => setShow(true), 2000);
      }
    }
  }, []);

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setPermission('granted');
      setShow(false);
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
              <Button onClick={handleEnable} size="sm" className="flex-1">
                <Icon name="Check" className="mr-1.5 h-4 w-4" />
                Включить
              </Button>
              <Button onClick={handleDismiss} variant="outline" size="sm">
                Позже
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
