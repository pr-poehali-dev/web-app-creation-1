import Icon from '@/components/ui/icon';
import type { Offer } from '@/types/offer';

interface OfferViewInfoProps {
  offer: Offer;
  districtName: string;
}

export default function OfferViewInfo({ offer, districtName }: OfferViewInfoProps) {
  const isTransport = offer.category === 'transport';

  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      {isTransport ? (
        <>
          <div>
            <span className="text-muted-foreground">Цена за место:</span>
            {offer.transportNegotiable ? (
              <p className="font-semibold">Договорная</p>
            ) : (
              <p className="font-bold text-lg text-primary">
                {Number(offer.transportPrice || offer.pricePerUnit).toLocaleString('ru-RU')} ₽
              </p>
            )}
          </div>
          <div>
            <span className="text-muted-foreground">
              {offer.transportCapacity && isNaN(Number(offer.transportCapacity)) ? 'Вместимость / Грузоподъёмность:' : 'Мест доступно:'}
            </span>
            <p className="font-semibold">
              {offer.transportCapacity && isNaN(Number(offer.transportCapacity))
                ? offer.transportCapacity.trim()
                : offer.quantity - (offer.soldQuantity || 0) - (offer.reservedQuantity || 0)}
            </p>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">Дата выезда:</span>
            {offer.transportDateTime ? (
              <p className="font-semibold">
                {(() => {
                  try {
                    const d = new Date(offer.transportDateTime);
                    return isNaN(d.getTime()) ? offer.transportDateTime : d.toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                  } catch { return offer.transportDateTime; }
                })()}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Не указана</p>
            )}
          </div>
          {offer.transportWaypoints && offer.transportWaypoints.length > 0 && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Остановки по пути:</span>
              <div className="mt-1 space-y-1">
                {offer.transportWaypoints.filter(wp => wp.isActive).map(wp => (
                  <div key={wp.id} className="flex items-center justify-between bg-muted/40 rounded px-2 py-1.5 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Icon name="MapPin" className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="font-medium">{wp.address}</span>
                    </div>
                    {wp.price !== undefined && (
                      <span className="font-semibold text-primary">{Number(wp.price).toLocaleString('ru-RU')} ₽</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
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
        </>
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
  );
}