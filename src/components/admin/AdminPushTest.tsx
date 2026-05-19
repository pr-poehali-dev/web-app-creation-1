import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { getSession } from '@/utils/auth';
import funcUrl from '../../../backend/func2url.json';

export default function AdminPushTest() {
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('Тестовое уведомление');
  const [message, setMessage] = useState('Проверка push-уведомлений работает!');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  const sendToSelf = async () => {
    const session = getSession();
    if (!session?.id) {
      toast.error('Не удалось определить текущего пользователя');
      return;
    }
    await sendPush(String(session.id));
  };

  const sendToUser = async () => {
    if (!userId.trim()) {
      toast.error('Введите ID пользователя');
      return;
    }
    await sendPush(userId.trim());
  };

  const sendToAll = async () => {
    await sendPush(undefined, true);
  };

  const sendPush = async (targetUserId?: string, broadcast?: boolean) => {
    setSending(true);
    setResult(null);
    try {
      const body: Record<string, unknown> = {
        title,
        message,
        url: '/',
        type: 'test',
      };
      if (broadcast) {
        body.district = 'all';
      } else {
        body.userId = targetUserId;
      }

      const response = await fetch(funcUrl['push-send'], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({ sent: data.sent, failed: data.failed, total: data.total });
        if (data.sent > 0) {
          toast.success(`Push отправлен: ${data.sent} из ${data.total} устройств`);
        } else if (data.total === 0) {
          toast.warning('Нет активных подписок — пользователь не разрешил уведомления');
        } else {
          toast.error(`Не удалось доставить: ${data.failed} ошибок`);
        }
      } else {
        toast.error(data.error || 'Ошибка отправки');
      }
    } catch (_e) {
      toast.error('Ошибка соединения с сервером');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="BellRing" size={22} className="text-primary" />
          Тест push-уведомлений
        </CardTitle>
        <CardDescription>
          Отправьте тестовое push-уведомление себе или конкретному пользователю, чтобы убедиться что система работает
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label>Заголовок уведомления</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Заголовок..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Текст уведомления</Label>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Текст..."
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={sendToSelf} disabled={sending} className="flex-1 min-w-[140px]">
            {sending ? (
              <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
            ) : (
              <Icon name="Send" size={16} className="mr-2" />
            )}
            Отправить себе
          </Button>
          <Button onClick={sendToAll} disabled={sending} variant="outline" className="flex-1 min-w-[140px]">
            <Icon name="Users" size={16} className="mr-2" />
            Всем пользователям
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="ID конкретного пользователя"
            className="flex-1"
          />
          <Button onClick={sendToUser} disabled={sending || !userId.trim()} variant="outline">
            <Icon name="ArrowRight" size={16} />
          </Button>
        </div>

        {result && (
          <div className={`rounded-lg border p-3 text-sm ${result.sent > 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-center gap-2 font-medium">
              <Icon
                name={result.sent > 0 ? 'CheckCircle' : 'AlertCircle'}
                size={16}
                className={result.sent > 0 ? 'text-green-600' : 'text-yellow-600'}
              />
              Результат отправки
            </div>
            <p className="mt-1 text-muted-foreground">
              Доставлено: <span className="font-semibold text-foreground">{result.sent}</span> из {result.total} устройств
              {result.failed > 0 && `, ошибок: ${result.failed}`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
