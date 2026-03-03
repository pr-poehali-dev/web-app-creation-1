import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface EmailNotificationSettingsProps {
  userId: string;
  userEmail: string;
}

const API_URL = 'https://functions.poehali.dev/f20975b5-cf6f-4ee6-9127-53f3d552589f';

export default function EmailNotificationSettings({ userId, userEmail }: EmailNotificationSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) checkSettings();
  }, [userId]);

  const checkSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}?id=${userId}`, {
        method: 'GET',
        headers: { 'X-User-Id': userId },
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      // Сервер может вернуть email_notifications = null (не задано) — трактуем как true
      const val = data.user?.email_notifications;
      setIsEnabled(val === null || val === undefined ? true : Boolean(val));
    } catch {
      setIsEnabled(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    setIsSaving(true);
    const prev = isEnabled;
    setIsEnabled(checked);
    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({
          id: Number(userId),
          email_notifications: checked,
        }),
      });

      if (response.ok) {
        toast({
          title: checked ? 'Email уведомления включены' : 'Email уведомления отключены',
          description: checked
            ? `Уведомления будут приходить на ${userEmail}`
            : 'Вы не будете получать email-уведомления',
        });
      } else {
        setIsEnabled(prev);
        toast({ title: 'Ошибка', description: 'Не удалось изменить настройки', variant: 'destructive' });
      }
    } catch {
      setIsEnabled(prev);
      toast({ title: 'Ошибка', description: 'Нет соединения с сервером', variant: 'destructive' });
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
          Уведомления об откликах и заказах на вашу почту
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Icon name="Loader2" className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-toggle" className="text-base">
                  {isEnabled ? 'Email уведомления включены' : 'Включить email уведомления'}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {userEmail}
                </p>
              </div>
              <Switch
                id="email-toggle"
                checked={isEnabled}
                onCheckedChange={handleToggle}
                disabled={isSaving}
              />
            </div>

            {isEnabled && (
              <div className="p-3 bg-primary/5 rounded-lg text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Вы получаете письма о:</p>
                <ul className="space-y-0.5 ml-2">
                  <li>• Новых откликах на ваши запросы и предложения</li>
                  <li>• Встречных предложениях цены</li>
                  <li>• Принятии и отклонении заказов</li>
                  <li>• Новых сообщениях по заказам</li>
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
