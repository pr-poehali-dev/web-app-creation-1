import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import funcUrl from '../../backend/func2url.json';

interface TelegramSettingsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function TelegramSettings({ isAuthenticated, onLogout }: TelegramSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [telegramLink, setTelegramLink] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    checkTelegramStatus();
  }, [isAuthenticated, navigate]);

  const checkTelegramStatus = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
      const response = await fetch(
        `${funcUrl['telegram-bot']}?action=check_status&user_id=${userId}`
      );
      const data = await response.json();

      if (data.success) {
        setIsVerified(data.verified);
        setUsername(data.username);
      }
    } catch (error) {
      console.error('Error checking Telegram status:', error);
    }
  };

  const handleGenerateLink = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось получить ID пользователя',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${funcUrl['telegram-bot']}?action=generate_link_code&user_id=${userId}`
      );
      const data = await response.json();

      if (data.success) {
        setTelegramLink(data.link);
        toast({
          title: 'Ссылка создана',
          description: 'Перейдите по ссылке, чтобы привязать Telegram',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: 'Не удалось создать ссылку',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Произошла ошибка при создании ссылки',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenTelegram = () => {
    if (telegramLink) {
      window.open(telegramLink, '_blank');
      
      // Проверяем статус каждые 3 секунды
      const checkInterval = setInterval(async () => {
        await checkTelegramStatus();
        if (isVerified) {
          clearInterval(checkInterval);
        }
      }, 3000);

      // Останавливаем проверку через 5 минут
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 300000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/profile')}
            className="mb-6"
          >
            <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
            Назад в профиль
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Icon name="MessageCircle" className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Настройки Telegram</CardTitle>
                  <CardDescription>
                    Подключите Telegram для быстрого подтверждения действий
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isVerified ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <Icon name="CheckCircle" className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">
                        Telegram подключен
                      </p>
                      {username && (
                        <p className="text-sm text-green-700 dark:text-green-300">
                          @{username}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-medium">Что вы получаете:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <Icon name="Check" className="h-5 w-5 text-primary mt-0.5" />
                        <span className="text-sm">Коды подтверждения для входа</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="Check" className="h-5 w-5 text-primary mt-0.5" />
                        <span className="text-sm">Ссылки для сброса пароля</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="Check" className="h-5 w-5 text-primary mt-0.5" />
                        <span className="text-sm">Важные уведомления</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="Check" className="h-5 w-5 text-primary mt-0.5" />
                        <span className="text-sm">Альтернатива email (без спама)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-medium mb-2">Как подключить Telegram:</h3>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="font-medium text-foreground">1.</span>
                        <span>Нажмите кнопку "Подключить Telegram" ниже</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-medium text-foreground">2.</span>
                        <span>Откроется Telegram бот — нажмите "Start"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-medium text-foreground">3.</span>
                        <span>Бот автоматически привяжется к вашему аккаунту</span>
                      </li>
                    </ol>
                  </div>

                  {!telegramLink ? (
                    <Button
                      onClick={handleGenerateLink}
                      disabled={isLoading}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Icon name="Loader2" className="mr-2 h-5 w-5 animate-spin" />
                          Создание ссылки...
                        </>
                      ) : (
                        <>
                          <Icon name="MessageCircle" className="mr-2 h-5 w-5" />
                          Подключить Telegram
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Button
                        onClick={handleOpenTelegram}
                        className="w-full"
                        size="lg"
                      >
                        <Icon name="ExternalLink" className="mr-2 h-5 w-5" />
                        Открыть Telegram бота
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Ссылка действительна 10 минут
                      </p>
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <Icon name="Info" className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Зачем нужен Telegram?
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Telegram — это бесплатная альтернатива email для получения кодов
                          подтверждения и уведомлений. Быстрее и удобнее обычной почты!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
