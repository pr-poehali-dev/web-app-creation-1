import { useState, useEffect } from 'react';
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
import { getSession } from '@/utils/auth';

interface OfferOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orderData: any) => void;
  remainingQuantity: number;
  minOrderQuantity?: number;
  unit: string;
  availableDeliveryTypes: ('pickup' | 'delivery')[];
  seller?: Seller;
}

export default function OfferOrderModal({
  isOpen,
  onClose,
  onSubmit,
  remainingQuantity,
  minOrderQuantity,
  unit,
  availableDeliveryTypes,
  seller,
}: OfferOrderModalProps) {
  const currentUser = getSession();
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<'pickup' | 'delivery'>(
    availableDeliveryTypes[0] || 'pickup'
  );
  const [quantity, setQuantity] = useState<number>(minOrderQuantity || 1);
  const [address, setAddress] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [quantityError, setQuantityError] = useState<string>('');

  useEffect(() => {
    if (currentUser?.legalAddress && selectedDeliveryType === 'delivery') {
      setAddress(currentUser.legalAddress);
    }
  }, [currentUser, selectedDeliveryType]);

  const handleQuantityChange = (value: number) => {
    setQuantity(value);
    if (minOrderQuantity && value < minOrderQuantity) {
      setQuantityError(`Минимальное количество для заказа: ${minOrderQuantity} ${unit}`);
    } else if (value > remainingQuantity) {
      setQuantityError(`Доступно только ${remainingQuantity} ${unit}`);
    } else {
      setQuantityError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (minOrderQuantity && quantity < minOrderQuantity) {
      return;
    }
    onSubmit({
      quantity,
      deliveryType: selectedDeliveryType,
      address: selectedDeliveryType === 'delivery' ? address : undefined,
      comment,
    });
  };

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="order-quantity">Количество ({unit})</Label>
            <Input
              id="order-quantity"
              name="order-quantity"
              type="number"
              min={minOrderQuantity || 1}
              max={remainingQuantity}
              value={quantity}
              onChange={(e) => handleQuantityChange(Number(e.target.value))}
              required
              className={quantityError ? 'border-red-500' : ''}
            />
            {minOrderQuantity && (
              <p className="text-xs text-muted-foreground mt-1">
                Минимальное количество: {minOrderQuantity} {unit}
              </p>
            )}
            {quantityError && (
              <p className="text-xs text-red-500 mt-1">{quantityError}</p>
            )}
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
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
              {currentUser?.legalAddress && (
                <p className="text-xs text-muted-foreground mt-1">
                  Адрес из профиля. Вы можете изменить его.
                </p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="order-comment">Комментарий</Label>
            <Textarea
              id="order-comment"
              name="order-comment"
              placeholder="Дополнительная информация к заказу"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={!!quantityError}
            >
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