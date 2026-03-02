import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { shareContent } from '@/utils/shareUtils';
import type { Offer, TransportWaypoint } from '@/types/offer';
import OfferEditFormRegular from './OfferEditFormRegular';
import OfferEditFormTransport from './OfferEditFormTransport';
import OfferViewInfo from './OfferViewInfo';

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
  transportWaypoints: TransportWaypoint[];
  transportComment: string;
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
  const isTransport = offer.category === 'transport';

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
            {!isTransport && (
              <OfferEditFormRegular
                offer={offer}
                editData={editData}
                isSaving={isSaving}
                onEditDataChange={onEditDataChange}
              />
            )}
            {isTransport && (
              <OfferEditFormTransport
                offer={offer}
                editData={editData}
                isSaving={isSaving}
                onEditDataChange={onEditDataChange}
              />
            )}
          </div>
        ) : (
          <OfferViewInfo offer={offer} districtName={districtName} />
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
          <div className="flex flex-col gap-2 w-full">
            <div className="flex gap-2">
              <Button className="flex-1" onClick={onStartEditing}>
                <Icon name="Pencil" className="w-4 h-4 mr-2" />
                Редактировать
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="shrink-0"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
                type="button"
              >
                <Icon name="Trash2" className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={handleShare} type="button">
              <Icon name="Share2" className="w-4 h-4 mr-2" />
              Поделиться
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
