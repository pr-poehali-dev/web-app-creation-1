import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { loadToken, saveTokenDate, type TokenInfo } from './robotApi';

export default function TokenExpiry() {
  const { toast } = useToast();
  const [info, setInfo] = useState<TokenInfo | null>(null);
  const [date, setDate] = useState('');

  const refresh = useCallback(async () => {
    const t = await loadToken();
    setInfo(t);
    if (t.expires) setDate(t.expires);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = async () => {
    if (!date) return;
    const ok = await saveTokenDate(date);
    toast({ title: ok ? 'Дата сохранена' : 'Не удалось сохранить', variant: ok ? undefined : 'destructive' });
    refresh();
  };

  if (!info) return null;
  const left = info.days_left;
  const warn = left !== null && left <= 3;
  const text =
    left === null
      ? 'Дата окончания токена БКС не указана. Укажите её, и за 3 дня робот начнёт напоминать в WhatsApp.'
      : left < 0
        ? 'Срок токена БКС истёк'
        : left === 0
          ? 'Токен БКС истекает сегодня'
          : `Токен БКС действует ещё ${left} дн.`;

  return (
    <div className={`mb-4 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm ${warn ? 'border-red-300 bg-red-50 text-red-900' : 'bg-muted/30'}`}>
      <Icon name={warn ? 'TriangleAlert' : 'KeyRound'} className="h-4 w-4" />
      <span>{text}</span>
      <div className="ml-auto flex items-center gap-2">
        <Input type="date" className="h-8 w-40" value={date} onChange={(e) => setDate(e.target.value)} />
        <Button size="sm" variant="outline" onClick={save}>Сохранить дату</Button>
      </div>
    </div>
  );
}
