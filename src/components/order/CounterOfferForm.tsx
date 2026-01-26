import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Order } from '@/types/order';

interface CounterOfferFormProps {
  order: Order;
  isBuyer: boolean;
  isSeller: boolean;
  showCounterForm: boolean;
  counterPrice: string;
  counterQuantity: string;
  counterMessage: string;
  onCounterPriceChange: (value: string) => void;
  onCounterQuantityChange: (value: string) => void;
  onCounterMessageChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onCounterOffer?: (price: number, message: string, quantity?: number) => void;
}

export default function CounterOfferForm({
  order,
  isBuyer,
  isSeller,
  showCounterForm,
  counterPrice,
  counterQuantity,
  counterMessage,
  onCounterPriceChange,
  onCounterQuantityChange,
  onCounterMessageChange,
  onSubmit,
  onCancel,
  onCounterOffer,
}: CounterOfferFormProps) {
  if (!showCounterForm) {
    return null;
  }

  // Форма встречного предложения от покупателя
  if (isBuyer && order.status === 'new') {
    return (
      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4 space-y-3">
          <h3 className="font-semibold text-sm">Предложить свои условия</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Количество ({order.unit})</label>
              <Input
                type="number"
                value={counterQuantity}
                onChange={(e) => onCounterQuantityChange(e.target.value)}
                min="1"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Цена за {order.unit}</label>
              <Input
                type="number"
                value={counterPrice}
                onChange={(e) => onCounterPriceChange(e.target.value)}
              />
            </div>
          </div>
          <div className="bg-white/50 dark:bg-gray-900/50 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Общая сумма:</span>
              <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                {(parseFloat(counterPrice || '0') * parseFloat(counterQuantity || '0')).toLocaleString('ru-RU')} ₽
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Комментарий (необязательно)</label>
            <textarea
              className="w-full px-3 py-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Добавьте комментарий к предложению..."
              value={counterMessage}
              onChange={(e) => onCounterMessageChange(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onSubmit}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Отправить предложение
            </Button>
            <Button onClick={onCancel} size="sm" variant="outline">
              Отмена
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Форма встречного предложения от продавца
  if (isSeller && order.status === 'negotiating') {
    return (
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="pt-4 space-y-3">
          <h3 className="font-semibold text-sm">Встречное предложение</h3>
          <div className="text-xs text-muted-foreground">
            Покупатель предложил: {order.counterPricePerUnit?.toLocaleString('ru-RU')} ₽/{order.unit}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Ваша цена за {order.unit}</label>
              <Input
                type="number"
                value={counterPrice}
                onChange={(e) => onCounterPriceChange(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Сумма</label>
              <div className="font-bold text-base text-orange-600 pt-2">
                {(parseFloat(counterPrice || '0') * order.quantity).toLocaleString('ru-RU')} ₽
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Комментарий (необязательно)</label>
            <textarea
              className="w-full px-3 py-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={2}
              placeholder="Добавьте комментарий к предложению..."
              value={counterMessage}
              onChange={(e) => onCounterMessageChange(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (onCounterOffer) {
                  onCounterOffer(parseFloat(counterPrice), counterMessage.trim());
                  onCancel();
                }
              }}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
            >
              Отправить встречное
            </Button>
            <Button onClick={onCancel} size="sm" variant="outline">
              Отмена
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Форма встречного предложения от покупателя во время торга
  if (isBuyer && order.status === 'negotiating') {
    return (
      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4 space-y-3">
          <h3 className="font-semibold text-sm">Встречное предложение</h3>
          <div className="text-xs text-muted-foreground">
            Продавец предложил: {order.counterPricePerUnit?.toLocaleString('ru-RU')} ₽/{order.unit}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Ваша цена за {order.unit}</label>
              <Input
                type="number"
                value={counterPrice}
                onChange={(e) => onCounterPriceChange(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Сумма</label>
              <div className="font-bold text-base text-blue-600 pt-2">
                {(parseFloat(counterPrice || '0') * order.quantity).toLocaleString('ru-RU')} ₽
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Комментарий (необязательно)</label>
            <textarea
              className="w-full px-3 py-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Добавьте комментарий к предложению..."
              value={counterMessage}
              onChange={(e) => onCounterMessageChange(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (onCounterOffer) {
                  onCounterOffer(parseFloat(counterPrice), counterMessage.trim());
                  onCancel();
                }
              }}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Отправить встречное
            </Button>
            <Button onClick={onCancel} size="sm" variant="outline">
              Отмена
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
