import { useState, useEffect, lazy, Suspense } from 'react';
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
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import { reverseGeocode } from '@/utils/geocoding';
import { DISTRICTS } from '@/data/districts';

const MapModal = lazy(() => import('@/components/auction/MapModal'));

interface OfferOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orderData: any) => void;
  remainingQuantity: number;
  minOrderQuantity?: number;
  unit: string;
  pricePerUnit: number;
  availableDeliveryTypes: ('pickup' | 'delivery')[];
  availableDistricts?: string[];
  offerDistrict?: string;
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
  availableDistricts = [],
  offerDistrict,
}: OfferOrderModalProps) {
  const currentUser = getSession();
  const { toast } = useToast();
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<'pickup' | 'delivery' | ''>('');
  const [quantity, setQuantity] = useState<string>(String(minOrderQuantity || 1));
  const [address, setAddress] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [quantityError, setQuantityError] = useState<string>('');
  const [counterPrice, setCounterPrice] = useState<string>('');
  const [showCounterPrice, setShowCounterPrice] = useState<boolean>(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [addressError, setAddressError] = useState<string>('');

  // Автоматически выбрать способ получения, если доступен только один
  useEffect(() => {
    if (availableDeliveryTypes.length === 1) {
      setSelectedDeliveryType(availableDeliveryTypes[0]);
    }
  }, [availableDeliveryTypes]);

  useEffect(() => {
    if (currentUser?.legalAddress && selectedDeliveryType === 'delivery') {
      setAddress(currentUser.legalAddress);
    }
  }, [currentUser, selectedDeliveryType]);

  useEffect(() => {
    const numQuantity = Number(quantity);
    if (minOrderQuantity && numQuantity < minOrderQuantity) {
      setQuantity(String(minOrderQuantity));
    }
  }, [minOrderQuantity]);

  const handleQuantityChange = (value: string) => {
    const numValue = Number(value);
    
    if (isNaN(numValue) || numValue < 1) {
      return;
    }
    
    setQuantity(value);
    
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
    const newValue = Number(quantity) + 1;
    if (newValue <= remainingQuantity) {
      handleQuantityChange(String(newValue));
    }
  };

  const decrementQuantity = () => {
    const minValue = minOrderQuantity || 1;
    const newValue = Number(quantity) - 1;
    if (newValue >= minValue) {
      handleQuantityChange(String(newValue));
    }
  };

  const handleMapSelect = async (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    
    try {
      const addressData = await reverseGeocode(lat, lng);
      const fullAddress = addressData.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setAddress(fullAddress);
      setAddressError('');
      setIsMapOpen(false);
    } catch (error) {
      console.error('Error getting address:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось получить адрес',
        variant: 'destructive',
      });
    }
  };

  const validateAddress = async (addressText: string) => {
    if (!addressText || selectedDeliveryType !== 'delivery') {
      setAddressError('');
      return true;
    }

    // Простая валидация наличия текста
    if (addressText.trim().length < 5) {
      setAddressError('Укажите полный адрес доставки');
      return false;
    }

    setAddressError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (minOrderQuantity && Number(quantity) < minOrderQuantity) {
      setQuantityError(`Минимальное количество для заказа: ${minOrderQuantity} ${unit}`);
      return;
    }
    
    if (Number(quantity) > remainingQuantity) {
      setQuantityError(`Доступно только ${remainingQuantity} ${unit}`);
      return;
    }

    // Проверяем адрес для доставки
    if (selectedDeliveryType === 'delivery') {
      const isAddressValid = await validateAddress(address);
      if (!isAddressValid || addressError) {
        return;
      }
    }
    
    onSubmit({
      quantity: Number(quantity),
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
                disabled={Number(quantity) <= (minOrderQuantity || 1)}
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
                    setQuantity('');
                    const min = minOrderQuantity || 1;
                    setQuantityError(`Минимальное количество: ${min} ${unit}`);
                    return;
                  }
                  const numVal = Number(val);
                  if (!isNaN(numVal) && numVal >= 0) {
                    handleQuantityChange(val);
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
                disabled={Number(quantity) >= remainingQuantity}
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
          
          {availableDeliveryTypes.length > 1 && (
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
                <option value="" disabled>Выбери способ получения</option>
                {availableDeliveryTypes.includes('pickup') && (
                  <option value="pickup">Самовывоз</option>
                )}
                {availableDeliveryTypes.includes('delivery') && (
                  <option value="delivery">Доставка</option>
                )}
              </select>
            </div>
          )}

          {selectedDeliveryType === 'delivery' && (
            <div>
              <Label htmlFor="order-address">Адрес доставки</Label>
              <div className="flex gap-2">
                <Input
                  id="order-address"
                  name="order-address"
                  type="text"
                  placeholder="Укажите адрес доставки"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setAddressError('');
                  }}
                  onBlur={() => validateAddress(address)}
                  required
                  className={addressError ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsMapOpen(true)}
                  className="flex-shrink-0"
                >
                  <Icon name="MapPin" size={18} />
                </Button>
              </div>
              {addressError && (
                <div className="flex items-center gap-1 mt-1">
                  <Icon name="XCircle" size={12} className="text-red-500" />
                  <p className="text-xs text-red-500 font-medium">{addressError}</p>
                </div>
              )}
              {availableDistricts && availableDistricts.length > 0 && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                  <div className="flex items-start gap-1">
                    <Icon name="Info" size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-600">
                      <p className="font-medium mb-1">Доступна доставка в районы:</p>
                      <p className="text-blue-600/80">
                        {availableDistricts.map(distId => {
                          const district = DISTRICTS.find(d => d.id === distId);
                          return district?.name || distId;
                        }).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {currentUser?.legalAddress && !addressError && !availableDistricts?.length && (
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
            <button
              type="button"
              onClick={() => setShowCounterPrice(!showCounterPrice)}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:bg-primary/5 mb-2 border border-primary rounded-md px-3 py-2 transition-colors"
            >
              <Icon name="DollarSign" size={16} />
              {showCounterPrice ? 'Скрыть предложение цены' : 'Предложить свою цену'}
            </button>
            
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
              disabled={!!quantityError || !!addressError}
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

      <Suspense fallback={null}>
        {isMapOpen && (
          <MapModal
            isOpen={isMapOpen}
            onClose={() => setIsMapOpen(false)}
            onSelectLocation={handleMapSelect}
            initialLocation={selectedLocation || undefined}
          />
        )}
      </Suspense>
    </Dialog>
  );
}