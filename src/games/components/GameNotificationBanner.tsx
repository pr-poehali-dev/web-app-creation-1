import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { setupPushNotifications, checkPushSubscription, subscribeToPushNotifications, sendSubscriptionToServer, registerServiceWorker } from '@/services/pushNotifications';
import { getGameSession } from '../utils/gameAuth';

// Префикс отделяет игровых пользователей (game_users.id) от обычных пользователей
// сайта (users.id) в общей таблице push_subscriptions — это две разные системы аккаунтов.
const gamePushId = (gameUserId: number) => `game_${gameUserId}`;

// Баннер «Включить уведомления о ходах» — отдельно от push основного сайта,
// т.к. игровой раздел использует независимую систему аутентификации (game_token/game_user).
export default function GameNotificationBanner() {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) return;
    setPermission(Notification.permission);

    const dismissed = localStorage.getItem('game_notification_banner_dismissed');
    const user = getGameSession();
    if (!user) return;

    if (Notification.permission === 'default' && !dismissed) {
      setTimeout(() => setShow(true), 2000);
    }

    // Если разрешение уже выдано — переподписываемся на случай смены VAPID ключа
    if (Notification.permission === 'granted') {
      registerServiceWorker().then(async (reg) => {
        if (!reg) return;
        await navigator.serviceWorker.ready;
        const existing = await checkPushSubscription();
        if (!existing) {
          const newSub = await subscribeToPushNotifications(reg);
          if (newSub) await sendSubscriptionToServer(newSub, gamePushId(user.id));
        }
      }).catch(() => {});
    }
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const user = getGameSession();
      if (!user) {
        setShow(false);
        return;
      }
      const success = await setupPushNotifications(gamePushId(user.id));
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
    localStorage.setItem('game_notification_banner_dismissed', 'true');
  };

  if (!show || permission !== 'default') return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] shadow-2xl rounded-xl border border-amber-500/20 bg-slate-900">
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 flex-shrink-0">
            <Icon name="Bell" className="h-6 w-6 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1 text-slate-100">Уведомлять о ходах?</h3>
            <p className="text-sm text-slate-400 mb-4">
              Получайте уведомление, когда наступает ваш ход в шахматах, шашках или покере
            </p>
            <div className="flex gap-2">
              <Button onClick={handleEnable} size="sm" className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold" disabled={loading}>
                {loading ? (
                  <Icon name="Loader2" className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Icon name="Check" className="mr-1.5 h-4 w-4" />
                )}
                {loading ? 'Подключение...' : 'Включить'}
              </Button>
              <Button onClick={handleDismiss} variant="outline" size="sm" disabled={loading} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                Позже
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
