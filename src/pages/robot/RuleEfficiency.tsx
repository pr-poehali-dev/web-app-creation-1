import { Card, CardContent } from '@/components/ui/card';
import type { RuleStats } from './robotApi';

const pct = (v: string | number) => `${Number(v) > 0 ? '+' : ''}${Number(v).toFixed(2)}%`;

function Cell({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  const color = tone === 'good' ? 'text-green-600' : tone === 'bad' ? 'text-red-600' : '';
  return (
    <div className="rounded-lg border bg-muted/30 p-2 text-center">
      <div className={`font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export default function RuleEfficiency({ items }: { items: RuleStats[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Статистика появится, когда по правилам пройдут первые сигналы.</p>;
  }
  return (
    <div className="space-y-3">
      {items.map((r) => {
        const total = Number(r.total_pct);
        const winRate = r.closed ? Math.round((r.wins / r.closed) * 100) : 0;
        const loss = Number(r.gross_loss);
        const factor = loss > 0 ? (Number(r.gross_win) / loss).toFixed(2) : r.closed ? '∞' : '—';
        return (
          <Card key={r.rule_id ?? 'base'}>
            <CardContent className="space-y-3 p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{r.name}</span>
                <span className="text-xs text-muted-foreground">
                  закрыто {r.closed}, открыто {r.open_count}
                </span>
                {r.closed > 0 && (
                  <span className={`ml-auto font-semibold ${total >= 0 ? 'text-green-600' : 'text-red-600'}`}>{pct(total)}</span>
                )}
              </div>
              {r.closed > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <Cell label="Прибыльных" value={`${winRate}%`} />
                  <Cell label="Средний результат" value={pct(r.avg_pct)} tone={Number(r.avg_pct) >= 0 ? 'good' : 'bad'} />
                  <Cell label="Средняя прибыль" value={pct(r.avg_win)} tone="good" />
                  <Cell label="Средний убыток" value={pct(r.avg_loss)} tone="bad" />
                  <Cell label="Профит-фактор" value={factor} />
                </div>
              ) : (
                <p className="text-muted-foreground">Закрытых сделок пока нет.</p>
              )}
              {r.closed > 0 && r.closed < 10 && (
                <p className="text-xs text-muted-foreground">Сделок мало, выводы делать рано. Надёжнее смотреть от 20–30 сделок.</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
