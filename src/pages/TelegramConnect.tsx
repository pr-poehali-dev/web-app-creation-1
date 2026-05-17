import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
          };
        };
        ready: () => void;
        close: () => void;
        expand: () => void;
      };
    };
  }
}

export default function TelegramConnect() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'login'>('loading');
  const [message, setMessage] = useState('Подключаем Telegram...');
  const [chatId, setChatId] = useState<number | null>(null);

  useEffect(() => {
    const connectTelegram = async () => {
      try {
        // Проверяем, что мы внутри Telegram
        if (!window.Telegram?.WebApp) {
          setStatus('error');
          setMessage('Эта страница работает только внутри Telegram');
          return;
        }

        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        const user = tg.initDataUnsafe.user;
        if (!user) {
          setStatus('error');
          setMessage('Не удалось получить данные Telegram');
          return;
        }

        setChatId(user.id);

        // Проверяем авторизацию на сайте
        const sessionResponse = await fetch('https://functions.poehali.dev/fbbc018c-3522-4d56-bbb3-1ba113a4d213', {
          method: 'GET',
          credentials: 'include',
        });

        if (!sessionResponse.ok) {
          setStatus('login');
          setMessage('Сначала войдите на сайт ЕРТТП');
          return;
        }

        const sessionData = await sessionResponse.json();
        const userId = sessionData.user?.id;

        if (!userId) {
          setStatus('login');
          setMessage('Сначала войдите на сайт ЕРТТП');
          return;
        }

        // Привязываем Telegram Chat ID
        const connectResponse = await fetch('https://functions.poehali.dev/e57f42ad-e2c3-420c-a418-16a98422a47d', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': String(userId),
          },
          body: JSON.stringify({
            telegram_chat_id: String(user.id),
          }),
        });

        if (connectResponse.ok) {
          setStatus('success');
          setMessage(`✅ Telegram подключен!\n\nВы будете получать уведомления об откликах`);
          setTimeout(() => {
            tg.close();
          }, 2000);
        } else {
          const errorData = await connectResponse.json();
          setStatus('error');
          setMessage(errorData.error || 'Не удалось подключить Telegram');
        }
      } catch (error) {
        console.error('Connection error:', error);
        setStatus('error');
        setMessage('Произошла ошибка при подключении');
      }
    };

    connectTelegram();
  }, []);

  const handleOpenSite = () => {
    window.open('https://erttp.ru', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && <Icon name="Loader2" className="h-12 w-12 animate-spin text-primary" />}
            {status === 'success' && <Icon name="CheckCircle" className="h-12 w-12 text-green-500" />}
            {status === 'error' && <Icon name="XCircle" className="h-12 w-12 text-red-500" />}
            {status === 'login' && <Icon name="LogIn" className="h-12 w-12 text-amber-500" />}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Подключение...'}
            {status === 'success' && 'Успешно!'}
            {status === 'error' && 'Ошибка'}
            {status === 'login' && 'Требуется вход'}
          </CardTitle>
          <CardDescription className="text-base mt-2 whitespace-pre-line">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chatId && (
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Ваш Chat ID:</p>
              <code className="text-lg font-mono font-bold">{chatId}</code>
            </div>
          )}
          
          {status === 'login' && (
            <Button onClick={handleOpenSite} className="w-full" size="lg">
              <Icon name="ExternalLink" className="mr-2 h-5 w-5" />
              Открыть сайт ЕРТТП
            </Button>
          )}

          {status === 'error' && (
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full" size="lg">
              <Icon name="RotateCw" className="mr-2 h-5 w-5" />
              Попробовать снова
            </Button>
          )}

          {status === 'success' && (
            <p className="text-center text-sm text-muted-foreground">
              Окно закроется автоматически...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
