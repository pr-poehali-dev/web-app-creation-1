import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { formatDateWithTimezone } from '@/utils/dateUtils';
import { DISTRICTS } from '@/data/districts';
import type { TransportWaypoint } from '@/types/offer';
import OfferInfoTransportDetails from './OfferInfoTransportDetails';

interface OfferInfoDetailsProps {
  category: string;
  remainingQuantity: number;
  unit: string;
  description: string;
  districtName: string;
  cityName: string;
  availableDistrictNames: string[];
  availableDistricts?: string[];
  availableDeliveryTypes: ('pickup' | 'delivery')[];
  streetAddress: string;
  deliveryTime?: string;
  deliveryPeriodStart?: Date | string;
  deliveryPeriodEnd?: Date | string;
  createdAt: Date;
  expiryDate?: Date;
  transportCapacity?: string;
  transportDateTime?: string;
  transportServiceType?: string;
  transportWaypoints?: TransportWaypoint[];
  transportPriceType?: string;
  transportComment?: string;
  transportRoute?: string;
  autoMake?: string;
  autoModel?: string;
  autoYear?: string;
  autoBodyType?: string;
  autoColor?: string;
  autoFuelType?: string;
  autoTransmission?: string;
  autoDriveType?: string;
  autoMileage?: number;
  autoPtsRecords?: string;
  autoDescription?: string;
}

export default function OfferInfoDetails({
  category,
  remainingQuantity,
  unit,
  description,
  districtName,
  cityName,
  availableDistrictNames,
  availableDistricts = [],
  availableDeliveryTypes,
  streetAddress,
  deliveryTime,
  deliveryPeriodStart,
  deliveryPeriodEnd,
  createdAt,
  expiryDate,
  transportCapacity,
  transportDateTime,
  transportServiceType,
  transportWaypoints = [],
  transportPriceType,
  transportComment,
  transportRoute,
  autoMake,
  autoModel,
  autoYear,
  autoBodyType,
  autoColor,
  autoFuelType,
  autoTransmission,
  autoDriveType,
  autoMileage,
  autoPtsRecords,
  autoDescription,
}: OfferInfoDetailsProps) {
  const isTransport = category === 'transport';
  const isAutoSale = category === 'auto-sale';

  const activeWaypoints = transportWaypoints.filter(w => w.isActive && (w.price ?? 0) > 0);

  const routeOrigin = transportRoute ? transportRoute.split(/\s*[—–-]\s*/)[0].trim() : '';

  const getDistrictName = (id: string) => DISTRICTS.find(d => d.id === id)?.name || id;

  return (
    <div className="space-y-3">
      {isTransport ? (
        <OfferInfoTransportDetails
          transportComment={transportComment}
          transportPriceType={transportPriceType}
          transportWaypoints={transportWaypoints}
          availableDistricts={availableDistricts}
          availableDistrictNames={availableDistrictNames}
          createdAt={createdAt}
          expiryDate={expiryDate}
        />
      ) : isAutoSale ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {autoMake && <div><p className="text-xs text-muted-foreground">Марка</p><p className="font-medium">{autoMake}</p></div>}
            {autoModel && <div><p className="text-xs text-muted-foreground">Модель</p><p className="font-medium">{autoModel}</p></div>}
            {autoYear && <div><p className="text-xs text-muted-foreground">Год выпуска</p><p className="font-medium">{autoYear}</p></div>}
            {autoBodyType && <div><p className="text-xs text-muted-foreground">Тип кузова</p><p className="font-medium">{autoBodyType}</p></div>}
            {autoColor && <div><p className="text-xs text-muted-foreground">Цвет</p><p className="font-medium">{autoColor}</p></div>}
            {autoFuelType && <div><p className="text-xs text-muted-foreground">Топливо</p><p className="font-medium">{autoFuelType}</p></div>}
            {autoTransmission && <div><p className="text-xs text-muted-foreground">КПП</p><p className="font-medium">{autoTransmission}</p></div>}
            {autoDriveType && <div><p className="text-xs text-muted-foreground">Привод</p><p className="font-medium">{autoDriveType}</p></div>}
            {autoMileage !== undefined && autoMileage !== null && <div><p className="text-xs text-muted-foreground">Пробег</p><p className="font-medium">{autoMileage.toLocaleString('ru-RU')} км</p></div>}
            {autoPtsRecords && <div><p className="text-xs text-muted-foreground">Записей в ПТС</p><p className="font-medium">{autoPtsRecords}</p></div>}
          </div>
          {autoDescription && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-1">Описание</p>
                <p className="text-xs text-muted-foreground whitespace-pre-line">{autoDescription}</p>
              </div>
            </>
          )}
          {districtName && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Местонахождение</p>
                <p className="text-sm font-medium">{districtName}</p>
                {cityName && <p className="text-xs text-muted-foreground mt-0.5">{cityName}</p>}
              </div>
            </>
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

      {!isTransport && !isAutoSale && (
        <>
          <Separator />
          <div>
            <p className="text-sm font-medium mb-1">Описание</p>
            <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-3">{description}</p>
          </div>
        </>
      )}

      {!isAutoSale && (
        <>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Район</p>
            <p className="text-sm font-medium">{districtName}</p>
            {cityName && (
              <p className="text-xs text-muted-foreground mt-0.5">{cityName}</p>
            )}
          </div>
        </>
      )}

      {!isTransport && !isAutoSale && availableDistrictNames.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Доступно в районах</p>
          <div className="flex flex-wrap gap-1">
            {availableDistrictNames.map((name, index) => (
              <Badge key={index} variant="outline" className="text-xs px-1.5 py-0">{name}</Badge>
            ))}
          </div>
        </div>
      )}

      {!isTransport && !isAutoSale && (
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
      )}

      {!isTransport && !isAutoSale && availableDeliveryTypes.includes('pickup') && streetAddress && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Место самовывоза</p>
          <div className="flex items-center gap-1.5">
            <Icon name="MapPin" className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-sm font-medium">{streetAddress}</p>
          </div>
        </div>
      )}

      {!isTransport && deliveryTime && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Срок доставки/поставки</p>
          <p className="text-sm font-medium">{deliveryTime}</p>
        </div>
      )}

      {!isTransport && (deliveryPeriodStart || deliveryPeriodEnd) && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Период поставки</p>
          <p className="text-sm font-medium">
            {deliveryPeriodStart && formatDateWithTimezone(deliveryPeriodStart)}
            {deliveryPeriodStart && deliveryPeriodEnd && ' — '}
            {deliveryPeriodEnd && formatDateWithTimezone(deliveryPeriodEnd)}
          </p>
        </div>
      )}

      {!isTransport && (
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
      )}
    </div>
  );
}