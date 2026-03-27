import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface NegotiationFooterProps {
  isConfirmed: boolean;
  isCancelled: boolean;
  canConfirm: boolean;
  myConfirmed: boolean | undefined;
  onDownload: () => void;
  onOpenConfirmDialog: () => void;
  onOpenCancelDialog: () => void;
}

export function NegotiationFooter({
  isConfirmed,
  isCancelled,
  canConfirm,
  myConfirmed,
  onDownload,
  onOpenConfirmDialog,
  onOpenCancelDialog,
}: NegotiationFooterProps) {
  if (isCancelled) return null;

  return (
    <div className="flex-shrink-0 border-t px-4 py-3 flex flex-wrap gap-2 justify-between items-center">
      <div className="flex gap-2">
        {!isCancelled && !isConfirmed && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/5 gap-1.5"
            onClick={onOpenCancelDialog}
          >
            <Icon name="X" size={14} />
            Отменить
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        {isConfirmed && (
          <Button size="sm" onClick={onDownload} className="gap-1.5">
            <Icon name="Download" size={14} />
            Скачать договор
          </Button>
        )}
        {canConfirm && (
          <Button size="sm" onClick={onOpenConfirmDialog} className="gap-1.5 bg-green-600 hover:bg-green-700">
            <Icon name="CheckCircle" size={14} />
            {myConfirmed ? 'Подтверждено' : 'Принять контракт'}
          </Button>
        )}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  confirmChecked: boolean;
  onCheckedChange: (v: boolean) => void;
  isConfirming: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  confirmChecked,
  onCheckedChange,
  isConfirming,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Подтверждение контракта</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Вы подтверждаете заключение контракта на условиях, обсуждённых в переговорах. После подтверждения обеими сторонами договор будет считаться согласованным и не подлежащим изменению без взаимного согласия.
          </p>
          <div className="flex items-start gap-2">
            <Checkbox
              id="confirm-check"
              checked={confirmChecked}
              onCheckedChange={(v) => onCheckedChange(Boolean(v))}
            />
            <Label htmlFor="confirm-check" className="text-sm leading-snug cursor-pointer">
              Я согласен(а) с условиями контракта и подтверждаю его заключение
            </Label>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => { onOpenChange(false); onCheckedChange(false); }}>
            Отмена
          </Button>
          <Button
            size="sm"
            disabled={!confirmChecked || isConfirming}
            onClick={onConfirm}
            className="bg-green-600 hover:bg-green-700 gap-1.5"
          >
            {isConfirming && <Icon name="Loader2" size={14} className="animate-spin" />}
            Подтвердить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CancelDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isCancelling: boolean;
  onCancel: () => void;
}

export function CancelDialog({ open, onOpenChange, isCancelling, onCancel }: CancelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Отменить отклик?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground py-2">
          Отклик будет отменён. Переговоры завершатся, и вернуть статус будет невозможно.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Назад
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isCancelling}
            onClick={onCancel}
            className="gap-1.5"
          >
            {isCancelling && <Icon name="Loader2" size={14} className="animate-spin" />}
            Отменить отклик
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
