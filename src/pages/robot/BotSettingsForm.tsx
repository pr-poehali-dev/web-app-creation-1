import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BotSettings, BotTypeMeta } from './botsApi';

interface Props {
  meta: BotTypeMeta;
  value: BotSettings;
  onChange: (v: BotSettings) => void;
}

export default function BotSettingsForm({ meta, value, onChange }: Props) {
  const set = (k: string, v: number | boolean | string) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-5">
      {meta.groups.map((g) => (
        <div key={g.title} className="space-y-3 rounded-lg border p-3">
          <div>
            <div className="font-semibold">{g.title}</div>
            {g.note && <p className="text-xs text-muted-foreground">{g.note}</p>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(g.fields).map(([key, f]) => (
              <div key={key} className="space-y-1">
                {f.t === 'flag' ? (
                  <div className="flex items-center justify-between gap-3 rounded-md border p-2">
                    <div>
                      <Label>{f.label}</Label>
                      {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
                    </div>
                    <Switch checked={Boolean(value[key])} onCheckedChange={(v) => set(key, v)} />
                  </div>
                ) : f.t === 'select' ? (
                  <>
                    <Label>{f.label}</Label>
                    <Select value={String(value[key])} onValueChange={(v) => set(key, v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {f.options.map(([v, l]) => (
                          <SelectItem key={v} value={v}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
                  </>
                ) : (
                  <>
                    <Label>{f.label}</Label>
                    <Input
                      type="number"
                      step={f.int ? 1 : 'any'}
                      min={f.min}
                      max={f.max}
                      value={String(value[key] ?? '')}
                      onChange={(e) => set(key, e.target.value === '' ? 0 : Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      {f.hint ? `${f.hint}. ` : ''}От {f.min} до {f.max}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
