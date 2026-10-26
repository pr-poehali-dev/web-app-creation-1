import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { botsEventDelete, botsEventSave, botsEvents, type BotEvent } from './botsApi';

const IMP = ['', 'Низкая', 'Средняя', 'Высокая'];

export default function NewsCalendar() {
  const { toast } = useToast();
  const [items, setItems] = useState<BotEvent[] | null>(null);
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState('');
  const [imp, setImp] = useState('3');
  const [weekly, setWeekly] = useState(false);

  const load = useCallback(async () => setItems(await botsEvents()), []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    try {
      await botsEventSave({ title, event_time: when, importance: Number(imp), repeat_weekly: weekly });
      setTitle('');
      toast({ title: 'Событие добавлено' });
      load();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Не удалось добавить', variant: 'destructive' });
    }
  };

  const remove = async (id: number) => {
    await botsEventDelete(id);
    load();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Новостной робот торгует вокруг этих событий (время московское): заседание ЦБ, CPI, PMI, запасы нефти. Автоматической загрузки календаря пока нет, события вносятся вручную. Для еженедельных, например запасов нефти по средам, включите повтор.
      </p>
      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label>Название события</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Заседание ЦБ по ключевой ставке" maxLength={200} />
          </div>
          <div className="space-y-1">
            <Label>Дата и время (МСК)</Label>
            <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Важность</Label>
            <Select value={imp} onValueChange={setImp}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {IMP[n]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={weekly} onCheckedChange={setWeekly} />
            <Label>Повторять каждую неделю</Label>
          </div>
          <Button onClick={add} disabled={!title || !when}>
            <Icon name="Plus" className="mr-1 h-4 w-4" />
            Добавить событие
          </Button>
        </CardContent>
      </Card>
      {!items ? (
        <p className="text-sm text-muted-foreground">Загружаю...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Событий пока нет. Без них новостной робот не торгует.</p>
      ) : (
        <div className="space-y-2">
          {items.map((e) => (
            <div key={e.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
              <div className="flex-1">
                <div className="font-medium">{e.title}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(e.event_time).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' })} · важность: {IMP[e.importance]}
                  {e.repeat_weekly ? ` · каждую неделю${e.repeat_until ? ` до ${new Date(e.repeat_until).toLocaleDateString('ru-RU')}` : ''}` : ''}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => remove(e.id)}>
                <Icon name="Trash2" className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
