import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { botsLog, botsRun, type Bot, type BotLogItem } from './botsApi';

const KIND: Record<string, string> = {
  entry: 'Вход', exit: 'Выход', skip: 'Пропуск', move: 'Стоп/фиксация', roll: 'Роллирование', info: 'Информация', mode: 'Режим', error: 'Ошибка',
};
const TONE: Record<string, string> = { entry: 'text-green-600', exit: 'text-blue-600', error: 'text-red-600', skip: 'text-amber-600' };

export default function BotLog({ bot, onRan }: { bot: Bot; onRan: () => void }) {
  const [items, setItems] = useState<BotLogItem[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => setItems(await botsLog(bot.id)), [bot.id]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async () => {
    setBusy(true);
    try {
      await botsRun(bot.id);
    } catch {
      /* статус виден в журнале */
    }
    await load();
    onRan();
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Все решения робота: почему вошёл, вышел или пропустил.</p>
        <Button size="sm" variant="outline" onClick={run} disabled={busy || bot.mode === 'off'}>
          <Icon name="Play" className="mr-1 h-4 w-4" />
          {busy ? 'Проверяю...' : 'Проверить сейчас'}
        </Button>
      </div>
      {bot.mode === 'off' && <p className="text-xs text-amber-600">Робот выключен. Включите тестовый режим, чтобы он начал работать.</p>}
      {!items ? (
        <p className="text-sm text-muted-foreground">Загружаю...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Записей пока нет.</p>
      ) : (
        <div className="max-h-96 space-y-1 overflow-y-auto">
          {items.map((l) => (
            <div key={l.id} className="rounded-md border p-2 text-xs">
              <span className={`font-semibold ${TONE[l.kind] || ''}`}>{KIND[l.kind] || l.kind}</span>{' '}
              <span className="text-muted-foreground">{new Date(l.created_at + 'Z').toLocaleString('ru-RU')}</span>
              <div>{l.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
