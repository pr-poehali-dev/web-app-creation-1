import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { loadStrategy, saveStrategy, type StrategySettings } from './robotApi';
import { FLAGS, GROUPS } from './StrategyFields';

type Limits = Record<string, { min: number; max: number }>;

export default function StrategyPanel({ robot = '', onSaved }: { robot?: string; onSaved?: () => void }) {
  const { toast } = useToast();
  const [cfg, setCfg] = useState<StrategySettings | null>(null);
  const [limits, setLimits] = useState<Limits>({});
  const [hours, setHours] = useState('');
  const [saving, setSaving] = useState(false);

  const apply = (s: StrategySettings) => {
    setCfg(s);
    setHours(s.skip_hours.join(', '));
  };

  const load = useCallback(async () => {
    const d = await loadStrategy(robot);
    apply(d.settings);
    setLimits(d.limits);
  }, [robot]);

  useEffect(() => {
    load();
  }, [load]);

  if (!cfg) return <p className="text-sm text-muted-foreground">Загружаю настройки...</p>;

  const setNum = (key: keyof StrategySettings, v: string) => setCfg({ ...cfg, [key]: v === '' ? 0 : Number(v.replace(',', '.')) });
  const setFlag = (key: keyof StrategySettings, v: boolean) => setCfg({ ...cfg, [key]: v });

  const parseHours = () =>
    hours
      .split(/[,; ]+/)
      .filter(Boolean)
      .map(Number)
      .filter((h) => Number.isInteger(h) && h >= 0 && h <= 23);

  const save = async () => {
    setSaving(true);
    const res = await saveStrategy({ ...cfg, skip_hours: parseHours() }, robot);
    setSaving(false);
    if (res) {
      apply(res);
      onSaved?.();
      toast({ title: 'Настройки сохранены', description: 'Новые значения применятся при следующей проверке рынка и в тесте на истории.' });
    } else {
      toast({ title: 'Не удалось сохранить', variant: 'destructive' });
    }
  };

  const reset = async () => {
    setSaving(true);
    const res = await saveStrategy(null, robot);
    setSaving(false);
    if (res) {
      apply(res);
      onSaved?.();
      toast({ title: 'Возвращены проверенные настройки' });
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Здесь можно изменить любой показатель, по которому торгует робот. Изменения влияют на новые сигналы и на тест на истории.
        Проверенные настройки подбирались под Brent: +25% за 11 месяцев при просадке 6%. Любое изменение сначала проверьте во вкладке «Тест на истории».
      </p>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2 font-semibold">
            <Icon name="ToggleRight" className="h-4 w-4" />
            Какие сделки открывать
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {FLAGS.map((f) => (
              <label key={f.key} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <span>
                  <span className="block text-sm font-medium">{f.label}</span>
                  <span className="block text-xs text-muted-foreground">{f.hint}</span>
                </span>
                <Switch checked={Boolean(cfg[f.key])} onCheckedChange={(v) => setFlag(f.key, v)} />
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {GROUPS.map((g) => (
        <Card key={g.title}>
          <CardContent className="space-y-3 p-4">
            <div>
              <div className="flex items-center gap-2 font-semibold">
                <Icon name={g.icon} fallback="Settings" className="h-4 w-4" />
                {g.title}
              </div>
              <p className="text-xs text-muted-foreground">{g.note}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {g.fields.map((f) => {
                const lim = limits[f.key];
                return (
                  <div key={f.key} className="space-y-1">
                    <Label>{f.label}</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step={f.step ?? 1}
                      min={lim?.min}
                      max={lim?.max}
                      value={String(cfg[f.key])}
                      onChange={(e) => setNum(f.key, e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {f.hint}
                      {lim ? ` · допустимо ${lim.min}–${lim.max}` : ''}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center gap-2 font-semibold">
            <Icon name="Clock" className="h-4 w-4" />
            Часы без новых входов (по Москве)
          </div>
          <Input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="например: 12, 13, 14" />
          <p className="text-xs text-muted-foreground">Часы через запятую, от 0 до 23. Пусто — торговать в любое время. По истории хуже всего вход с 12:00 до 15:00.</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button onClick={save} disabled={saving}>
          <Icon name="Save" className="mr-1 h-4 w-4" />
          Сохранить настройки
        </Button>
        <Button variant="outline" onClick={reset} disabled={saving}>
          <Icon name="RotateCcw" className="mr-1 h-4 w-4" />
          Вернуть проверенные
        </Button>
      </div>
    </div>
  );
}
