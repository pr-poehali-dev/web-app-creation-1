import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface TelegramConnectBannerProps {
  userId: string;
}

const TELEGRAM_CONNECT_API = 'https://functions.poehali.dev/e57f42ad-e2c3-420c-a418-16a98422a47d';
const DISMISSED_KEY = 'tg_banner_dismissed';

export default function TelegramConnectBanner({ userId }: TelegramConnectBannerProps) {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    fetch(TELEGRAM_CONNECT_API, { headers: { 'X-User-Id': userId } })
      .then(r => r.json())
      .then(data => {
        if (!data.connected) setVisible(true);
      })
      .catch(() => {});
  }, [userId]);

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="mt-4 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950">
      <Icon name="MessageCircle" className="h-5 w-5 flex-shrink-0 text-blue-500" />
      <p className="flex-1 text-sm text-blue-800 dark:text-blue-200">
        Подключите Telegram, чтобы мгновенно получать уведомления о заказах
      </p>
      <Button
        size="sm"
        variant="outline"
        className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900"
        onClick={() => navigate('/profile?section=telegram')}
      >
        Подключить
      </Button>
      <button
        onClick={handleDismiss}
        className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-200"
        aria-label="Закрыть"
      >
        <Icon name="X" className="h-4 w-4" />
      </button>
    </div>
  );
}
