import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { deleteSignal, updateSignal, type Signal } from './robotApi';

interface Props {
  signal: Signal;
  onClose: () => void;
  onSaved: () => void;
}

export default function SignalEditDialog({ signal, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const [f, setF] = useState({
    entry: String(Number(signal.entry)),
    stop_loss: String(Number(signal.stop_loss)),
    target1: String(Number(signal.target1)),
    target2: String(Number(signal.target2)),
    reason: signal.reason || '',
    close_price: '',
  });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setBusy(true);
    const r = await updateSignal({
      id: signal.id,
      entry: Number(f.entry.replace(',', '.')),
      stop_loss: Number(f.stop_loss.replace(',', '.')),
      target1: Number(f.target1.replace(',', '.')),
      target2: Number(f.target2.replace(',', '.')),
      reason: f.reason,
      close_price: f.close_price ? Number(f.close_price.replace(',', '.')) : null,
    });
    setBusy(false);
    if (!r.ok) {
      toast({ title: r.error || 'Не удалось сохранить', variant: 'destructive' });
      return;
    }
    toast({ title: 'Сигнал обновлён' });
    onSaved();
    onClose();
  };

  const remove = async () => {
    if (!window.confirm('Удалить сигнал?')) return;
    await deleteSignal(signal.id);
    onSaved();
    onClose();
  };

  const num = (k: 'entry' | 'stop_loss' | 'target1' | 'target2', label: string) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input inputMode="decimal" value={f[k]} onChange={(e) => set(k, e.target.value)} />
    </div>
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{signal.asset_name} ({signal.ticker}) · {signal.direction}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {num('entry', 'Вход')}
          {num('stop_loss', 'Стоп')}
          {num('target1', 'Цель 1')}
          {num('target2', 'Цель 2')}
        </div>
        <div className="space-y-1">
          <Label>Основание</Label>
          <Input value={f.reason} onChange={(e) => set('reason', e.target.value)} />
        </div>
        {signal.status === 'open' && (
          <div className="space-y-1">
            <Label>Закрыть вручную по цене (необязательно)</Label>
            <Input inputMode="decimal" value={f.close_price} onChange={(e) => set('close_price', e.target.value)} />
          </div>
        )}
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" className="text-red-600" onClick={remove}>Удалить</Button>
          <Button onClick={save} disabled={busy}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
