import { useState } from 'react';
import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from 'recharts';
import type { ChartDay, ChartMark } from './botsApi';

const KIND: Record<ChartMark['kind'], { label: string; color: string }> = {
  entry: { label: 'Вход', color: '#2563eb' },
  add: { label: 'Добор', color: '#7c3aed' },
  fix: { label: 'Тейк', color: '#16a34a' },
  move: { label: 'Стоп подтянут', color: '#f59e0b' },
  exit: { label: 'Выход', color: '#dc2626' },
};

function build(day: ChartDay) {
  const marksByTime = new Map<string, ChartMark[]>();
  day.marks.forEach((m) => marksByTime.set(m.t, [...(marksByTime.get(m.t) || []), m]));
  let stop: number | null = null;
  const rows = day.bars.map(([t, , , , close, ema5, ema60, chUp, chLo]) => {
    const ms = marksByTime.get(t) || [];
    ms.forEach((m) => {
      if (m.kind === 'entry' || m.kind === 'add') stop = m.stop ?? stop;
      if (m.kind === 'move') stop = m.price;
    });
    const row: Record<string, number | string | null> = { t, close, stop, ema5, ema60, chUp, chLo };
    if (ms.some((m) => m.kind === 'exit')) stop = null;
    return row;
  });
  const points = day.marks.map((m) => ({ t: m.t, price: m.price, kind: m.kind, text: m.text }));
  return { rows, points };
}

const Dot = (props: { cx?: number; cy?: number; payload?: { kind: ChartMark['kind'] } }) => {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined || !payload) return null;
  const k = KIND[payload.kind];
  if (payload.kind === 'move') return <rect x={cx - 3} y={cy - 3} width={6} height={6} fill={k.color} transform={`rotate(45 ${cx} ${cy})`} />;
  return <circle cx={cx} cy={cy} r={payload.kind === 'entry' || payload.kind === 'add' ? 6 : 5} fill={k.color} stroke="#fff" strokeWidth={1.5} />;
};

export default function TradeChart({ days }: { days: ChartDay[] }) {
  const [idx, setIdx] = useState(days.length - 1);
  const day = days[Math.min(idx, days.length - 1)];
  const { rows, points } = build(day);
  const prices = rows.flatMap((r) => [r.close as number, r.stop as number | null, r.ema5 as number | null, r.ema60 as number | null, r.chUp as number | null, r.chLo as number | null]).concat(points.map((p) => p.price)).filter((v): v is number => v !== null);
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  const pad = (hi - lo) * 0.08 || 1;

  return (
    <div className="space-y-2 rounded-md border p-2">
      <div className="text-sm font-semibold">Как робот двигался по дням</div>
      <div className="flex flex-wrap gap-1">
        {days.map((d, i) => (
          <button
            key={d.date}
            type="button"
            onClick={() => setIdx(i)}
            className={`rounded-md border px-2 py-1 text-xs ${i === idx ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
          >
            {d.date.slice(8, 10)}.{d.date.slice(5, 7)}
          </button>
        ))}
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <ComposedChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="t" tick={{ fontSize: 10 }} minTickGap={24} />
            <YAxis domain={[lo - pad, hi + pad]} tick={{ fontSize: 10 }} width={52} tickFormatter={(v: number) => v.toFixed(0)} />
            <Tooltip
              formatter={(v: number, n: string) => [typeof v === 'number' ? v.toFixed(2) : v, n === 'close' ? 'Цена' : n === 'stop' ? 'Стоп' : n === 'ema5' ? 'EMA-200 (5 мин)' : n === 'ema60' ? 'EMA-200 (час)' : n === 'chUp' ? 'Верх канала' : n === 'chLo' ? 'Низ канала' : n]}
              labelFormatter={(l: string) => `${day.date} ${l}`}
            />
            <Line type="monotone" dataKey="close" stroke="#64748b" dot={false} strokeWidth={1.5} isAnimationActive={false} />
            <Line type="monotone" dataKey="ema5" stroke="#9333ea" dot={false} strokeWidth={1.5} isAnimationActive={false} connectNulls />
            <Line type="stepAfter" dataKey="ema60" stroke="#0891b2" dot={false} strokeWidth={1.5} isAnimationActive={false} connectNulls />
            <Line type="linear" dataKey="chUp" stroke="#0f172a" dot={false} strokeWidth={1.5} isAnimationActive={false} connectNulls={false} />
            <Line type="linear" dataKey="chLo" stroke="#0f172a" dot={false} strokeWidth={1.5} isAnimationActive={false} connectNulls={false} />
            <Line type="stepAfter" dataKey="stop" stroke="#f59e0b" dot={false} strokeWidth={2} strokeDasharray="5 3" connectNulls={false} isAnimationActive={false} />
            <Scatter data={points} dataKey="price" shape={<Dot />} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {(Object.keys(KIND) as ChartMark['kind'][]).map((k) => (
          <span key={k} className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: KIND[k].color }} />
            {KIND[k].label}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4" style={{ background: '#9333ea' }} />
          EMA-200 (5 мин), по ней выбирается сторона
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4" style={{ background: '#0891b2' }} />
          EMA-200 (час)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4" style={{ background: '#0f172a' }} />
          Границы канала, от которых был отскок
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0 w-4 border-t-2 border-dashed" style={{ borderColor: '#f59e0b' }} />
          Линия стопа
        </span>
      </div>
    </div>
  );
}
