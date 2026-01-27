import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface TelegramNotificationSettingsProps {
  userId: string;
}

export default function TelegramNotificationSettings({ userId }: TelegramNotificationSettingsProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [chatId, setChatId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const TELEGRAM_BOT_USERNAME = 'ErttpBot';
  const API_URL = 'https://functions.poehali.dev/e57f42ad-e2c3-420c-a418-16a98422a47d';

  useEffect(() => {
    checkConnection();
    
    // Проверяем URL параметр telegram_chat_id
    const urlParams = new URLSearchParams(window.location.search);
    const chatIdFromUrl = urlParams.get('telegram_chat_id');
    if (chatIdFromUrl) {
      setChatId(chatIdFromUrl);
      // Показываем уведомление
      toast({
        title: 'Chat ID получен!',
        description: 'Нажмите "Подключить" чтобы включить Telegram уведомления',
      });
      // Прокручиваем к секции Telegram
      setTimeout(() => {
        const telegramSection = document.querySelector('[data-telegram-settings]');
        if (telegramSection) {
          telegramSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      // Очищаем URL от параметра
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [userId]);

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'X-User-Id': userId,
        },
      });

      const data = await response.json();
      setIsConnected(data.connected || false);
    } catch (error) {
      console.error('Ошибка проверки подключения Telegram:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!chatId.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите Chat ID из Telegram',
        variant: 'destructive',
      });
      return;
    }

    setIsConnecting(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({
          telegram_chat_id: chatId.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsConnected(true);
        setChatId('');
        toast({
          title: 'Успешно',
          description: 'Telegram подключен! Вы будете получать уведомления',
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось подключить Telegram',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Ошибка подключения Telegram:', error);
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при подключении',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Вы уверены, что хотите отключить Telegram уведомления?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'DELETE',
        headers: {
          'X-User-Id': userId,
        },
      });

      if (response.ok) {
        setIsConnected(false);
        toast({
          title: 'Отключено',
          description: 'Telegram уведомления отключены',
        });
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось отключить Telegram',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Ошибка отключения Telegram:', error);
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при отключении',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const telegramBotLink = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${userId}`;

  return (
    <Card data-telegram-settings>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon name="MessageCircle" className="h-5 w-5" />
          <CardTitle>Telegram уведомления</CardTitle>
        </div>
        <CardDescription>
          Получайте моментальные уведомления об откликах прямо в Telegram
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Icon name="Loader2" className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isConnected ? (
          <>
            <div className="p-4 bg-primary/5 rounded-lg flex items-start gap-3">
              <Icon name="CheckCircle" className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium mb-1">Telegram подключен</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Вы получаете уведомления о новых откликах на ваши запросы и предложения
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={isLoading}
              className="w-full"
            >
              <Icon name="Unlink" className="mr-2 h-4 w-4" />
              Отключить Telegram
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <p className="text-sm font-medium">Как подключить:</p>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Откройте нашего бота в Telegram по кнопке ниже</li>
                  <li>Нажмите "Start" или отправьте команду /start</li>
                  <li>Скопируйте Chat ID из сообщения бота</li>
                  <li>Вставьте Chat ID в поле ниже и нажмите "Подключить"</li>
                </ol>
              </div>

              <Button
                variant="default"
                className="w-full"
                onClick={() => window.open(telegramBotLink, '_blank')}
              >
                <Icon name="ExternalLink" className="mr-2 h-4 w-4" />
                Открыть бота в Telegram
              </Button>

              <div className="space-y-2">
                <Label htmlFor="chatId">Chat ID из Telegram</Label>
                <Input
                  id="chatId"
                  type="text"
                  placeholder="Например: 123456789"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  disabled={isConnecting}
                  className={chatId ? 'border-primary' : ''}
                />
                {chatId ? (
                  <p className="text-xs text-primary flex items-center gap-1">
                    <Icon name="CheckCircle" className="h-3 w-3" />
                    Chat ID готов к подключению
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Chat ID это число, которое бот отправит вам после команды /start
                  </p>
                )}
              </div>

              <Button
                onClick={handleConnect}
                disabled={isConnecting || !chatId.trim()}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                    Подключение...
                  </>
                ) : (
                  <>
                    <Icon name="Link" className="mr-2 h-4 w-4" />
                    Подключить
                  </>
                )}
              </Button>
            </div>

            <div className="p-4 bg-blue-500/10 text-blue-900 dark:text-blue-100 rounded-lg flex items-start gap-3">
              <Icon name="Info" className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Преимущества Telegram</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Работает на всех устройствах (включая iOS)</li>
                  <li>Не требует разрешений браузера</li>
                  <li>Мгновенная доставка уведомлений</li>
                  <li>Можно ответить прямо из Telegram</li>
                </ul>
              </div>
            </div>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={checkConnection}
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
      </CardContent>
    </Card>
  );
}