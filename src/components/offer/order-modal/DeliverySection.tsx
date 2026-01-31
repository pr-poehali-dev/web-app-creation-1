import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { DISTRICTS } from '@/data/districts';

interface DeliverySectionProps {
  availableDeliveryTypes: ('pickup' | 'delivery')[];
  selectedDeliveryType: 'pickup' | 'delivery' | '';
  address: string;
  comment: string;
  addressError: string;
  availableDistricts?: string[];
  showCounterPrice: boolean;
  onDeliveryTypeChange: (type: 'pickup' | 'delivery') => void;
  onAddressChange: (value: string) => void;
  onCommentChange: (value: string) => void;
  onAddressBlur: () => void;
  onMapOpen: () => void;
  onAddressErrorClear: () => void;
}

export default function DeliverySection({
  availableDeliveryTypes,
  selectedDeliveryType,
  address,
  comment,
  addressError,
  availableDistricts = [],
  showCounterPrice,
  onDeliveryTypeChange,
  onAddressChange,
  onCommentChange,
  onAddressBlur,
  onMapOpen,
  onAddressErrorClear,
}: DeliverySectionProps) {
  return (
    <>
      {availableDeliveryTypes.length > 1 && (
        <div>
          <Label htmlFor="delivery-type">Способ получения</Label>
          <div className="relative">
            <select
              id="delivery-type"
              name="delivery-type"
              value={selectedDeliveryType}
              onChange={(e) => onDeliveryTypeChange(e.target.value as 'pickup' | 'delivery')}
              required
              className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md appearance-none pr-8"
            >
              <option value="" disabled>Выбери способ получения</option>
              {availableDeliveryTypes.includes('pickup') && (
                <option value="pickup">Самовывоз</option>
              )}
              {availableDeliveryTypes.includes('delivery') && (
                <option value="delivery">Доставка</option>
              )}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Icon name="ChevronDown" className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
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
                onAddressChange(e.target.value);
                onAddressErrorClear();
              }}
              onBlur={onAddressBlur}
              required
              className={`text-xs ${addressError ? 'border-red-500' : ''}`}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onMapOpen}
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
        </div>
      )}

      {!showCounterPrice && (
        <div>
          <Label htmlFor="order-comment">Комментарий</Label>
          <Textarea
            id="order-comment"
            name="order-comment"
            placeholder="Дополнительная информация к заказу"
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            rows={3}
          />
        </div>
      )}
    </>
  );
}
