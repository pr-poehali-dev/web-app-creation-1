import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { shareContent } from '@/utils/shareUtils';
import type { Offer } from '@/types/offer';

interface EditData {
  pricePerUnit: string;
  quantity: string;
  minOrderQuantity: string;
  description: string;
  deliveryPeriodStart: string;
  deliveryPeriodEnd: string;
}

interface OfferInfoFieldsProps {
  offer: Offer;
  districtName: string;
  isEditing: boolean;
  isSaving: boolean;
  editData: EditData;
  onEditDataChange: (data: EditData) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEditing: () => void;
  onDelete: () => void;
}

export default function OfferInfoFields({
  offer,
  districtName,
  isEditing,
  isSaving,
  editData,
  onEditDataChange,
  onSave,
  onCancel,
  onStartEditing,
  onDelete,
}: OfferInfoFieldsProps) {
  const handleShare = async () => {
    await shareContent({
      title: offer.title,
      text: `📦 ${offer.title}\n\n💰 Цена: ${offer.pricePerUnit?.toLocaleString('ru-RU')} ₽/${offer.unit}${offer.description ? `\n\n📝 ${offer.description}` : ''}`,
      url: `${window.location.origin}/offer/${offer.id}`,
      imageUrl: offer.images?.[0]?.url,

    });
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-2xl font-bold">{offer.title}</h3>
        {!isEditing ? (
          <p className="text-muted-foreground mt-2">{offer.description}</p>
        ) : null}
      </div>

      <Separator />

      <div className="space-y-3">
        {isEditing ? (
          <div className="space-y-4">
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
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Цена за единицу:</span>
              <p className="font-bold text-lg text-primary">
                {offer.pricePerUnit.toLocaleString('ru-RU')} ₽
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Количество:</span>
              <p className="font-semibold">{offer.quantity} {offer.unit}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Доступно:</span>
              <p className="font-semibold text-green-600">
                {offer.quantity - (offer.soldQuantity || 0) - (offer.reservedQuantity || 0)} {offer.unit}
              </p>
            </div>
            {offer.minOrderQuantity && (
              <div>
                <span className="text-muted-foreground">Мин. заказ:</span>
                <p className="font-semibold">{offer.minOrderQuantity} {offer.unit}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Район:</span>
              <p className="font-semibold">{districtName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Просмотры:</span>
              <p className="font-semibold">{offer.views_count || 0}</p>
            </div>
          </div>
        )}
      </div>

      <Separator />

      <div className="flex gap-2">
        {isEditing ? (
          <>
            <Button className="flex-1" onClick={onSave} disabled={isSaving}>
              <Icon name="Check" className="w-4 h-4 mr-2" />
              Сохранить
            </Button>
            <Button variant="outline" onClick={onCancel} disabled={isSaving}>
              <Icon name="X" className="w-4 h-4 mr-2" />
              Отмена
            </Button>
          </>
        ) : (
          <>
            <Button className="flex-1" onClick={onStartEditing}>
              <Icon name="Pencil" className="w-4 h-4 mr-2" />
              Редактировать
            </Button>
            <Button variant="outline" onClick={handleShare} type="button">
              <Icon name="Share2" className="w-4 h-4 mr-2" />
              Поделиться
            </Button>
            <Button
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              type="button"
            >
              <Icon name="Trash2" className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}