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

interface OfferOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  remainingQuantity: number;
  unit: string;
  availableDeliveryTypes: ('pickup' | 'delivery')[];
}

export default function OfferOrderModal({
  isOpen,
  onClose,
  onSubmit,
  remainingQuantity,
  unit,
  availableDeliveryTypes,
}: OfferOrderModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Оформление заказа</DialogTitle>
          <DialogDescription>
            Заполните форму, и мы свяжемся с вами для подтверждения заказа
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="order-quantity">Количество ({unit})</Label>
            <Input
              id="order-quantity"
              type="number"
              min="1"
              max={remainingQuantity}
              defaultValue="1"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="order-delivery">Способ получения</Label>
            <select
              id="order-delivery"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              {availableDeliveryTypes.includes('pickup') && (
                <option value="pickup">Самовывоз</option>
              )}
              {availableDeliveryTypes.includes('delivery') && (
                <option value="delivery">Доставка</option>
              )}
            </select>
          </div>

          <div>
            <Label htmlFor="order-address">Адрес доставки</Label>
            <Input
              id="order-address"
              type="text"
              placeholder="Укажите адрес доставки"
              required
            />
          </div>

          <div>
            <Label htmlFor="order-comment">Комментарий</Label>
            <Textarea
              id="order-comment"
              placeholder="Дополнительная информация к заказу"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Отправить заказ
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
