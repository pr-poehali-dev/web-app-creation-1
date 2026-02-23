import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { formatDateWithTimezone } from '@/utils/dateUtils';

interface OfferInfoDetailsProps {
  category: string;
  remainingQuantity: number;
  unit: string;
  description: string;
  districtName: string;
  cityName: string;
  availableDistrictNames: string[];
  availableDeliveryTypes: ('pickup' | 'delivery')[];
  streetAddress: string;
  deliveryTime?: string;
  deliveryPeriodStart?: Date | string;
  deliveryPeriodEnd?: Date | string;
  createdAt: Date;
  expiryDate?: Date;
  transportCapacity?: string;
  transportDateTime?: string;
}

export default function OfferInfoDetails({
  category,
  remainingQuantity,
  unit,
  description,
  districtName,
  cityName,
  availableDistrictNames,
  availableDeliveryTypes,
  streetAddress,
  deliveryTime,
  deliveryPeriodStart,
  deliveryPeriodEnd,
  createdAt,
  expiryDate,
  transportCapacity,
  transportDateTime,
}: OfferInfoDetailsProps) {
  const isTransport = category === 'transport';

  return (
    <div className="space-y-3">
      {isTransport ? (
        <div className="space-y-2 text-sm">
          {transportCapacity && (
            <div>
              <p className="text-xs text-muted-foreground">Вместимость / Грузоподъёмность</p>
              <p className="font-medium">{transportCapacity}</p>
            </div>
          )}
          {transportDateTime && (
            <div>
              <p className="text-xs text-muted-foreground">Дата и время</p>
              <p className="font-medium">
                {new Date(transportDateTime).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          )}
        </div>
      ) : category !== 'utilities' && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Осталось</p>
            <p className="font-medium">{remainingQuantity} {unit}</p>
          </div>
        </div>
      )}

      <Separator />

      <div>
        <p className="text-sm font-medium mb-1">Описание</p>
        <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-3">{description}</p>
      </div>

      <Separator />

      <div>
        <p className="text-xs text-muted-foreground mb-0.5">Район</p>
        <p className="text-sm font-medium">{districtName}</p>
        {cityName && (
          <p className="text-xs text-muted-foreground mt-0.5">{cityName}</p>
        )}
      </div>

      {availableDistrictNames.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Доступно в районах</p>
          <div className="flex flex-wrap gap-1">
            {availableDistrictNames.map((name, index) => (
              <Badge key={index} variant="outline" className="text-xs px-1.5 py-0">{name}</Badge>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs text-muted-foreground mb-1">Способы получения</p>
        <div className="flex gap-2">
          {availableDeliveryTypes.includes('pickup') && (
            <Badge className="gap-1 text-xs px-1.5 py-0.5">
              <Icon name="Store" className="h-3 w-3" />
              Самовывоз
            </Badge>
          )}
          {availableDeliveryTypes.includes('delivery') && (
            <Badge className="gap-1 text-xs px-1.5 py-0.5">
              <Icon name="Truck" className="h-3 w-3" />
              Доставка
            </Badge>
          )}
        </div>
      </div>

      {availableDeliveryTypes.includes('pickup') && streetAddress && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Место самовывоза</p>
          <div className="flex items-center gap-1.5">
            <Icon name="MapPin" className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-sm font-medium">{streetAddress}</p>
          </div>
        </div>
      )}

      {deliveryTime && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Срок доставки/поставки</p>
          <p className="text-sm font-medium">{deliveryTime}</p>
        </div>
      )}

      {(deliveryPeriodStart || deliveryPeriodEnd) && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Период поставки</p>
          <p className="text-sm font-medium">
            {deliveryPeriodStart && formatDateWithTimezone(deliveryPeriodStart)}
            {deliveryPeriodStart && deliveryPeriodEnd && ' — '}
            {deliveryPeriodEnd && formatDateWithTimezone(deliveryPeriodEnd)}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>
          <p>Дата создания</p>
          <p className="font-medium text-foreground">
            {formatDateWithTimezone(createdAt)}
          </p>
        </div>
        {expiryDate && (
          <div>
            <p>Срок годности</p>
            <p className="font-medium text-foreground">
              {formatDateWithTimezone(expiryDate)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
