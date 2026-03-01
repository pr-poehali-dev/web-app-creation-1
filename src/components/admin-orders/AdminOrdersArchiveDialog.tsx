import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Order } from '@/types/order';

interface AdminOrdersArchiveDialogProps {
  order: Order | null;
  reason: string;
  isArchiving: boolean;
  onReasonChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AdminOrdersArchiveDialog({
  order,
  reason,
  isArchiving,
  onReasonChange,
  onConfirm,
  onCancel,
}: AdminOrdersArchiveDialogProps) {
  return (
    <Dialog
      open={!!order}
      onOpenChange={(open) => { if (!open) onCancel(); }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Перевести заказ в архив</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Заказ: <span className="font-medium text-foreground">{order?.offerTitle}</span>
          </p>
          <div className="space-y-2">
            <Label htmlFor="archiveReason">Причина архивирования (обязательно)</Label>
            <Textarea
              id="archiveReason"
              placeholder="Укажите причину, по которой заказ переводится в архив..."
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!reason.trim() || isArchiving}
          >
            {isArchiving ? 'Архивирование...' : 'Перевести в архив'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
