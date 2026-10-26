import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { botsSave, type BotMeta } from './botsApi';

const ICONS: Record<string, string> = { ctrend: 'Bitcoin', intraday: 'Zap', trend: 'TrendingUp', news: 'Newspaper', elliott: 'Waves', abc: 'ChartCandlestick', pullback: 'Undo2' };

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
  const [q, setQ] = useState('');
  const isCrypto = meta.types[type]?.market === 'crypto';
  const pool = meta.assets.filter(([c]) => (c.endsWith('USDT') ? isCrypto : !isCrypto));
  const found = pool.filter(([c, n]) => (c + ' ' + n).toLowerCase().includes(q.trim().toLowerCase()));
  const pick = (k: string) => {
    setType(k);
    setQ('');
    setAsset(meta.types[k].market === 'crypto' ? 'BTCUSDT' : 'BR');
  };

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
          <DialogTitle>Новый робот</DialogTitle>
          <DialogDescription>У каждого робота свои настройки, лимиты риска и режим работы.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {Object.entries(meta.types).map(([k, t]) => (
            <button
              key={k}
              type="button"
              onClick={() => pick(k)}
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
        <div className="space-y-2">
          <Label>{isCrypto ? 'Монета (Bybit, бессрочный фьючерс)' : 'Фьючерс'}: выбран {asset} ({pool.length} доступно)</Label>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={isCrypto ? 'Поиск: BTC, ETH, SOL...' : 'Поиск: Brent, Si, RTS, золото...'} />
          <div className="max-h-48 overflow-y-auto rounded-md border">
            {found.length === 0 && <p className="p-2 text-sm text-muted-foreground">Ничего не найдено</p>}
            {found.map(([c, n]) => (
              <button
                key={c}
                type="button"
                onClick={() => setAsset(c)}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-muted ${asset === c ? 'bg-primary/10 font-semibold' : ''}`}
              >
                <span>{n}</span>
                <span className="text-xs text-muted-foreground">{c}</span>
              </button>
            ))}
          </div>
        </div>
        <Button onClick={create} disabled={busy}>
          {busy ? 'Создаю...' : 'Создать робота'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
