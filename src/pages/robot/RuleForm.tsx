import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import ConditionEditor from './ConditionEditor';
import { saveRule, type RuleDraft } from './robotApi';

const EMPTY: RuleDraft = {
  name: '',
  ticker: '',
  asset_name: '',
  kind: 'share',
  direction: 'ЛОНГ',
  entry_conditions: [{ type: 'rsi', op: '<', value: 30 }],
  exit_conditions: [],
  stop_atr: 1.5,
  target1_atr: 1.5,
  target2_atr: 3,
};

const selectCls = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm';

export default function RuleForm({ onSaved }: { onSaved: () => void }) {
  const { toast } = useToast();
  const [d, setD] = useState<RuleDraft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<RuleDraft>) => setD((p) => ({ ...p, ...patch }));

  const submit = async () => {
    setBusy(true);
    const res = await saveRule({ ...d, ticker: d.ticker.trim().toUpperCase(), asset_name: d.asset_name.trim() || d.ticker.trim().toUpperCase() });
    setBusy(false);
    if (!res.ok) {
      toast({ title: 'Правило не сохранено', description: res.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Правило сохранено' });
    setD(EMPTY);
    onSaved();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Новое правило</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm">Название правила</label>
            <Input value={d.name} placeholder="Например: Отскок ВТБ" onChange={(e) => set({ name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Тип бумаги</label>
            <select
              className={selectCls}
              value={d.kind}
              onChange={(e) => set({ kind: e.target.value, direction: e.target.value === 'share' ? 'ЛОНГ' : d.direction })}
            >
              <option value="share">Акция</option>
              <option value="future">Фьючерс</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">
              {d.kind === 'future' ? 'Код актива (BR, Si, GD)' : 'Тикер (SBER, VTBR)'}
            </label>
            <Input value={d.ticker} onChange={(e) => set({ ticker: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Название для сообщения</label>
            <Input value={d.asset_name} placeholder="Банк ВТБ" onChange={(e) => set({ asset_name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Направление сделки</label>
            <select className={selectCls} value={d.direction} onChange={(e) => set({ direction: e.target.value })}>
              <option value="ЛОНГ">Лонг (покупка)</option>
              {d.kind === 'future' && <option value="ШОРТ">Шорт (продажа)</option>}
            </select>
          </div>
        </div>

        <ConditionEditor
          title="Когда входить"
          hint="Сигнал придёт, когда выполнятся все условия сразу"
          items={d.entry_conditions}
          onChange={(v) => set({ entry_conditions: v })}
        />

        <ConditionEditor
          title="Когда выходить"
          hint="Выход по первому сработавшему условию. Стоп и цели работают всегда"
          items={d.exit_conditions}
          onChange={(v) => set({ exit_conditions: v })}
        />

        <div>
          <div className="mb-1 font-medium">Стоп и цели</div>
          <div className="mb-2 text-xs text-muted-foreground">
            В средних часовых размахах цены. Чем больше число, тем дальше уровень от входа
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs">Стоп</label>
              <Input type="number" step="0.1" value={d.stop_atr} onChange={(e) => set({ stop_atr: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-xs">Цель 1</label>
              <Input type="number" step="0.1" value={d.target1_atr} onChange={(e) => set({ target1_atr: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-xs">Цель 2</label>
              <Input type="number" step="0.1" value={d.target2_atr} onChange={(e) => set({ target2_atr: Number(e.target.value) })} />
            </div>
          </div>
        </div>

        <Button onClick={submit} disabled={busy} className="w-full sm:w-auto">
          {busy ? 'Сохраняю...' : 'Сохранить правило'}
        </Button>
      </CardContent>
    </Card>
  );
}
