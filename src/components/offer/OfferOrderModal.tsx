import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
// Updated: removed seller info from order form modal
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

import Icon from '@/components/ui/icon';

import { getSession } from '@/utils/auth';

interface OfferOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orderData: any) => void;
  remainingQuantity: number;
  minOrderQuantity?: number;
  unit: string;
  availableDeliveryTypes: ('pickup' | 'delivery')[];
}

export default function OfferOrderModal({
  isOpen,
  onClose,
  onSubmit,
  remainingQuantity,
  minOrderQuantity,
  unit,
  availableDeliveryTypes,
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

  useEffect(() => {
    if (minOrderQuantity && quantity < minOrderQuantity) {
      setQuantity(minOrderQuantity);
    }
  }, [minOrderQuantity]);

  const handleQuantityChange = (value: number) => {
    const numValue = Number(value);
    
    if (isNaN(numValue) || numValue < 1) {
      return;
    }
    
    // Жёсткая валидация: не позволяем вводить меньше минимума
    const minValue = minOrderQuantity || 1;
    const finalValue = Math.max(minValue, Math.min(numValue, remainingQuantity));
    
    setQuantity(finalValue);
    
    if (finalValue < minValue) {
      setQuantityError(`Минимальное количество для заказа: ${minValue} ${unit}`);
    } else if (finalValue > remainingQuantity) {
      setQuantityError(`Доступно только ${remainingQuantity} ${unit}`);
    } else {
      setQuantityError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (minOrderQuantity && quantity < minOrderQuantity) {
      setQuantityError(`Минимальное количество для заказа: ${minOrderQuantity} ${unit}`);
      return;
    }
    
    if (quantity > remainingQuantity) {
      setQuantityError(`Доступно только ${remainingQuantity} ${unit}`);
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



        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="order-quantity">Количество ({unit})</Label>
            <Input
              id="order-quantity"
              name="order-quantity"
              type="number"
              min={minOrderQuantity || 1}
              max={remainingQuantity}
              step="1"
              value={quantity}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (!isNaN(val) && val >= (minOrderQuantity || 1)) {
                  handleQuantityChange(val);
                }
              }}
              onKeyDown={(e) => {
                // Блокируем ввод минуса и точки
                if (e.key === '-' || e.key === '.' || e.key === ',') {
                  e.preventDefault();
                }
              }}
              onBlur={(e) => {
                const val = Number(e.target.value);
                const minVal = minOrderQuantity || 1;
                if (val < minVal) {
                  setQuantity(minVal);
                  handleQuantityChange(minVal);
                }
              }}
              required
              className={quantityError ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {minOrderQuantity && minOrderQuantity > 1 && (
              <div className="flex items-center gap-1 mt-1">
                <Icon name="Info" size={12} className="text-blue-600" />
                <p className="text-xs text-blue-600 font-medium">
                  Минимум для заказа: {minOrderQuantity} {unit}
                </p>
              </div>
            )}
            {quantityError && (
              <div className="flex items-center gap-1 mt-1">
                <Icon name="XCircle" size={12} className="text-red-500" />
                <p className="text-xs text-red-500 font-medium">{quantityError}</p>
              </div>
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