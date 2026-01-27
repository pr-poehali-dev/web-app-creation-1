import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface EmailNotificationSettingsProps {
  userId: string;
  userEmail: string;
}

export default function EmailNotificationSettings({ userId, userEmail }: EmailNotificationSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const API_URL = 'https://functions.poehali.dev/admin-users';

  useEffect(() => {
    checkSettings();
  }, [userId]);

  const checkSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}?id=${userId}`, {
        method: 'GET',
      });

      const data = await response.json();
      if (data.user?.email_notifications !== undefined) {
        setIsEnabled(data.user.email_notifications);
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    setIsSaving(true);
    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userId,
          email_notifications: checked,
        }),
      });

      if (response.ok) {
        setIsEnabled(checked);
        toast({
          title: checked ? 'Включено' : 'Отключено',
          description: checked
            ? 'Вы будете получать уведомления на email'
            : 'Email уведомления отключены',
        });
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось изменить настройки',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Ошибка изменения настроек email:', error);
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при изменении настроек',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon name="Mail" className="h-5 w-5" />
          <CardTitle>Email уведомления</CardTitle>
        </div>
        <CardDescription>
          Получайте уведомления об откликах на вашу почту
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Icon name="Loader2" className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="email-toggle" className="text-sm font-medium cursor-pointer">
                    Уведомления на email
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Отправлять уведомления на {userEmail}
                  </p>
                </div>
                <Switch
                  id="email-toggle"
                  checked={isEnabled}
                  onCheckedChange={handleToggle}
                  disabled={isSaving}
                />
              </div>
            </div>

            {isEnabled && (
              <div className="p-4 bg-primary/5 rounded-lg flex items-start gap-3">
                <Icon name="CheckCircle" className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-1">Email уведомления включены</p>
                  <p className="text-sm text-muted-foreground">
                    Вы получаете уведомления о новых откликах на ваши запросы и предложения
                  </p>
                </div>
              </div>
            )}

            <div className="p-4 bg-blue-500/10 text-blue-900 dark:text-blue-100 rounded-lg flex items-start gap-3">
              <Icon name="Info" className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Преимущества Email</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Работает на всех устройствах</li>
                  <li>Сохраняется история уведомлений</li>
                  <li>Не требует установки приложений</li>
                  <li>Удобно для деловой переписки</li>
                </ul>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={checkSettings}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                  Обновление...
                </>
              ) : (
                <>
                  <Icon name="RefreshCw" className="mr-2 h-4 w-4" />
                  Обновить статус
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
