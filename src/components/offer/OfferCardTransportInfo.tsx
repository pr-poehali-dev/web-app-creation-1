import type { TransportWaypoint } from '@/types/offer';

interface OfferCardTransportInfoProps {
  transportRoute?: string;
  transportPrice?: string;
  pricePerUnit: number;
  transportNegotiable?: boolean;
  transportDepartureDateTime?: string;
  transportDateTime?: string;
  transportCapacity?: string;
  quantity: number;
  soldQuantity?: number;
  reservedQuantity?: number;
  transportWaypoints?: TransportWaypoint[];
}

export default function OfferCardTransportInfo({
  transportRoute,
  transportPrice,
  pricePerUnit,
  transportNegotiable,
  transportDepartureDateTime,
  transportDateTime,
  transportCapacity,
  quantity,
  soldQuantity,
  reservedQuantity,
  transportWaypoints,
}: OfferCardTransportInfoProps) {
  const rawDate = transportDepartureDateTime || transportDateTime;

  const capacity = Number(transportCapacity);
  const effectiveTotal = quantity > 0 ? quantity : (!isNaN(capacity) && capacity > 0 ? capacity : 0);
  const available = effectiveTotal > 0
    ? effectiveTotal - (soldQuantity || 0) - (reservedQuantity || 0)
    : -1;

  const activeWaypoints = transportWaypoints?.filter(w => w.isActive && (w.price ?? 0) > 0) || [];

  return (
    <>
      {/* Основной маршрут + цена */}
      <div className="flex items-start justify-between gap-1">
        <span className="text-sm font-bold text-foreground leading-tight min-w-0 truncate">
          {transportRoute}
        </span>
        <span className="font-bold text-primary text-sm whitespace-nowrap flex-shrink-0">
          {transportNegotiable
            ? 'Договор.'
            : (transportPrice || pricePerUnit)
            ? `${Number(transportPrice || pricePerUnit).toLocaleString('ru-RU')} ₽`
            : ''}
        </span>
      </div>

      {/* Дата + кол-во мест */}
      <div className="flex items-center justify-between gap-1">
        {rawDate && (
          <span className="text-xs text-muted-foreground">
            {(() => {
              try {
                const d = new Date(rawDate);
                return isNaN(d.getTime())
                  ? rawDate
                  : d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
              } catch { return rawDate; }
            })()}
          </span>
        )}
        {effectiveTotal > 0 && (
          available > 0 ? (
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded whitespace-nowrap">
              {available} мест
            </span>
          ) : (
            <span className="text-xs font-semibold text-red-500 whitespace-nowrap">Мест нет</span>
          )
        )}
      </div>

      {/* Промежуточные маршруты по пути */}
      {activeWaypoints.length > 0 && (
        <div className="space-y-0.5">
          {activeWaypoints.map(wp => (
            <div key={wp.id} className="flex items-center justify-between rounded bg-muted/50 px-1.5 py-0.5">
              <span className="text-xs text-muted-foreground truncate min-w-0">
                {wp.address}
              </span>
              <span className="text-xs font-semibold text-primary whitespace-nowrap ml-1">
                {wp.price!.toLocaleString('ru-RU')} ₽
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
