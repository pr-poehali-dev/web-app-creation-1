import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { formatDateWithTimezone } from '@/utils/dateUtils';
import { DISTRICTS } from '@/data/districts';
import type { TransportWaypoint } from '@/types/offer';

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
}: OfferInfoDetailsProps) {
  const isTransport = category === 'transport';

  const activeWaypoints = transportWaypoints.filter(w => w.isActive && (w.price ?? 0) > 0);

  const getDistrictName = (id: string) => DISTRICTS.find(d => d.id === id)?.name || id;

  return (
    <div className="space-y-3">
      {isTransport ? (
        <div className="space-y-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Дата и время выезда</p>
            {transportDateTime ? (
              <p className="font-medium">
                {(() => {
                  try {
                    const d = new Date(transportDateTime);
                    return isNaN(d.getTime()) ? transportDateTime : d.toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                  } catch { return transportDateTime; }
                })()}
              </p>
            ) : (
              <p className="font-medium text-muted-foreground">Не указана</p>
            )}
          </div>
          {transportCapacity && (
            <div>
              <p className="text-xs text-muted-foreground">{transportServiceType === 'Пассажирские перевозки' ? 'Количество мест' : 'Вместимость / Грузоподъёмность'}</p>
              <p className="font-medium">{transportCapacity}</p>
            </div>
          )}

          {/* Промежуточные районы с ценами */}
          {activeWaypoints.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Цены по пути</p>
                <div className="space-y-1.5">
                  {activeWaypoints.map(wp => (
                    <div key={wp.id} className="flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <Icon name="MapPin" className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm">{wp.address}</span>
                      </div>
                      <span className="text-sm font-semibold text-primary ml-2 whitespace-nowrap">
                        {wp.price!.toLocaleString('ru-RU')} ₽
                        {transportPriceType && transportPriceType !== 'За рейс' ? ` / ${transportPriceType.replace('За ', '').toLowerCase()}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Дополнительные районы без цен — только если нет вейпоинтов с ценами */}
          {activeWaypoints.length === 0 && availableDistrictNames.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Доступно в районах</p>
                <div className="flex flex-wrap gap-1">
                  {availableDistrictNames.map((name, index) => (
                    <Badge key={index} variant="outline" className="text-xs px-1.5 py-0">{name}</Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Если есть вейпоинты с ценами — показываем районы как их районы */}
          {activeWaypoints.length > 0 && availableDistricts.length > 0 && (
            <>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Обслуживаемые районы</p>
                <div className="flex flex-wrap gap-1">
                  {availableDistricts.map(id => (
                    <Badge key={id} variant="outline" className="text-xs px-1.5 py-0">{getDistrictName(id)}</Badge>
                  ))}
                </div>
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

      {!isTransport && (
        <>
          <Separator />
          <div>
            <p className="text-sm font-medium mb-1">Описание</p>
            <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-3">{description}</p>
          </div>
        </>
      )}

      <Separator />

      <div>
        <p className="text-xs text-muted-foreground mb-0.5">Район</p>
        <p className="text-sm font-medium">{districtName}</p>
        {cityName && (
          <p className="text-xs text-muted-foreground mt-0.5">{cityName}</p>
        )}
      </div>

      {!isTransport && availableDistrictNames.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Доступно в районах</p>
          <div className="flex flex-wrap gap-1">
            {availableDistrictNames.map((name, index) => (
              <Badge key={index} variant="outline" className="text-xs px-1.5 py-0">{name}</Badge>
            ))}
          </div>
        </div>
      )}

      {!isTransport && (
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

      {!isTransport && availableDeliveryTypes.includes('pickup') && streetAddress && (
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
