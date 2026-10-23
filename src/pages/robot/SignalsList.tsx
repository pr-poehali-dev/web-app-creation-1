import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Signal, Stats } from './robotApi';

const fmt = (v: string | null) => (v === null ? '' : Number(v).toFixed(2));

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-center">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export default function SignalsList({ items, stats }: { items: Signal[]; stats: Stats | null }) {
  const winRate = stats && stats.closed > 0 ? Math.round((stats.wins / stats.closed) * 100) : 0;

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatBox label="Закрыто сделок" value={String(stats.closed)} />
          <StatBox label="Прибыльных" value={stats.closed ? `${winRate}%` : '—'} />
          <StatBox label="Средний результат" value={stats.closed ? `${Number(stats.avg_pct).toFixed(2)}%` : '—'} />
          <StatBox label="Сумма результатов" value={stats.closed ? `${Number(stats.total_pct).toFixed(2)}%` : '—'} />
        </div>
      )}

      {items.length === 0 && <p className="text-sm text-muted-foreground">Сигналов пока не было. Они появятся, когда сложатся условия на рынке.</p>}

      {items.map((s) => {
        const pct = s.result_pct === null ? null : Number(s.result_pct);
        return (
          <Card key={s.id}>
            <CardContent className="space-y-1 p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{s.asset_name} ({s.ticker})</span>
                <Badge className={s.direction === 'ЛОНГ' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>{s.direction}</Badge>
                <Badge variant="outline">{s.timeframe === '1h' ? '1 час' : s.timeframe?.replace('m', ' мин')}</Badge>
                <Badge variant="outline">{s.status === 'open' ? 'Открыта' : 'Закрыта'}</Badge>
                {pct !== null && (
                  <span className={pct >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>
                    {pct > 0 ? '+' : ''}{pct.toFixed(2)}%
                  </span>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(s.created_at + 'Z').toLocaleString('ru-RU')}
                </span>
              </div>
              <div>
                Вход {fmt(s.entry)} · стоп {fmt(s.stop_loss)} · цели {fmt(s.target1)} / {fmt(s.target2)}
              </div>
              <div className="text-muted-foreground">{s.reason}</div>
              {s.exit_reason && <div>Выход {fmt(s.exit_price)}: {s.exit_reason}</div>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
