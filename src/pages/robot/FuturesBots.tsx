import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import BotCard from './BotCard';
import BotCreate from './BotCreate';
import BotDialog from './BotDialog';
import { botsDelete, botsList, botsMeta, botsMode, type Bot, type BotMeta } from './botsApi';

export default function FuturesBots() {
  const { toast } = useToast();
  const [meta, setMeta] = useState<BotMeta | null>(null);
  const [items, setItems] = useState<Bot[] | null>(null);
  const [create, setCreate] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [tab, setTab] = useState('settings');

  const refresh = useCallback(async () => setItems(await botsList()), []);

  useEffect(() => {
    botsMeta().then(setMeta);
    refresh();
  }, [refresh]);

  const mode = async (b: Bot, m: Bot['mode']) => {
    try {
      await botsMode(b.id, m, m === 'live');
      toast({ title: m === 'off' ? `${b.name}: выключен` : m === 'paper' ? `${b.name}: тестовый режим запущен` : `${b.name}: боевой режим запущен` });
      await refresh();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Не удалось сменить режим', variant: 'destructive' });
    }
  };

  const remove = async (b: Bot) => {
    await botsDelete(b.id);
    refresh();
  };

  const current = items?.find((b) => b.id === openId) || null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Фьючерсные роботы</h2>
        <Button size="sm" onClick={() => setCreate(true)} disabled={!meta}>
          <Icon name="Plus" className="mr-1 h-4 w-4" />
          Новый робот
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Три независимых типа роботов. Каждый торгует по своим правилам и лимитам риска. Сначала включите тестовый режим на 1–2 месяца. Заявки на биржу роботы не отправляют, только присылают сигналы.
      </p>
      {!items ? (
        <p className="text-sm text-muted-foreground">Загружаю...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Фьючерсных роботов пока нет.</p>
      ) : (
        items.map((b) => (
          <BotCard
            key={b.id}
            bot={b}
            onMode={mode}
            onDelete={remove}
            onOpen={(x, t) => {
              setTab(t);
              setOpenId(x.id);
            }}
          />
        ))
      )}
      {meta && <BotCreate meta={meta} open={create} onClose={() => setCreate(false)} onCreated={refresh} />}
      {meta && current && <BotDialog bot={current} meta={meta} tab={tab} onTab={setTab} onClose={() => setOpenId(null)} onChanged={refresh} />}
    </div>
  );
}