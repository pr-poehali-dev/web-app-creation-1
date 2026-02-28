import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const PRICE_TYPE_LABELS: Record<string, string> = {
  per_km: 'За км',
  per_ton: 'За тонну',
  per_hour: 'За час',
  per_seat: 'За место',
  negotiable: 'Договорная',
};

interface OfferInfoSummaryProps {
  category: string;
  quantity: number;
  minOrderQuantity?: number;
  unit: string;
  pricePerUnit: number;
  remainingQuantity: number;
  noNegotiation?: boolean;
  deadlineStart?: string;
  deadlineEnd?: string;
  negotiableDeadline?: boolean;
  budget?: number;
  negotiableBudget?: boolean;
  transportServiceType?: string;
  transportRoute?: string;
  transportType?: string;
  transportPriceType?: string;
  transportPrice?: string;
  transportNegotiable?: boolean;
  transportComment?: string;
  transportDateTime?: string;
  expiryDate?: Date;
}

export default function OfferInfoSummary({
  category,
  quantity,
  minOrderQuantity,
  unit,
  pricePerUnit,
  remainingQuantity,
  noNegotiation,
  deadlineStart,
  deadlineEnd,
  negotiableDeadline,
  budget,
  negotiableBudget,
  transportServiceType,
  transportRoute,
  transportType,
  transportPriceType,
  transportPrice,
  transportNegotiable,
  transportComment,
  transportDateTime,
  expiryDate,
}: OfferInfoSummaryProps) {
  const isTransport = category === 'transport';
  const isService = category === 'utilities' || isTransport;

  return (
    <>
      {isTransport ? (
        <div className="grid grid-cols-2 gap-2 text-sm">
          {transportRoute && (
            <div className="col-span-2 rounded-lg bg-primary/10 border border-primary/30 px-3 py-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Основной маршрут</p>
                <p className="font-bold text-foreground">{transportRoute}</p>
              </div>
              <div className="text-right shrink-0">
                {transportNegotiable ? (
                  <Badge variant="secondary" className="text-xs">Договорная</Badge>
                ) : (transportPrice || pricePerUnit) ? (
                  <>
                    <p className="font-bold text-primary text-base leading-tight">
                      {Number(transportPrice || pricePerUnit).toLocaleString('ru-RU')} ₽
                    </p>
                    {transportPriceType && <p className="text-xs text-muted-foreground">{PRICE_TYPE_LABELS[transportPriceType] || transportPriceType}</p>}
                  </>
                ) : null}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Доступно мест:</p>
            <p className="font-semibold">{remainingQuantity > 0 ? `${remainingQuantity} мест` : `${quantity} мест`}</p>
          </div>
          {transportType && (
            <div>
              <p className="text-xs text-muted-foreground">Транспорт:</p>
              <p className="font-semibold">{transportType}</p>
            </div>
          )}
          {transportServiceType && (
            <div>
              <p className="text-xs text-muted-foreground">Тип услуги:</p>
              <p className="font-semibold">{transportServiceType}</p>
            </div>
          )}
          {transportDateTime && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Дата и время выезда:</p>
              <p className="font-semibold">
                {(() => {
                  try {
                    const d = new Date(transportDateTime);
                    return isNaN(d.getTime()) ? transportDateTime : d.toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                  } catch { return transportDateTime; }
                })()}
              </p>
            </div>
          )}

          {expiryDate && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Период публикации до:</p>
              <p className="font-semibold">{new Date(expiryDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          )}
        </div>
      ) : isService ? (
        <div className="space-y-3">
          {deadlineStart && deadlineEnd && (
            <div>
              <p className="text-xs text-muted-foreground">Срок работы:</p>
              <p className="font-semibold text-sm">
                {new Date(deadlineStart).toLocaleDateString('ru-RU')} - {new Date(deadlineEnd).toLocaleDateString('ru-RU')}
              </p>
            </div>
          )}
          {negotiableDeadline && (
            <div>
              <p className="text-xs text-muted-foreground">Срок работы:</p>
              <Badge variant="secondary" className="text-xs">
                Ваши предложения
              </Badge>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Бюджет:</p>
            <div className="flex items-center gap-2">
              {budget ? (
                <p className="font-semibold text-lg">{budget.toLocaleString('ru-RU')} ₽</p>
              ) : negotiableBudget ? (
                <Badge variant="secondary" className="text-xs">
                  Ваши предложения
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground">Не указан</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Доступно сейчас:</p>
            <p className="font-semibold">{remainingQuantity} {unit}</p>
            {remainingQuantity < quantity && (
              <p className="text-xs text-muted-foreground">Всего: {quantity} {unit}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Цена за единицу:</p>
            <div className="flex items-center gap-2">
              <p className="font-semibold">{pricePerUnit.toLocaleString('ru-RU')} ₽</p>
              {noNegotiation && (
                <Badge variant="secondary" className="text-[10px] h-5">
                  Без торга
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {minOrderQuantity && (
        <div className="bg-orange-500/10 border border-orange-500/20 px-2.5 py-1.5 rounded-md">
          <div className="flex items-center gap-1.5">
            <Icon name="Info" className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" />
            <span className="text-xs text-orange-900 dark:text-orange-100">
              Мин. заказ: <span className="font-bold">{minOrderQuantity} {unit}</span>
            </span>
          </div>
        </div>
      )}
    </>
  );
}