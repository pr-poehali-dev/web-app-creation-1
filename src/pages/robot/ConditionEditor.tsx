import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import type { Condition } from './robotApi';

export const CONDITION_TYPES: { value: string; label: string; group: string }[] = [
  { value: 'rsi', label: 'RSI выше или ниже значения', group: 'Индикаторы' },
  { value: 'sma_cross', label: 'Пересечение двух средних', group: 'Индикаторы' },
  { value: 'price_vs_sma', label: 'Цена выше или ниже средней', group: 'Индикаторы' },
  { value: 'macd', label: 'MACD пересёк сигнальную', group: 'Индикаторы' },
  { value: 'bollinger', label: 'Цена вышла за полосу Боллинджера', group: 'Индикаторы' },
  { value: 'breakout', label: 'Пробой максимума или минимума', group: 'Уровни' },
  { value: 'range_breakout', label: 'Выход из узкого диапазона', group: 'Фигуры' },
  { value: 'double_bottom', label: 'Двойное дно', group: 'Фигуры' },
  { value: 'double_top', label: 'Двойная вершина', group: 'Фигуры' },
];

const DEFAULTS: Record<string, Condition> = {
  rsi: { type: 'rsi', op: '<', value: 30 },
  sma_cross: { type: 'sma_cross', fast: 20, slow: 50, dir: 'up' },
  price_vs_sma: { type: 'price_vs_sma', period: 50, op: 'above' },
  macd: { type: 'macd', dir: 'up' },
  bollinger: { type: 'bollinger', op: 'below_lower' },
  breakout: { type: 'breakout', period: 20, dir: 'up' },
  range_breakout: { type: 'range_breakout', period: 20, dir: 'up' },
  double_bottom: { type: 'double_bottom' },
  double_top: { type: 'double_top' },
};

const selectCls = 'h-9 rounded-md border border-input bg-background px-2 text-sm';

interface RowProps {
  cond: Condition;
  onChange: (c: Condition) => void;
  onRemove: () => void;
}

function Num({ value, onChange, w = 'w-20' }: { value: number | undefined; onChange: (v: number) => void; w?: string }) {
  return <Input type="number" className={`h-9 ${w}`} value={value ?? ''} onChange={(e) => onChange(Number(e.target.value))} />;
}

function ConditionRow({ cond, onChange, onRemove }: RowProps) {
  const set = (patch: Partial<Condition>) => onChange({ ...cond, ...patch });
  const dirSelect = (up: string, down: string) => (
    <select className={selectCls} value={cond.dir} onChange={(e) => set({ dir: e.target.value })}>
      <option value="up">{up}</option>
      <option value="down">{down}</option>
    </select>
  );

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-2">
      <select
        className={selectCls}
        value={cond.type}
        onChange={(e) => onChange(DEFAULTS[e.target.value])}
      >
        {CONDITION_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.group}: {t.label}</option>
        ))}
      </select>

      {cond.type === 'rsi' && (
        <>
          <select className={selectCls} value={cond.op} onChange={(e) => set({ op: e.target.value })}>
            <option value="<">ниже</option>
            <option value=">">выше</option>
          </select>
          <Num value={cond.value} onChange={(v) => set({ value: v })} />
        </>
      )}
      {cond.type === 'sma_cross' && (
        <>
          <span className="text-sm">быстрая</span>
          <Num value={cond.fast} onChange={(v) => set({ fast: v })} />
          <span className="text-sm">медленная</span>
          <Num value={cond.slow} onChange={(v) => set({ slow: v })} />
          {dirSelect('снизу вверх', 'сверху вниз')}
        </>
      )}
      {cond.type === 'price_vs_sma' && (
        <>
          <select className={selectCls} value={cond.op} onChange={(e) => set({ op: e.target.value })}>
            <option value="above">выше</option>
            <option value="below">ниже</option>
          </select>
          <span className="text-sm">средней за</span>
          <Num value={cond.period} onChange={(v) => set({ period: v })} />
          <span className="text-sm">ч</span>
        </>
      )}
      {cond.type === 'macd' && dirSelect('вверх', 'вниз')}
      {cond.type === 'bollinger' && (
        <select className={selectCls} value={cond.op} onChange={(e) => set({ op: e.target.value })}>
          <option value="below_lower">ниже нижней полосы</option>
          <option value="above_upper">выше верхней полосы</option>
        </select>
      )}
      {(cond.type === 'breakout' || cond.type === 'range_breakout') && (
        <>
          {dirSelect('вверх', 'вниз')}
          <span className="text-sm">за</span>
          <Num value={cond.period} onChange={(v) => set({ period: v })} />
          <span className="text-sm">ч</span>
        </>
      )}

      <Button type="button" variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={onRemove}>
        <Icon name="X" className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface EditorProps {
  title: string;
  hint: string;
  items: Condition[];
  onChange: (items: Condition[]) => void;
}

export default function ConditionEditor({ title, hint, items, onChange }: EditorProps) {
  return (
    <div className="space-y-2">
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      {items.map((c, i) => (
        <ConditionRow
          key={i}
          cond={c}
          onChange={(nc) => onChange(items.map((x, j) => (j === i ? nc : x)))}
          onRemove={() => onChange(items.filter((_, j) => j !== i))}
        />
      ))}
      {items.length < 6 && (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, DEFAULTS.rsi])}>
          <Icon name="Plus" className="mr-1 h-4 w-4" />
          Добавить условие
        </Button>
      )}
    </div>
  );
}
