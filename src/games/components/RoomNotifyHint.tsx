import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { setupPushNotifications } from '@/services/pushNotifications';
import { getGameSession } from '../utils/gameAuth';

const DISMISS_KEY = 'game_notify_hint_dismissed_at';
const DISMISS_DAYS = 3;

const wasDismissedRecently = () => {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  return Date.now() - Number(raw) < DISMISS_DAYS * 24 * 60 * 60 * 1000;
};

export default function RoomNotifyHint() {
  const { toast } = useToast();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!getGameSession() || !('Notification' in window)) return;
    if (Notification.permission === 'granted' || wasDismissedRecently()) return;
    setBlocked(Notification.permission === 'denied');
    setVisible(true);
  }, []);

  const handleEnable = async () => {
    const user = getGameSession();
    if (!user) return;
    setLoading(true);
    try {
      const ok = await setupPushNotifications(`game_${user.id}`);
      if (ok) {
        toast({ title: 'Уведомления включены' });
        setVisible(false);
      } else if (Notification.permission === 'denied') {
        setBlocked(true);
      } else {
        toast({ variant: 'destructive', title: 'Не удалось включить уведомления', description: 'Попробуйте ещё раз' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
      <Icon name="BellRing" size={20} className="mt-0.5 shrink-0 text-amber-400" />
      <div className="flex-1 text-sm">
        <p className="font-medium text-slate-100">Узнавайте о ходе соперника</p>
        <p className="mt-0.5 text-slate-400">
          {blocked
            ? 'Уведомления заблокированы. Нажмите на значок замка рядом с адресом сайта и выберите «Разрешить» для уведомлений.'
            : 'Мы пришлём уведомление, когда соперник сходит.'}
        </p>
        {!blocked && (
          <Button
            size="sm"
            onClick={handleEnable}
            disabled={loading}
            className="mt-2 bg-amber-500 font-semibold text-slate-950 hover:bg-amber-600"
          >
            {loading && <Icon name="Loader2" size={14} className="mr-1.5 animate-spin" />}
            Разрешить уведомления
          </Button>
        )}
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Скрыть напоминание"
        className="shrink-0 rounded-full p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
      >
        <Icon name="X" size={16} />
      </button>
    </div>
  );
}
