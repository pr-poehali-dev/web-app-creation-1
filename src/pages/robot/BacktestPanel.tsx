import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { runBacktest, type BacktestResult, type Rule } from './robotApi';

const pct = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;

function Cell({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  const color = tone === 'good' ? 'text-green-600' : tone === 'bad' ? 'text-red-600' : '';
  return (
    <div className="rounded-lg border bg-muted/30 p-2 text-center">
      <div className={`font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Compare({ mine, proven }: { mine: BacktestResult; proven: BacktestResult }) {
  const a = mine.summary;
  const p = proven.summary;
  if (!a || !p) return <p className="text-sm text-red-600">{mine.error || proven.error || 'Нет данных для сравнения'}</p>;
  const diff = a.total_pct - p.total_pct;
  const same = Math.abs(diff) < 0.005 && a.signals === p.signals;
  const verdict = same
    ? 'Ваши настройки совпадают с проверенными.'
    : diff > 0
      ? `Ваши настройки лучше проверенных на ${diff.toFixed(2)}%.`
      : `Ваши настройки хуже проверенных на ${Math.abs(diff).toFixed(2)}%.`;
  const rows: { label: string; mine: string; proven: string }[] = [
    { label: 'Сигналов', mine: String(a.signals), proven: String(p.signals) },
    { label: 'Прибыльных', mine: `${a.win_rate}%`, proven: `${p.win_rate}%` },
    { label: 'Итог', mine: pct(a.total_pct), proven: pct(p.total_pct) },
    { label: 'Фактор прибыли', mine: a.profit_factor === null ? '—' : String(a.profit_factor), proven: p.profit_factor === null ? '—' : String(p.profit_factor) },
    { label: 'Макс. просадка', mine: `-${a.max_drawdown_pct}%`, proven: `-${p.max_drawdown_pct}%` },
  ];
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className={`font-semibold ${same ? '' : diff > 0 ? 'text-green-600' : 'text-red-600'}`}>{verdict}</div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div />
          <div className="text-center font-semibold">Ваши</div>
          <div className="text-center font-semibold">Проверенные</div>
          {rows.map((r) => (
            <div key={r.label} className="contents">
              <div className="text-muted-foreground">{r.label}</div>
              <div className="text-center">{r.mine}</div>
              <div className="text-center">{r.proven}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function BacktestPanel({ rules }: { rules: Rule[] }) {
  const [target, setTarget] = useState('base:BR:future');
  const [days, setDays] = useState('30');
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<BacktestResult | null>(null);
  const [cmp, setCmp] = useState<{ mine: BacktestResult; proven: BacktestResult } | null>(null);

  const run = async () => {
    setLoading(true);
    const [kind, a, b] = target.split(':');
    const params: Record<string, string> = { days };
    if (kind === 'rule') params.rule_id = a;
    else {
      params.ticker = a;
      params.kind = b;
    }
    try {
      setRes(await runBacktest(params));
    } catch {
      setRes({ error: 'Не удалось выполнить тест' } as BacktestResult);
    }
    setLoading(false);
  };

  const compare = async () => {
    setLoading(true);
    setCmp(null);
    try {
      const base = { days, ticker: 'BR', kind: 'future' };
      const [mine, proven] = await Promise.all([runBacktest(base), runBacktest({ ...base, proven: '1' })]);
      setCmp({ mine, proven });
    } catch {
      setRes({ error: 'Не удалось выполнить сравнение' } as BacktestResult);
    }
    setLoading(false);
  };

  const s = res?.summary;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Робот проходит историю свеча за свечой, как в жизни: на каждый момент он видит только то, что уже было, и не знает будущего.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1 sm:col-span-2">
          <Label>Что проверить</Label>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {rules.map((r) => (
                <SelectItem key={r.id} value={`rule:${r.id}`}>Правило: {r.ticker} · {r.name}</SelectItem>
              ))}
              <SelectItem value="base:BR:future">Трендовый робот: Brent (фьючерс)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Период</Label>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="14">2 недели</SelectItem>
              <SelectItem value="30">1 месяц</SelectItem>
              <SelectItem value="60">2 месяца</SelectItem>
              <SelectItem value="90">3 месяца</SelectItem>
              <SelectItem value="180">6 месяцев</SelectItem>
              <SelectItem value="330">11 месяцев</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={run} disabled={loading}>
          <Icon name="History" className="mr-1 h-4 w-4" />
          {loading ? 'Считаю...' : 'Запустить тест'}
        </Button>
        <Button variant="outline" onClick={compare} disabled={loading}>
          <Icon name="GitCompare" className="mr-1 h-4 w-4" />
          Сравнить с проверенными
        </Button>
      </div>

      {cmp && <Compare mine={cmp.mine} proven={cmp.proven} />}

      {res?.error && <p className="text-sm text-red-600">{res.error}</p>}

      {s && (
        <>
          <div className="text-sm font-semibold">{res.title}</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Cell label="Сигналов" value={String(s.signals)} />
            <Cell label="Прибыльных" value={s.closed ? `${s.win_rate}%` : '—'} />
            <Cell label="Итог" value={s.closed ? pct(s.total_pct) : '—'} tone={s.total_pct >= 0 ? 'good' : 'bad'} />
            <Cell label="Фактор прибыли" value={s.profit_factor === null ? '—' : s.profit_factor >= 999 ? '∞' : String(s.profit_factor)} />
            <Cell label="Макс. просадка" value={`-${s.max_drawdown_pct}%`} tone="bad" />
          </div>
          {res.trades.length === 0 && <p className="text-sm text-muted-foreground">За этот период условия не сложились ни разу.</p>}
          {[...res.trades].reverse().map((t, i) => (
            <Card key={i}>
              <CardContent className="space-y-1 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={t.direction === 'ЛОНГ' ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>{t.direction}</span>
                  <span className="text-xs text-muted-foreground">{t.date.slice(0, 16)}</span>
                  <span className={`ml-auto font-semibold ${t.result_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {t.closed ? pct(t.result_pct) : 'открыта'}
                  </span>
                </div>
                <div>
                  Вход {t.entry} · стоп {t.stop} · цели {t.target1} / {t.target2}
                </div>
                {t.closed && (
                  <div className="text-muted-foreground">
                    Выход {t.exit_price} ({t.exit_date?.slice(0, 16)}): {t.reason}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
