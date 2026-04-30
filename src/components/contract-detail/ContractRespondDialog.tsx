import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface ContractRespondDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isBarter: boolean;
  respondPrice: string;
  onRespondPriceChange: (value: string) => void;
  respondComment: string;
  onRespondCommentChange: (value: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  contractPricePerUnit?: number;
  contractQuantity?: number;
  formatPrice: (p: number) => string;
  hadCancelledResponse?: boolean;
}

export default function ContractRespondDialog({
  open,
  onOpenChange,
  isBarter,
  respondPrice,
  onRespondPriceChange,
  respondComment,
  onRespondCommentChange,
  isSubmitting,
  onSubmit,
  contractPricePerUnit,
  contractQuantity,
  formatPrice,
  hadCancelledResponse,
}: ContractRespondDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Отклик на контракт</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {hadCancelledResponse && (
            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <Icon name="AlertTriangle" size={16} className="shrink-0 mt-0.5" />
              <span>Вы ранее отменяли отклик на этот контракт. Вы можете подать новый отклик.</span>
            </div>
          )}
          {!isBarter && (
            <div className="space-y-1.5">
              <Label>Ваша цена за единицу, ₽</Label>
              <Input
                type="number"
                min={0}
                value={respondPrice}
                onChange={e => onRespondPriceChange(e.target.value)}
                placeholder={String(contractPricePerUnit || '')}
              />
              {respondPrice && contractQuantity && (
                <p className="text-xs text-muted-foreground">
                  Итого: {formatPrice(parseFloat(respondPrice) * contractQuantity)}
                </p>
              )}
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Комментарий <span className="text-muted-foreground">(необязательно)</span></Label>
            <Textarea
              value={respondComment}
              onChange={e => onRespondCommentChange(e.target.value)}
              placeholder="Опишите условия, сроки, особенности вашего предложения..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Отправка...</>
            ) : (
              <><Icon name="Send" className="mr-2 h-4 w-4" />Отправить отклик</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}