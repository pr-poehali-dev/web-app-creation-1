import { useState } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import type { Seller } from '@/types/offer';

interface OfferOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  remainingQuantity: number;
  unit: string;
  availableDeliveryTypes: ('pickup' | 'delivery')[];
  seller?: Seller;
}

export default function OfferOrderModal({
  isOpen,
  onClose,
  onSubmit,
  remainingQuantity,
  unit,
  availableDeliveryTypes,
  seller,
}: OfferOrderModalProps) {
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<'pickup' | 'delivery'>(
    availableDeliveryTypes[0] || 'pickup'
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Оформление заказа</DialogTitle>
          <DialogDescription>
            Заполните форму, и мы свяжемся с вами для подтверждения заказа
          </DialogDescription>
        </DialogHeader>

        {seller && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="User" className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Продавец</h3>
              </div>
              <div>
                <p className="text-sm font-medium">{seller.name}</p>
              </div>
              <Separator />
              <div className="space-y-1">
                <a
                  href={`tel:${seller.phone}`}
                  className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <Icon name="Phone" className="h-3.5 w-3.5" />
                  {seller.phone}
                </a>
                <a
                  href={`mailto:${seller.email}`}
                  className="text-xs hover:text-primary transition-colors flex items-center gap-1.5 text-muted-foreground"
                >
                  <Icon name="Mail" className="h-3.5 w-3.5" />
                  {seller.email}
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="order-quantity">Количество ({unit})</Label>
            <Input
              id="order-quantity"
              name="order-quantity"
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
              name="order-delivery"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={selectedDeliveryType}
              onChange={(e) => setSelectedDeliveryType(e.target.value as 'pickup' | 'delivery')}
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

          {selectedDeliveryType === 'delivery' && (
            <div>
              <Label htmlFor="order-address">Адрес доставки</Label>
              <Input
                id="order-address"
                name="order-address"
                type="text"
                placeholder="Укажите адрес доставки"
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="order-comment">Комментарий</Label>
            <Textarea
              id="order-comment"
              name="order-comment"
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