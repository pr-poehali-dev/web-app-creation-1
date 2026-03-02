import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Offer } from '@/types/offer';

interface EditData {
  pricePerUnit: string;
  quantity: string;
  minOrderQuantity: string;
  description: string;
  deliveryPeriodStart: string;
  deliveryPeriodEnd: string;
  transportPrice: string;
  transportCapacity: string;
  transportDateTime: string;
  transportPriceType: string;
  transportNegotiable: boolean;
  transportWaypoints: import('@/types/offer').TransportWaypoint[];
  transportComment: string;
}

interface OfferEditFormRegularProps {
  offer: Offer;
  editData: EditData;
  isSaving: boolean;
  onEditDataChange: (data: EditData) => void;
}

export default function OfferEditFormRegular({ offer, editData, isSaving, onEditDataChange }: OfferEditFormRegularProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="description">Описание</Label>
        <Textarea
          id="description"
          value={editData.description}
          onChange={(e) => onEditDataChange({ ...editData, description: e.target.value })}
          disabled={isSaving}
          rows={3}
          placeholder="Опишите ваше предложение"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pricePerUnit">Цена за единицу (₽)</Label>
        <Input
          id="pricePerUnit"
          type="number"
          value={editData.pricePerUnit}
          onChange={(e) => onEditDataChange({ ...editData, pricePerUnit: e.target.value })}
          disabled={isSaving}
          min="0"
          step="0.01"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="quantity">Доступное количество ({offer.unit})</Label>
        <Input
          id="quantity"
          type="number"
          value={editData.quantity}
          onChange={(e) => onEditDataChange({ ...editData, quantity: e.target.value })}
          disabled={isSaving}
          min="1"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="minOrderQuantity">Минимальное количество для заказа ({offer.unit})</Label>
        <Input
          id="minOrderQuantity"
          type="number"
          value={editData.minOrderQuantity}
          onChange={(e) => onEditDataChange({ ...editData, minOrderQuantity: e.target.value })}
          disabled={isSaving}
          min="0"
          placeholder="Не задано"
        />
      </div>
      <div className="space-y-2">
        <Label>Период поставки</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="deliveryPeriodStart" className="text-xs text-muted-foreground">Начало</Label>
            <Input
              id="deliveryPeriodStart"
              type="date"
              value={editData.deliveryPeriodStart}
              onChange={(e) => onEditDataChange({ ...editData, deliveryPeriodStart: e.target.value })}
              disabled={isSaving}
              max={editData.deliveryPeriodEnd || undefined}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="deliveryPeriodEnd" className="text-xs text-muted-foreground">Окончание</Label>
            <Input
              id="deliveryPeriodEnd"
              type="date"
              value={editData.deliveryPeriodEnd}
              onChange={(e) => onEditDataChange({ ...editData, deliveryPeriodEnd: e.target.value })}
              disabled={isSaving}
              min={editData.deliveryPeriodStart || undefined}
              max={offer.expiryDate ? new Date(offer.expiryDate).toISOString().split('T')[0] : undefined}
            />
          </div>
        </div>
        {offer.expiryDate && (
          <p className="text-xs text-muted-foreground">
            Срок публикации до: {new Date(offer.expiryDate).toLocaleDateString('ru-RU')}
          </p>
        )}
      </div>
    </>
  );
}
