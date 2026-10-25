import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { loadRobots, toggleRobot, type RobotItem } from './robotApi';
import RobotSettingsDialog from './RobotSettingsDialog';
import FuturesBots from './FuturesBots';

const pct = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;

export default function MyRobots() {
  const { toast } = useToast();
  const [items, setItems] = useState<RobotItem[] | null>(null);
  const [edit, setEdit] = useState<RobotItem | null>(null);
  const [tab, setTab] = useState<'settings' | 'history'>('settings');
  const open = (r: RobotItem, t: 'settings' | 'history') => {
    setTab(t);
    setEdit(r);
  };

  const refresh = useCallback(async () => setItems(await loadRobots()), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = async (r: RobotItem, enabled: boolean) => {
    setItems((list) => list && list.map((x) => (x.ticker === r.ticker ? { ...x, enabled } : x)));
    await toggleRobot(r.ticker, enabled);
    toast({ title: enabled ? `${r.asset_name}: робот включён` : `${r.asset_name}: робот выключен` });
  };

  if (!items) return <p className="text-sm text-muted-foreground">Загружаю роботов...</p>;

  return (
    <div className="space-y-6">
      <FuturesBots />
    <div className="space-y-3">
      <h2 className="font-semibold">Трендовые роботы по активам</h2>
      <p className="text-sm text-muted-foreground">
        Каждый робот торгует по своим настройкам. Включите или выключите его переключателем, а кнопкой «Настроить» измените индикаторы, стоп и цели.
      </p>
      {items.map((r) => (
        <Card key={r.ticker} className={r.enabled ? '' : 'opacity-70'}>
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Icon name="Bot" className="h-5 w-5" />
              <span className="font-semibold">{r.asset_name}</span>
              <Badge variant="outline">{r.kind === 'future' ? 'Фьючерс' : 'Акции'}</Badge>
              <Badge variant={r.custom ? 'default' : 'secondary'}>{r.custom ? 'Свои настройки' : 'Общие настройки'}</Badge>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{r.enabled ? 'Работает' : 'Выключен'}</span>
                <Switch checked={r.enabled} onCheckedChange={(v) => toggle(r, v)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div>
                <div className="text-xs text-muted-foreground">Открытых сделок</div>
                <div className="font-semibold">{r.open_count}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Закрыто</div>
                <div className="font-semibold">
                  {r.closed}
                  {r.closed ? ` (${Math.round((r.wins / r.closed) * 100)}% в плюс)` : ''}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Итог по сигналам</div>
                <div className={`font-semibold ${r.total_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>{r.closed ? pct(r.total_pct) : '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Стоп / цели (ATR)</div>
                <div className="font-semibold">
                  {r.summary.stop_atr} / {r.summary.t1_atr} / {r.summary.t2_atr}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                Сила тренда не ниже {r.summary.adx_min}, шорты {r.summary.allow_short ? 'разрешены' : 'выключены'}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => open(r, 'history')}>
                  <Icon name="History" className="mr-1 h-4 w-4" />
                  История
                </Button>
                <Button size="sm" variant="outline" onClick={() => open(r, 'settings')}>
                  <Icon name="Settings" className="mr-1 h-4 w-4" />
                  Настроить
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <RobotSettingsDialog robot={edit} tab={tab} onTab={setTab} onClose={() => setEdit(null)} onSaved={refresh} />
    </div>
    </div>
  );
}
