import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { setupPushNotifications, checkPushSubscription, subscribeToPushNotifications, sendSubscriptionToServer, registerServiceWorker } from '@/services/pushNotifications';
import { getGameSession } from '../utils/gameAuth';

const gamePushId = (gameUserId: number) => `game_${gameUserId}`;
const DISMISSED_KEY = 'game_push_prompt_dismissed';

const isIos = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

export default function GameNotificationBanner() {
  const [show, setShow] = useState(false);
  const [needsInstall, setNeedsInstall] = useState(false);
  const [denied, setDenied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getGameSession();
    if (!user) return;

    if (!('Notification' in window)) {
      if (isIos() && !isStandalone() && !sessionStorage.getItem(DISMISSED_KEY)) {
        setNeedsInstall(true);
        setShow(true);
      }
      return;
    }

    if (Notification.permission === 'default' && !sessionStorage.getItem(DISMISSED_KEY)) {
      setShow(true);
      return;
    }

    if (Notification.permission === 'granted') {
      registerServiceWorker().then(async (reg) => {
        if (!reg) return;
        await navigator.serviceWorker.ready;
        const existing = (await checkPushSubscription()) || (await subscribeToPushNotifications(reg));
        if (existing) await sendSubscriptionToServer(existing, gamePushId(user.id));
      }).catch(() => {});
    }
  }, []);

  const handleEnable = async () => {
    const user = getGameSession();
    if (!user) {
      setShow(false);
      return;
    }
    setLoading(true);
    try {
      const success = await setupPushNotifications(gamePushId(user.id));
      if (success) {
        setShow(false);
      } else if (Notification.permission === 'denied') {
        setDenied(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem(DISMISSED_KEY, '1');
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-amber-500/30 bg-slate-900 p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15">
          <Icon name="BellRing" className="h-7 w-7 text-amber-400" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-slate-100">Включите уведомления</h3>

        {needsInstall ? (
          <p className="mb-5 text-sm text-slate-400">
            На iPhone нажмите «Поделиться» и выберите «На экран Домой», затем откройте игры с иконки и включите уведомления.
          </p>
        ) : denied ? (
          <p className="mb-5 text-sm text-slate-400">
            Уведомления заблокированы. Разрешите их в настройках браузера для этого сайта.
          </p>
        ) : (
          <p className="mb-5 text-sm text-slate-400">
            Так вы узнаете, что соперник сделал ход, и получите напоминание о своём ходе.
          </p>
        )}

        <div className="flex flex-col gap-2">
          {!needsInstall && !denied && (
            <Button
              onClick={handleEnable}
              disabled={loading}
              className="w-full bg-amber-500 font-semibold text-slate-950 hover:bg-amber-600"
            >
              {loading ? <Icon name="Loader2" className="mr-1.5 h-4 w-4 animate-spin" /> : <Icon name="Bell" className="mr-1.5 h-4 w-4" />}
              {loading ? 'Подключение...' : 'Разрешить уведомления'}
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={handleDismiss}
            disabled={loading}
            className="w-full text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            {needsInstall || denied ? 'Понятно' : 'Не сейчас'}
          </Button>
        </div>
      </div>
    </div>
  );
}
