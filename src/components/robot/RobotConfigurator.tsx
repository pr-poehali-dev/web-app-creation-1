import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DEFAULT_PARAMS,
  RobotParams,
  Strategy,
  buildRobot,
  safeFileName,
} from '@/lib/robotTemplate';

type NumKey = {
  [K in keyof RobotParams]: RobotParams[K] extends number ? K : never;
}[keyof RobotParams];

const GROUPS: { title: string; fields: { key: NumKey; label: string; hint: string; step: number }[] }[] = [
  {
    title: 'Поиск волн',
    fields: [
      { key: 'pivotBars', label: 'Заметность вершин', hint: 'Больше: меньше сигналов, но надёжнее', step: 1 },
      { key: 'minBRetrace', label: 'Волна B: минимум', hint: 'Глубина отката B от A, 0.382 = 38,2%', step: 0.01 },
      { key: 'maxBRetrace', label: 'Волна B: максимум', hint: '0.886 = 88,6%', step: 0.01 },
    ],
  },
  {
    title: 'Сделка на волне C',
    fields: [
      { key: 'cRatio', label: 'Длина волны C к A', hint: '1.0 = C равна A', step: 0.1 },
      { key: 'tpPercent', label: 'Забрать % волны C', hint: '90 = закрыть, когда C пройдёт 90%, оставив 10%', step: 1 },
      { key: 'maxEntryPos', label: 'Не входить позже', hint: 'Доля волны A, пройденная от точки B', step: 0.05 },
    ],
  },
  {
    title: 'Риск',
    fields: [
      { key: 'riskPercent', label: 'Риск на сделку, %', hint: 'От депозита', step: 0.1 },
      { key: 'fixedLot', label: 'Фиксированный лот', hint: 'Если выбран фиксированный режим', step: 0.01 },
      { key: 'dailyLossPct', label: 'Дневной лимит убытка, %', hint: '0 = без лимита', step: 0.5 },
      { key: 'slAtrBuffer', label: 'Запас стопа (ATR)', hint: 'Доля ATR за вершиной B', step: 0.1 },
      { key: 'minRR', label: 'Мин. прибыль к риску', hint: 'Сделки хуже пропускаются', step: 0.1 },
      { key: 'maxSpreadPts', label: 'Макс. спред, пункты', hint: '0 = без ограничения', step: 1 },
      { key: 'magic', label: 'Номер робота', hint: 'У копий должны быть разные', step: 1 },
    ],
  },
];

const STRATEGIES: { id: Strategy; title: string; text: string }[] = [
  {
    id: 'AFTER_B',
    title: 'Волна C после A и B',
    text: 'После пяти волн и откатов A, B робот сразу открывает сделку на волну C и закрывает, когда пройдено заданное % (по умолчанию 90).',
  },
  {
    id: 'REVERSAL',
    title: 'Разворот от конца C',
    text: 'Ждёт, пока волна C закончится, и входит в обратную сторону. Это прежняя версия робота.',
  },
];

export default function RobotConfigurator() {
  const [p, setP] = useState<RobotParams>(DEFAULT_PARAMS);

  const setNum = (key: NumKey, value: string) => {
    const n = parseFloat(value.replace(',', '.'));
    setP((prev) => ({ ...prev, [key]: Number.isFinite(n) ? n : 0 }));
  };

  const download = () => {
    const name = safeFileName(p.fileName);
    const blob = new Blob(['\uFEFF' + buildRobot({ ...p, fileName: name })], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.mq5`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-5 rounded-lg border bg-card p-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Настройте робота и скачайте</h2>
        <p className="text-sm text-muted-foreground">
          Задайте стратегию и параметры, скачайте файл и замените им старый в папке MQL5/Experts. Другое имя файла создаст отдельного робота рядом со старым.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {STRATEGIES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setP({ ...p, strategy: s.id })}
            className={`rounded-lg border p-3 text-left text-sm transition-colors ${
              p.strategy === s.id ? 'border-primary bg-primary/10' : 'hover:bg-muted'
            }`}
          >
            <div className="font-semibold">{s.title}</div>
            <div className="text-muted-foreground">{s.text}</div>
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Имя файла робота</Label>
          <Input value={p.fileName} onChange={(e) => setP({ ...p, fileName: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Расчёт лота</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={p.lotMode === 'RISK' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setP({ ...p, lotMode: 'RISK' })}
            >
              От риска
            </Button>
            <Button
              type="button"
              variant={p.lotMode === 'FIXED' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setP({ ...p, lotMode: 'FIXED' })}
            >
              Фиксированный
            </Button>
          </div>
        </div>
      </div>

      {GROUPS.map((g) => (
        <div key={g.title} className="space-y-2">
          <h3 className="font-semibold">{g.title}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {g.fields.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label>{f.label}</Label>
                <Input
                  type="number"
                  step={f.step}
                  value={p[f.key]}
                  onChange={(e) => setNum(f.key, e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{f.hint}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={p.allowBuy} onChange={(e) => setP({ ...p, allowBuy: e.target.checked })} />
          Разрешить покупки
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={p.allowSell} onChange={(e) => setP({ ...p, allowSell: e.target.checked })} />
          Разрешить продажи
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="lg" onClick={download}>
          <Icon name="Download" size={18} className="mr-2" />
          Скачать робота с этими настройками
        </Button>
        <Button size="lg" variant="outline" onClick={() => setP(DEFAULT_PARAMS)}>
          Сбросить
        </Button>
      </div>
    </section>
  );
}
