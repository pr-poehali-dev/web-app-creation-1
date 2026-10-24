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
  { value: 'divergence_rsi', label: 'Дивергенция по RSI', group: 'Индикаторы' },
  { value: 'divergence_macd', label: 'Дивергенция по MACD', group: 'Индикаторы' },
  { value: 'volume_spike', label: 'Всплеск объёма', group: 'Объём' },
  { value: 'obv', label: 'OBV пересёк свою среднюю', group: 'Объём' },
  { value: 'mfi', label: 'MFI (денежный поток)', group: 'Объём' },
  { value: 'vwap', label: 'Цена выше или ниже VWAP', group: 'Объём' },
  { value: 'adx', label: 'ADX (сила тренда)', group: 'Трендовые' },
  { value: 'psar', label: 'Parabolic SAR развернулся', group: 'Трендовые' },
  { value: 'ichimoku', label: 'Ишимоку: Тэнкан и Киджун', group: 'Трендовые' },
  { value: 'stochastic', label: 'Стохастик', group: 'Осцилляторы' },
  { value: 'cci', label: 'CCI', group: 'Осцилляторы' },
  { value: 'williams_r', label: 'Williams %R', group: 'Осцилляторы' },
  { value: 'alligator', label: 'Аллигатор (пасть открыта)', group: 'Билл Вильямс' },
  { value: 'ao', label: 'Awesome Oscillator пересёк ноль', group: 'Билл Вильямс' },
  { value: 'ac', label: 'Accelerator Oscillator пересёк ноль', group: 'Билл Вильямс' },
  { value: 'fractal', label: 'Пробой фрактала', group: 'Билл Вильямс' },
  { value: 'ad', label: 'A/D (накопление/распределение)', group: 'Объём' },
  { value: 'breakout', label: 'Пробой максимума или минимума', group: 'Уровни' },
  { value: 'range_breakout', label: 'Выход из узкого диапазона', group: 'Фигуры' },
  { value: 'double_bottom', label: 'Двойное дно', group: 'Фигуры' },
  { value: 'double_top', label: 'Двойная вершина', group: 'Фигуры' },
  { value: 'head_shoulders', label: 'Голова и плечи (вниз)', group: 'Фигуры' },
  { value: 'inverse_head_shoulders', label: 'Перевёрнутая голова и плечи (вверх)', group: 'Фигуры' },
];

const DEFAULTS: Record<string, Condition> = {
  rsi: { type: 'rsi', op: '<', value: 30 },
  sma_cross: { type: 'sma_cross', fast: 20, slow: 50, dir: 'up' },
  price_vs_sma: { type: 'price_vs_sma', period: 50, op: 'above' },
  macd: { type: 'macd', dir: 'up' },
  divergence_rsi: { type: 'divergence_rsi', dir: 'up' },
  divergence_macd: { type: 'divergence_macd', dir: 'up' },
  bollinger: { type: 'bollinger', op: 'below_lower' },
  volume_spike: { type: 'volume_spike', mult: 2 },
  obv: { type: 'obv', dir: 'up' },
  ad: { type: 'ad', dir: 'up' },
  mfi: { type: 'mfi', op: '<', value: 20 },
  vwap: { type: 'vwap', op: 'above', period: 50 },
  adx: { type: 'adx', dir: 'up', value: 25 },
  psar: { type: 'psar', dir: 'up' },
  ichimoku: { type: 'ichimoku', dir: 'up' },
  stochastic: { type: 'stochastic', op: '<', value: 20 },
  cci: { type: 'cci', op: '<', value: -100 },
  williams_r: { type: 'williams_r', op: '<', value: -80 },
  alligator: { type: 'alligator', dir: 'up' },
  ao: { type: 'ao', dir: 'up' },
  ac: { type: 'ac', dir: 'up' },
  fractal: { type: 'fractal', dir: 'up' },
  breakout: { type: 'breakout', period: 20, dir: 'up' },
  range_breakout: { type: 'range_breakout', period: 20, dir: 'up' },
  double_bottom: { type: 'double_bottom' },
  double_top: { type: 'double_top' },
  head_shoulders: { type: 'head_shoulders' },
  inverse_head_shoulders: { type: 'inverse_head_shoulders' },
};

export const TF_OPTIONS = [
  { value: 5, label: '5 мин' },
  { value: 10, label: '10 мин' },
  { value: 60, label: '1 час' },
];

type ParamDef = { key: string; label: string; def: number; step?: number };

const PARAMS: Record<string, ParamDef[]> = {
  rsi: [{ key: 'period', label: 'Период', def: 14 }],
  macd: [
    { key: 'fast', label: 'Быстрая', def: 12 },
    { key: 'slow', label: 'Медленная', def: 26 },
    { key: 'signal', label: 'Сигнальная', def: 9 },
  ],
  bollinger: [
    { key: 'period', label: 'Период', def: 20 },
    { key: 'mult', label: 'Отклонение', def: 2, step: 0.1 },
  ],
  divergence_rsi: [{ key: 'period', label: 'Период RSI', def: 14 }],
  divergence_macd: [
    { key: 'fast', label: 'Быстрая', def: 12 },
    { key: 'slow', label: 'Медленная', def: 26 },
  ],
  double_bottom: [{ key: 'tol', label: 'Допуск разницы доньев, %', def: 1.2, step: 0.1 }],
  double_top: [{ key: 'tol', label: 'Допуск разницы вершин, %', def: 1.2, step: 0.1 }],
  head_shoulders: [{ key: 'depth', label: 'Мин. высота головы, %', def: 0.4, step: 0.1 }],
  inverse_head_shoulders: [{ key: 'depth', label: 'Мин. глубина головы, %', def: 0.4, step: 0.1 }],
  range_breakout: [{ key: 'max_range', label: 'Макс. размах диапазона, %', def: 5, step: 0.5 }],
  volume_spike: [{ key: 'period', label: 'Период среднего объёма', def: 20 }],
  obv: [{ key: 'period', label: 'Период средней', def: 20 }],
  ad: [{ key: 'period', label: 'Период средней', def: 20 }],
  mfi: [{ key: 'period', label: 'Период', def: 14 }],
  adx: [{ key: 'period', label: 'Период', def: 14 }],
  psar: [
    { key: 'step', label: 'Шаг', def: 0.02, step: 0.005 },
    { key: 'max_af', label: 'Максимум', def: 0.2, step: 0.05 },
  ],
  ichimoku: [
    { key: 'tenkan', label: 'Тэнкан', def: 9 },
    { key: 'kijun', label: 'Киджун', def: 26 },
  ],
  stochastic: [
    { key: 'period', label: 'Период', def: 14 },
    { key: 'smooth', label: 'Сглаживание', def: 3 },
  ],
  cci: [{ key: 'period', label: 'Период', def: 20 }],
  williams_r: [{ key: 'period', label: 'Период', def: 14 }],
  alligator: [
    { key: 'jaw', label: 'Челюсть', def: 13 },
    { key: 'teeth', label: 'Зубы', def: 8 },
    { key: 'lips', label: 'Губы', def: 5 },
  ],
  ao: [
    { key: 'fast', label: 'Быстрая', def: 5 },
    { key: 'slow', label: 'Медленная', def: 34 },
  ],
  ac: [
    { key: 'fast', label: 'Быстрая', def: 5 },
    { key: 'slow', label: 'Медленная', def: 34 },
  ],
  fractal: [{ key: 'side', label: 'Баров с каждой стороны', def: 2 }],
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
        onChange={(e) => onChange({ ...DEFAULTS[e.target.value], ...(cond.tf ? { tf: cond.tf } : {}) })}
      >
        {CONDITION_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.group}: {t.label}</option>
        ))}
      </select>

      {['rsi', 'mfi', 'stochastic', 'cci', 'williams_r'].includes(cond.type) && (
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
      {['macd', 'obv', 'ad', 'psar', 'ichimoku', 'ao', 'ac'].includes(cond.type) && dirSelect('вверх', 'вниз')}
      {cond.type === 'alligator' && dirSelect('вверх', 'вниз')}
      {cond.type === 'fractal' && dirSelect('верхнего (вверх)', 'нижнего (вниз)')}
      {cond.type === 'volume_spike' && (
        <>
          <span className="text-sm">объём больше среднего в</span>
          <Num value={cond.mult} onChange={(v) => set({ mult: v })} />
          <span className="text-sm">раз</span>
        </>
      )}
      {cond.type === 'adx' && (
        <>
          <span className="text-sm">ADX выше</span>
          <Num value={cond.value} onChange={(v) => set({ value: v })} />
          {dirSelect('тренд вверх', 'тренд вниз')}
        </>
      )}
      {cond.type === 'vwap' && (
        <>
          <select className={selectCls} value={cond.op} onChange={(e) => set({ op: e.target.value })}>
            <option value="above">выше</option>
            <option value="below">ниже</option>
          </select>
          <span className="text-sm">VWAP за</span>
          <Num value={cond.period} onChange={(v) => set({ period: v })} />
          <span className="text-sm">свечей</span>
        </>
      )}
      {(cond.type === 'divergence_rsi' || cond.type === 'divergence_macd') &&
        dirSelect('бычья (цена ниже, индикатор выше)', 'медвежья (цена выше, индикатор ниже)')}
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

      {(PARAMS[cond.type] || []).length > 0 && (
        <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 border-t pt-2 text-xs text-muted-foreground">
          <span>Параметры:</span>
          {PARAMS[cond.type].map((p) => (
            <label key={p.key} className="flex items-center gap-1">
              {p.label}
              <Input
                type="number"
                step={p.step ?? 1}
                className="h-8 w-20"
                value={(cond[p.key] as number | undefined) ?? p.def}
                onChange={(e) => set({ [p.key]: Number(e.target.value) })}
              />
            </label>
          ))}
        </div>
      )}

      <select
        className={selectCls}
        value={cond.tf ?? 0}
        title="Таймфрейм условия"
        onChange={(e) => {
          const tf = Number(e.target.value);
          const next = { ...cond };
          if (tf) next.tf = tf;
          else delete next.tf;
          onChange(next);
        }}
      >
        <option value={0}>таймфрейм правила</option>
        {TF_OPTIONS.map((t) => (
          <option key={t.value} value={t.value}>на {t.label}</option>
        ))}
      </select>

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
