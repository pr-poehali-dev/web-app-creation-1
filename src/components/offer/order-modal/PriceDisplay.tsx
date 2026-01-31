interface PriceDisplayProps {
  pricePerUnit: number;
  quantity: string;
  unit: string;
  quantityError: string;
}

export default function PriceDisplay({
  pricePerUnit,
  quantity,
  unit,
  quantityError,
}: PriceDisplayProps) {
  if (quantityError || Number(quantity) <= 0) {
    return null;
  }

  return (
    <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">Цена за {unit}:</span>
        <span className="text-sm font-semibold">{pricePerUnit.toLocaleString('ru-RU')} ₽</span>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-blue-200 dark:border-blue-800">
        <span className="text-sm font-medium">Итого:</span>
        <span className="text-lg font-bold text-primary">{(pricePerUnit * Number(quantity)).toLocaleString('ru-RU')} ₽</span>
      </div>
    </div>
  );
}
