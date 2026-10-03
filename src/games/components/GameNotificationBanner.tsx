import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { setupPushNotifications, checkPushSubscription, subscribeToPushNotifications, sendSubscriptionToServer, registerServiceWorker } from '@/services/pushNotifications';
import { getGameSession } from '../utils/gameAuth';

const gamePushId = (gameUserId: number) => `game_${gameUserId}`;

export default function GameNotificationBanner() {
  const [granted, setGranted] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const user = getGameSession();
    if (!user) return;

    if (!('Notification' in window) || Notification.permission !== 'granted') {
      setGranted(false);
      return;
    }

    registerServiceWorker().then(async (reg) => {
      if (!reg) return;
      await navigator.serviceWorker.ready;
      const existing = (await checkPushSubscription()) || (await subscribeToPushNotifications(reg));
      if (existing) await sendSubscriptionToServer(existing, gamePushId(user.id));
    }).catch(() => {});
  }, []);

  const handleEnable = async () => {
    const user = getGameSession();
    if (!user) return;
    if (!('Notification' in window) || Notification.permission === 'denied') {
      toast({ variant: 'destructive', title: 'Уведомления заблокированы', description: 'Разрешите их в настройках браузера' });
      return;
    }
    setLoading(true);
    try {
      const success = await setupPushNotifications(gamePushId(user.id));
      if (success) {
        setGranted(true);
        toast({ title: 'Уведомления включены' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (granted) return null;

  return (
    <Button
      onClick={handleEnable}
      disabled={loading}
      size="sm"
      className="bg-amber-500 font-semibold text-slate-950 hover:bg-amber-600"
    >
      <Icon name={loading ? 'Loader2' : 'BellRing'} size={14} className={loading ? 'mr-1.5 animate-spin' : 'mr-1.5'} />
      <span className="hidden sm:inline">Разрешить уведомления</span>
      <span className="sm:hidden">Уведомления</span>
    </Button>
  );
}
