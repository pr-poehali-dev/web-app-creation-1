import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import type { Bot } from './botsApi';

const MODES: { id: Bot['mode']; icon: string; action: string; current: string; active: string }[] = [
  { id: 'off', icon: 'Power', action: 'Выключить', current: 'Выключен', active: 'bg-slate-700 text-white disabled:opacity-100' },
  { id: 'paper', icon: 'Play', action: 'Запустить тест', current: 'Тест идёт', active: 'bg-blue-600 text-white disabled:opacity-100' },
  { id: 'live', icon: 'Zap', action: 'Боевой режим', current: 'Боевой идёт', active: 'bg-red-600 text-white disabled:opacity-100' },
];

const STATUS: Record<Bot['mode'], { text: string; cls: string; dot: string }> = {
  off: { text: 'Выключен: сигналов нет', cls: 'bg-slate-200 text-slate-800', dot: 'bg-slate-500' },
  paper: { text: 'Работает в тесте', cls: 'bg-blue-100 text-blue-800', dot: 'bg-blue-600 animate-pulse' },
  live: { text: 'Работает в боевом режиме', cls: 'bg-red-100 text-red-800', dot: 'bg-red-600 animate-pulse' },
};

const pct = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;

interface Props {
  bot: Bot;
  onMode: (b: Bot, mode: Bot['mode']) => Promise<void> | void;
  onOpen: (b: Bot, tab: string) => void;
  onDelete: (b: Bot) => void;
}

export default function BotCard({ bot, onMode, onOpen, onDelete }: Props) {
  const [confirm, setConfirm] = useState(false);
  const [del, setDel] = useState(false);
  const [busy, setBusy] = useState(false);
  const pick = async (m: Bot['mode']) => {
    setBusy(true);
    await onMode(bot, m);
    setBusy(false);
  };
  const st = bot.mode === 'live' ? bot.live : bot.paper;
  const shortPaper = bot.mode === 'live' && bot.paper_days < 30;

  return (
    <Card className={bot.mode === 'off' ? 'opacity-80' : ''}>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Icon name="Bot" className="h-5 w-5" />
          <span className="font-semibold">{bot.name}</span>
          <Badge variant="outline">{bot.type_title}</Badge>
          <Badge variant="secondary">{bot.asset_code}{bot.contract && bot.contract !== bot.asset_code ? ` · ${bot.contract}` : ''}</Badge>
          {bot.days_left !== null && bot.days_left <= 10 && <Badge className="bg-amber-600 text-white">до экспирации {bot.days_left} дн.</Badge>}
          <span className={`ml-auto inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${STATUS[bot.mode].cls}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${STATUS[bot.mode].dot}`} />
            {STATUS[bot.mode].text}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted/50 p-2">
          <span className="text-xs text-muted-foreground">Переключить:</span>
          {MODES.map((m) => {
            const active = bot.mode === m.id;
            return (
              <Button
                key={m.id}
                size="sm"
                type="button"
                disabled={active || busy}
                variant={active ? 'default' : 'outline'}
                className={active ? m.active : ''}
                onClick={() => (m.id === 'live' ? setConfirm(true) : pick(m.id))}
              >
                <Icon name={active ? 'Check' : m.icon} className="mr-1 h-4 w-4" />
                {active ? m.current : m.action}
              </Button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div>
            <div className="text-xs text-muted-foreground">Открытых</div>
            <div className="font-semibold">{st.open_count}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Закрыто</div>
            <div className="font-semibold">{st.closed}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Итог {bot.mode === 'live' ? '(боевой)' : '(тест)'}</div>
            <div className={`font-semibold ${st.total_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>{st.closed ? pct(st.total_pct) : '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Риск на сделку</div>
            <div className="font-semibold">{String(bot.settings.risk_pct)}%</div>
          </div>
        </div>
        {shortPaper && <p className="text-xs text-amber-600">Тестовый период {bot.paper_days} дн. из рекомендованных 30–60. Боевой режим включён раньше срока.</p>}
        {bot.mode === 'paper' && <p className="text-xs text-muted-foreground">Тестовый режим: {bot.paper_days} дн. Сделки учебные, деньги не используются.</p>}
        {bot.last_status && <p className="text-xs text-muted-foreground">Последняя проверка: {bot.last_status}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => onOpen(bot, 'log')}>
            <Icon name="ScrollText" className="mr-1 h-4 w-4" />
            Журнал
          </Button>
          <Button size="sm" variant="outline" onClick={() => onOpen(bot, 'history')}>
            <Icon name="History" className="mr-1 h-4 w-4" />
            История
          </Button>
          <Button size="sm" variant="outline" onClick={() => onOpen(bot, 'settings')}>
            <Icon name="Settings" className="mr-1 h-4 w-4" />
            Настроить
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDel(true)}>
            <Icon name="Trash2" className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Включить боевой режим?</AlertDialogTitle>
            <AlertDialogDescription>
              Рекомендуем сначала 1–2 месяца проработать в тестовом режиме. Сейчас тестовый период: {bot.paper_days} дн. Робот по-прежнему только присылает сигналы и записывает сделки как боевые, заявки на биржу он не отправляет.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => pick('live')}>Включить боевой</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={del} onOpenChange={setDel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить робота «{bot.name}»?</AlertDialogTitle>
            <AlertDialogDescription>Вместе с ним удалятся его сделки и журнал решений.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(bot)}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}