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
  pricePerUnit: number;
  availableDeliveryTypes: ('pickup' | 'delivery')[];
}

export default function OfferOrderModal({
  isOpen,
  onClose,
  onSubmit,
  remainingQuantity,
  minOrderQuantity,
  unit,
  pricePerUnit,
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
  const [counterPrice, setCounterPrice] = useState<string>('');
  const [showCounterPrice, setShowCounterPrice] = useState<boolean>(false);

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
    
    setQuantity(numValue);
    
    const minValue = minOrderQuantity || 1;
    
    if (numValue < minValue) {
      setQuantityError(`Минимальное количество для заказа: ${minValue} ${unit}`);
    } else if (numValue > remainingQuantity) {
      setQuantityError(`Доступно только ${remainingQuantity} ${unit}`);
    } else {
      setQuantityError('');
    }
  };

  const incrementQuantity = () => {
    const newValue = quantity + 1;
    if (newValue <= remainingQuantity) {
      handleQuantityChange(newValue);
    }
  };

  const decrementQuantity = () => {
    const minValue = minOrderQuantity || 1;
    const newValue = quantity - 1;
    if (newValue >= minValue) {
      handleQuantityChange(newValue);
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
      counterPrice: showCounterPrice && counterPrice ? parseFloat(counterPrice) : undefined,
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
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={decrementQuantity}
                disabled={quantity <= (minOrderQuantity || 1)}
                className="flex-shrink-0 h-10 w-10"
              >
                <Icon name="Minus" size={16} />
              </Button>
              
              <Input
                id="order-quantity"
                name="order-quantity"
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min={minOrderQuantity || 1}
                max={remainingQuantity}
                step="1"
                value={quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setQuantity(minOrderQuantity || 1);
                    return;
                  }
                  const numVal = Number(val);
                  if (!isNaN(numVal) && numVal >= 0) {
                    handleQuantityChange(numVal);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === '.' || e.key === ',') {
                    e.preventDefault();
                  }
                }}
                required
                className={`text-center ${quantityError ? 'border-red-500 text-red-600 focus-visible:ring-red-500' : ''}`}
              />
              
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={incrementQuantity}
                disabled={quantity >= remainingQuantity}
                className="flex-shrink-0 h-10 w-10"
              >
                <Icon name="Plus" size={16} />
              </Button>
            </div>
            
            {minOrderQuantity && minOrderQuantity > 1 && !quantityError && (
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

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon name="DollarSign" size={16} className="text-primary" />
                <Label className="text-sm font-medium mb-0">Предложить свою цену</Label>
              </div>
              <button
                type="button"
                onClick={() => setShowCounterPrice(!showCounterPrice)}
                className="text-sm text-primary hover:underline"
              >
                {showCounterPrice ? 'Скрыть' : 'Показать'}
              </button>
            </div>
            
            {showCounterPrice && (
              <div className="space-y-2">
                <div className="bg-muted/50 p-3 rounded-md">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Цена продавца:</span>
                    <span className="font-medium">{pricePerUnit.toLocaleString('ru-RU')} ₽/{unit}</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="counter-price" className="text-sm">Ваша цена за {unit}</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="counter-price"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder={`Например: ${(pricePerUnit * 0.9).toFixed(2)}`}
                      value={counterPrice}
                      onChange={(e) => setCounterPrice(e.target.value)}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground">₽</span>
                  </div>
                  {counterPrice && parseFloat(counterPrice) > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-sm">
                      <div className="flex justify-between">
                        <span>Сумма заказа:</span>
                        <span className="font-semibold">
                          {(parseFloat(counterPrice) * quantity).toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  <Icon name="Info" size={12} className="inline mr-1" />
                  Продавец получит уведомление о вашем предложении
                </p>
              </div>
            )}
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