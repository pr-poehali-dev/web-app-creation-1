import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface QuantitySelectorProps {
  quantity: string;
  unit: string;
  minOrderQuantity?: number;
  remainingQuantity: number;
  quantityError: string;
  onQuantityChange: (value: string) => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onErrorClear: () => void;
}

export default function QuantitySelector({
  quantity,
  unit,
  minOrderQuantity,
  remainingQuantity,
  quantityError,
  onQuantityChange,
  onIncrement,
  onDecrement,
  onErrorClear,
}: QuantitySelectorProps) {
  return (
    <div>
      <Label htmlFor="order-quantity">Количество ({unit})</Label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onDecrement}
          disabled={Number(quantity) <= (minOrderQuantity || 1)}
          className="flex-shrink-0 h-10 w-10"
        >
          <Icon name="Minus" size={16} />
        </Button>
        
        <Input
          id="order-quantity"
          name="order-quantity"
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          step="1"
          value={quantity}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '') {
              onQuantityChange('');
              return;
            }
            const numVal = Number(val);
            if (!isNaN(numVal) && numVal >= 0) {
              onQuantityChange(val);
            }
          }}
          onFocus={onErrorClear}
          required
          className={`text-center ${quantityError ? 'border-red-500' : ''}`}
        />
        
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onIncrement}
          disabled={Number(quantity) >= remainingQuantity}
          className="flex-shrink-0 h-10 w-10"
        >
          <Icon name="Plus" size={16} />
        </Button>
      </div>
      {quantityError && (
        <p className="text-xs text-red-500 mt-1">{quantityError}</p>
      )}
      {minOrderQuantity && (
        <p className="text-xs text-muted-foreground mt-1">
          Минимум для заказа: {minOrderQuantity} {unit}
        </p>
      )}
    </div>
  );
}