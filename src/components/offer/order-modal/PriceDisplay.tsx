interface PriceDisplayProps {
  pricePerUnit: number;
  quantity: string;
  unit: string;
  quantityError: string;
  showCounterPrice: boolean;
  priceType?: string;
  isNegotiable?: boolean;
  isTransport?: boolean;
}

export default function PriceDisplay({
  pricePerUnit,
  quantity,
  unit,
  quantityError,
  showCounterPrice,
  priceType,
  isNegotiable,
  isTransport,
}: PriceDisplayProps) {
  if (quantityError || Number(quantity) <= 0 || showCounterPrice) {
    return null;
  }

  if (isTransport && isNegotiable && pricePerUnit === 0) {
    return (
      <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Цена:</span>
          <span className="text-sm font-bold text-primary">Договорная</span>
        </div>
      </div>
    );
  }

  if (pricePerUnit === 0) return null;

  const isPerTrip = priceType === 'За рейс';
  const total = isPerTrip ? pricePerUnit : pricePerUnit * Number(quantity);
  const unitLabel = priceType || unit;

  return (
    <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">Цена {isTransport ? unitLabel : `за ${unit}`}:</span>
        <span className="text-sm font-semibold">{pricePerUnit.toLocaleString('ru-RU')} ₽</span>
      </div>
      {!isPerTrip && (
        <div className="flex items-center justify-between pt-2 border-t border-blue-200 dark:border-blue-800">
          <span className="text-sm font-medium">Итого:</span>
          <span className="text-lg font-bold text-primary">{total.toLocaleString('ru-RU')} ₽</span>
        </div>
      )}
    </div>
  );
}
