import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { formatDateWithTimezone } from '@/utils/dateUtils';
import { DISTRICTS } from '@/data/districts';
import type { TransportWaypoint } from '@/types/offer';

interface OfferInfoTransportDetailsProps {
  transportComment?: string;
  transportPriceType?: string;
  transportWaypoints?: TransportWaypoint[];
  availableDistricts?: string[];
  availableDistrictNames: string[];
  createdAt: Date;
  expiryDate?: Date;
}

export default function OfferInfoTransportDetails({
  transportComment,
  transportPriceType,
  transportWaypoints = [],
  availableDistricts = [],
  availableDistrictNames,
  createdAt,
  expiryDate,
}: OfferInfoTransportDetailsProps) {
  const activeWaypoints = transportWaypoints.filter(w => w.isActive && (w.price ?? 0) > 0);
  const getDistrictName = (id: string) => DISTRICTS.find(d => d.id === id)?.name || id;

  return (
    <div className="space-y-2 text-sm">
      {transportComment && (
        <div>
          <p className="text-xs text-muted-foreground">Комментарий</p>
          <p className="font-medium">{transportComment}</p>
        </div>
      )}

      {/* Промежуточные маршруты с ценами */}
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
                    {transportPriceType && transportPriceType !== 'За рейс'
                      ? ` / ${transportPriceType.replace('За ', '').toLowerCase()}`
                      : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Доступные районы — только если нет вейпоинтов с ценами */}
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

      {/* Обслуживаемые районы если есть вейпоинты */}
      {activeWaypoints.length > 0 && availableDistricts.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Обслуживаемые районы</p>
          <div className="flex flex-wrap gap-1">
            {availableDistricts.map(id => (
              <Badge key={id} variant="outline" className="text-xs px-1.5 py-0">{getDistrictName(id)}</Badge>
            ))}
          </div>
        </div>
      )}

      <Separator />
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>
          <p>Дата создания</p>
          <p className="font-medium text-foreground">{formatDateWithTimezone(createdAt)}</p>
        </div>
        {expiryDate && (
          <div>
            <p>Срок публикации до</p>
            <p className="font-medium text-foreground">{formatDateWithTimezone(expiryDate)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
