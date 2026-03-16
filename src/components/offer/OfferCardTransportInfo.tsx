import type { TransportWaypoint } from '@/types/offer';

interface OfferCardTransportInfoProps {
  transportRoute?: string;
  transportPrice?: string;
  pricePerUnit: number;
  transportNegotiable?: boolean;
  transportPriceType?: string;
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
  transportPriceType,
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
  // Парсим число из строки вида "8 тонн", "5.5 т" и т.п.
  const capacityFromString = isNaN(capacity) && transportCapacity
    ? parseFloat(transportCapacity.replace(',', '.'))
    : NaN;
  const numericCapacity = !isNaN(capacity) && capacity > 0
    ? capacity
    : (!isNaN(capacityFromString) && capacityFromString > 0 ? capacityFromString : 0);
  const effectiveTotal = quantity > 0 ? quantity : numericCapacity;
  const available = effectiveTotal > 0
    ? effectiveTotal - (soldQuantity || 0) - (reservedQuantity || 0)
    : -1;
  // Единица измерения из строки transportCapacity (напр. "тонн", "т", "мест")
  const unitMatch = transportCapacity ? transportCapacity.match(/[^\d.,\s]+/) : null;
  const unit = unitMatch ? unitMatch[0] : 'мест';

  const activeWaypoints = transportWaypoints?.filter(w => w.isActive && (w.price ?? 0) > 0) || [];

  return (
    <>
      {/* Основной маршрут + цена */}
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-bold text-foreground leading-tight">
          {transportRoute}
        </span>
        <span className="font-bold text-primary text-sm">
          {transportNegotiable
            ? 'Цена: Договор.'
            : (transportPrice || pricePerUnit)
            ? `${Number(transportPrice || pricePerUnit).toLocaleString('ru-RU')} ₽${transportPriceType ? ` · ${transportPriceType.replace('За ', '')}` : ''}`
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
              {available} {unit} из {effectiveTotal}
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