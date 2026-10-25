import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { botsBacktest, type Bot, type BotBacktest as Result } from './botsApi';

const pct = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;

function Cell({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="rounded-md border p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-semibold ${tone === 'good' ? 'text-green-600' : tone === 'bad' ? 'text-red-600' : ''}`}>{value}</div>
    </div>
  );
}

export default function BotBacktest({ bot }: { bot: Bot }) {
  const trend = bot.bot_type === 'trend';
  const [days, setDays] = useState(trend ? '180' : '30');
  const [loading, setLoading] = useState(false);
  const [mine, setMine] = useState<Result | null>(null);
  const [proven, setProven] = useState<Result | null>(null);
  const [err, setErr] = useState('');

  const run = async (cmp: boolean) => {
    setLoading(true);
    setErr('');
    setProven(null);
    try {
      if (cmp) {
        const [a, b] = await Promise.all([botsBacktest(bot.id, days), botsBacktest(bot.id, days, true)]);
        setMine(a);
        setProven(b);
      } else {
        setMine(await botsBacktest(bot.id, days));
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не удалось выполнить тест');
    }
    setLoading(false);
  };

  const s = mine?.summary;
  const p = proven?.summary;
  const periods = trend
    ? [['60', '2 месяца'], ['120', '4 месяца'], ['180', '6 месяцев'], ['330', '11 месяцев']]
    : [['10', '10 дней'], ['20', '20 дней'], ['30', '1 месяц'], ['60', '2 месяца'], ['90', '3 месяца']];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Робот проходит историю шаг за шагом, не зная будущего. Размер позиции считается по лимиту риска, результат учитывает комиссию и проскальзывание.
      </p>
      <div className="max-w-xs space-y-1">
        <Label>Период</Label>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periods.map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => run(false)} disabled={loading}>
          <Icon name="History" className="mr-1 h-4 w-4" />
          {loading ? 'Считаю...' : 'Запустить тест'}
        </Button>
        <Button variant="outline" onClick={() => run(true)} disabled={loading}>
          <Icon name="GitCompare" className="mr-1 h-4 w-4" />
          Сравнить со стандартными
        </Button>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {s && (
        <>
          <div className="text-sm font-semibold">{mine?.title}</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Cell label="Сделок" value={String(s.signals)} />
            <Cell label="Прибыльных" value={s.closed ? `${s.win_rate}%` : '—'} />
            <Cell label="Итог" value={s.closed ? pct(s.total_pct) : '—'} tone={s.total_pct >= 0 ? 'good' : 'bad'} />
            <Cell label="Фактор прибыли" value={s.profit_factor === null ? '—' : s.profit_factor >= 999 ? '∞' : String(s.profit_factor)} />
            <Cell label="Макс. просадка" value={`-${s.max_drawdown_pct}%`} tone="bad" />
          </div>
          {p && (
            <Card>
              <CardContent className="p-3 text-sm">
                Стандартные настройки: {p.signals} сделок, итог {pct(p.total_pct)}, просадка -{p.max_drawdown_pct}%.{' '}
                <b>
                  {Math.abs(s.total_pct - p.total_pct) < 0.005
                    ? 'Ваши настройки совпадают со стандартными.'
                    : s.total_pct > p.total_pct
                      ? `Ваши лучше на ${(s.total_pct - p.total_pct).toFixed(2)}%.`
                      : `Ваши хуже на ${(p.total_pct - s.total_pct).toFixed(2)}%.`}
                </b>
              </CardContent>
            </Card>
          )}
          {mine && mine.trades.length === 0 && <p className="text-sm text-muted-foreground">За этот период условия не сложились ни разу.</p>}
          <div className="space-y-2">
            {[...(mine?.trades || [])].reverse().slice(0, 40).map((t, i) => (
              <div key={i} className="rounded-md border p-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <b className={t.direction === 'ЛОНГ' ? 'text-green-600' : 'text-red-600'}>{t.direction}</b>
                  <span className="text-muted-foreground">{t.date.slice(0, 16)}</span>
                  <span className={`ml-auto font-semibold ${t.result_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {t.closed ? pct(t.result_pct) : 'открыта'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Вход {t.entry} · стоп {t.stop} · {t.reason}
                </div>
              </div>
            ))}
          </div>
          {mine?.log && mine.log.length > 0 && (
            <details className="rounded-md border p-2 text-xs">
              <summary className="cursor-pointer font-semibold">Почему робот входил, выходил и пропускал ({mine.log.length})</summary>
              <div className="mt-2 max-h-72 space-y-1 overflow-y-auto">
                {[...mine.log].reverse().map((l, i) => (
                  <div key={i}>
                    <span className="text-muted-foreground">{l.t.slice(5, 16)}</span> {l.text}
                  </div>
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
