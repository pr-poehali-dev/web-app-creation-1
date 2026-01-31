import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

interface CounterPriceSectionProps {
  showCounterPrice: boolean;
  pricePerUnit: number;
  counterPrice: string;
  counterComment: string;
  quantity: string;
  onToggle: () => void;
  onCounterPriceChange: (value: string) => void;
  onCounterCommentChange: (value: string) => void;
}

export default function CounterPriceSection({
  showCounterPrice,
  pricePerUnit,
  counterPrice,
  counterComment,
  quantity,
  onToggle,
  onCounterPriceChange,
  onCounterCommentChange,
}: CounterPriceSectionProps) {
  return (
    <div className="border-t pt-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 text-sm font-medium text-primary hover:bg-primary/5 mb-2 border border-primary rounded-md px-3 py-2 transition-colors"
      >
        <Icon name="DollarSign" size={16} />
        {showCounterPrice ? 'Скрыть предложение цены' : 'Предложить свою цену'}
      </button>

      {showCounterPrice && (
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-baseline gap-2 text-sm text-muted-foreground mb-2">
            <span>Цена продавца:</span>
            <span className="font-semibold text-foreground">{pricePerUnit} ₽/{quantity > '0' ? 'кг' : 'кг'}</span>
          </div>
          <div>
            <Label htmlFor="counter-price" className="text-sm">Ваша цена за кг</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="counter-price"
                type="number"
                min="1"
                step="0.01"
                placeholder={`Например: ${(pricePerUnit * 0.9).toFixed(2)}`}
                value={counterPrice}
                onChange={(e) => onCounterPriceChange(e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">₽</span>
            </div>
            {counterPrice && parseFloat(counterPrice) > 0 && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-sm">
                <div className="flex justify-between">
                  <span>Сумма заказа:</span>
                  <span className="font-semibold">
                    {(parseFloat(counterPrice) * Number(quantity)).toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>
            )}
            <div className="mt-2">
              <Label htmlFor="counter-comment" className="text-sm">Комментарий (необязательно)</Label>
              <Textarea
                id="counter-comment"
                placeholder="Опишите причину вашего встречного предложения..."
                value={counterComment}
                onChange={(e) => onCounterCommentChange(e.target.value)}
                rows={2}
                className="text-sm resize-none"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            <Icon name="Info" size={12} className="inline mr-1" />
            Продавец получит уведомление о вашем предложении
          </p>
        </div>
      )}
    </div>
  );
}
