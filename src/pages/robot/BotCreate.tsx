import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { botsSave, type BotMeta } from './botsApi';

const ICONS: Record<string, string> = { intraday: 'Zap', trend: 'TrendingUp', news: 'Newspaper' };

interface Props {
  meta: BotMeta;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function BotCreate({ meta, open, onClose, onCreated }: Props) {
  const { toast } = useToast();
  const [type, setType] = useState('intraday');
  const [asset, setAsset] = useState('BR');
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    const label = meta.assets.find((a) => a[0] === asset)?.[1] || asset;
    try {
      await botsSave({ bot_type: type, name: `${meta.types[type].title.split(' (')[0]} · ${label}`, asset_code: asset, settings: meta.types[type].defaults });
      toast({ title: 'Робот создан', description: 'Он выключен. Настройте его и включите тестовый режим.' });
      onCreated();
      onClose();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Не удалось создать', variant: 'destructive' });
    }
    setBusy(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Новый фьючерсный робот</DialogTitle>
          <DialogDescription>У каждого робота свои настройки, лимиты риска и режим работы.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {Object.entries(meta.types).map(([k, t]) => (
            <button
              key={k}
              type="button"
              onClick={() => setType(k)}
              className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left ${type === k ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
            >
              <Icon name={ICONS[k] || 'Bot'} className="mt-0.5 h-5 w-5" />
              <div>
                <div className="font-semibold">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.desc}</div>
              </div>
            </button>
          ))}
        </div>
        <div className="max-w-xs space-y-1">
          <Label>Актив</Label>
          <Select value={asset} onValueChange={setAsset}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {meta.assets.map(([c, n]) => (
                <SelectItem key={c} value={c}>
                  {n} ({c})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={create} disabled={busy}>
          {busy ? 'Создаю...' : 'Создать робота'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
