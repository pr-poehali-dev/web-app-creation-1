import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface TelegramSetupProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function TelegramSetup({ isAuthenticated, onLogout }: TelegramSetupProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [isSetting, setIsSetting] = useState(false);
  const [webhookInfo, setWebhookInfo] = useState<any>(null);

  const API_URL = 'https://functions.poehali.dev/50d426b2-7c22-44d0-8474-b4b2f19b9a09';

  const checkWebhook = async () => {
    setIsChecking(true);
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
      });

      const data = await response.json();

      if (data.success) {
        setWebhookInfo(data.webhook_info);
        
        const isConfigured = data.webhook_info?.url === data.expected_url;
        
        toast({
          title: isConfigured ? 'Вебхук настроен' : 'Вебхук не настроен',
          description: isConfigured 
            ? 'Telegram бот подключен и готов к работе'
            : 'Нажмите кнопку "Настроить вебхук" для активации бота',
          variant: isConfigured ? 'default' : 'destructive',
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось проверить статус вебхука',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const setupWebhook = async () => {
    setIsSetting(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Успешно!',
          description: 'Вебхук настроен. Telegram бот готов к работе!',
        });
        
        // Обновляем информацию
        setTimeout(checkWebhook, 1000);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось настроить вебхук',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive',
      });
    } finally {
      setIsSetting(false);
    }
  };

  const isWebhookConfigured = webhookInfo?.url && webhookInfo.url.includes('functions.poehali.dev');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
            Назад
          </Button>

          <h1 className="text-3xl font-bold mb-2">Настройка Telegram бота</h1>
          <p className="text-muted-foreground mb-8">
            Подключение бота для отправки уведомлений пользователям
          </p>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Шаг 1: Создайте бота</CardTitle>
                <CardDescription>
                  Если вы еще не создали бота, следуйте инструкциям
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside space-y-3 text-sm">
                  <li>Откройте Telegram и найдите <strong>@BotFather</strong></li>
                  <li>Отправьте команду <code className="bg-muted px-2 py-1 rounded">/newbot</code></li>
                  <li>Введите название бота (например: "ЕРТТП Уведомления")</li>
                  <li>Введите username (обязательно заканчивается на "bot", например: "ErttpBot")</li>
                  <li>BotFather пришлет вам токен - скопируйте его</li>
                  <li>Добавьте токен в секреты проекта как <code className="bg-muted px-2 py-1 rounded">TELEGRAM_BOT_TOKEN</code></li>
                </ol>

                <div className="p-4 bg-primary/5 rounded-lg flex items-start gap-3">
                  <Icon name="CheckCircle" className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Токен уже добавлен</p>
                    <p className="text-muted-foreground">
                      TELEGRAM_BOT_TOKEN найден в секретах проекта
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Шаг 2: Настройте вебхук</CardTitle>
                <CardDescription>
                  Подключите бота к нашему серверу для получения сообщений
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    onClick={checkWebhook}
                    disabled={isChecking}
                    variant="outline"
                    className="w-full"
                  >
                    {isChecking ? (
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

                  <Button
                    onClick={setupWebhook}
                    disabled={isSetting}
                    className="w-full"
                  >
                    {isSetting ? (
                      <>
                        <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                        Настройка...
                      </>
                    ) : (
                      <>
                        <Icon name="Link" className="mr-2 h-4 w-4" />
                        Настроить вебхук
                      </>
                    )}
                  </Button>
                </div>

                {webhookInfo && (
                  <div className={`p-4 rounded-lg ${isWebhookConfigured ? 'bg-green-500/10 text-green-900 dark:text-green-100' : 'bg-yellow-500/10 text-yellow-900 dark:text-yellow-100'}`}>
                    <div className="flex items-start gap-3">
                      <Icon 
                        name={isWebhookConfigured ? "CheckCircle" : "AlertCircle"} 
                        className="h-5 w-5 flex-shrink-0 mt-0.5" 
                      />
                      <div className="text-sm space-y-2 flex-1">
                        <p className="font-semibold">
                          {isWebhookConfigured ? 'Вебхук настроен корректно' : 'Вебхук требует настройки'}
                        </p>
                        <div className="space-y-1">
                          <p>
                            <span className="font-medium">URL:</span>{' '}
                            <code className="text-xs bg-background/50 px-2 py-1 rounded">
                              {webhookInfo.url || 'не настроен'}
                            </code>
                          </p>
                          {webhookInfo.pending_update_count !== undefined && (
                            <p>
                              <span className="font-medium">Ожидающих обновлений:</span> {webhookInfo.pending_update_count}
                            </p>
                          )}
                          {webhookInfo.last_error_message && (
                            <p className="text-red-600 dark:text-red-400">
                              <span className="font-medium">Последняя ошибка:</span> {webhookInfo.last_error_message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Шаг 3: Протестируйте бота</CardTitle>
                <CardDescription>
                  Убедитесь, что бот отвечает на сообщения
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside space-y-3 text-sm">
                  <li>Найдите вашего бота в Telegram по username (например, @ErttpBot)</li>
                  <li>Отправьте команду <code className="bg-muted px-2 py-1 rounded">/start</code></li>
                  <li>Бот должен ответить с вашим Chat ID</li>
                  <li>Скопируйте Chat ID и протестируйте подключение в профиле</li>
                </ol>

                <div className="p-4 bg-blue-500/10 text-blue-900 dark:text-blue-100 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Icon name="Info" className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold mb-1">Важно</p>
                      <p>
                        После настройки вебхука пользователи смогут подключать Telegram уведомления в своих профилях.
                        Они будут получать моментальные уведомления об откликах на запросы и предложения.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isWebhookConfigured && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="CheckCircle" className="h-5 w-5 text-green-600" />
                    Готово!
                  </CardTitle>
                  <CardDescription>
                    Telegram бот успешно настроен и готов к работе
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate('/profile')} className="w-full">
                    <Icon name="User" className="mr-2 h-4 w-4" />
                    Перейти в профиль
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
