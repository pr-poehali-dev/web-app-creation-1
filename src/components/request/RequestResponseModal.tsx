import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface RequestResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  quantity: number;
  unit: string;
  pricePerUnit: number;
}

export default function RequestResponseModal({
  isOpen,
  onClose,
  onSubmit,
  quantity,
  unit,
  pricePerUnit
}: RequestResponseModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Отправить отклик</DialogTitle>
          <DialogDescription>
            Заполните форму отклика, и автор запроса свяжется с вами
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="response-quantity">Количество ({unit})</Label>
            <Input
              id="response-quantity"
              type="number"
              min="1"
              max={quantity}
              defaultValue={quantity}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="response-price">Ваша цена за единицу (₽)</Label>
            <Input
              id="response-price"
              type="number"
              min="1"
              defaultValue={pricePerUnit}
              required
            />
          </div>

          <div>
            <Label htmlFor="response-delivery">Срок поставки (дней)</Label>
            <Input
              id="response-delivery"
              type="number"
              min="1"
              placeholder="Укажите срок поставки"
              required
            />
          </div>

          <div>
            <Label htmlFor="response-comment">Комментарий</Label>
            <Textarea
              id="response-comment"
              placeholder="Дополнительная информация о вашем предложении"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Отправить отклик
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Отмена
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
