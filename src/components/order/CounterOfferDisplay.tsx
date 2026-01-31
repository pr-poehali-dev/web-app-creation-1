import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import type { Order } from '@/types/order';

interface CounterOfferDisplayProps {
  order: Order;
  isBuyer: boolean;
  isSeller: boolean;
  onAcceptCounter?: () => void;
  onShowCounterForm: () => void;
  onCancelOrder?: () => void;
}

export default function CounterOfferDisplay({
  order,
  isBuyer,
  isSeller,
  onAcceptCounter,
  onShowCounterForm,
  onCancelOrder,
}: CounterOfferDisplayProps) {
  if (!order.counterPricePerUnit || order.status !== 'negotiating' || order.buyerAcceptedCounter || order.status === 'accepted') {
    return null;
  }

  return (
    <Card className={order.counterOfferedBy === 'buyer' ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' : 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'}>
      <CardContent className="pt-4">
        <div className="flex items-start">
          <div className="flex-1 min-w-0">
            <div className="space-y-2.5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    <Icon 
                      name={order.counterOfferedBy === 'buyer' ? 'User' : 'Store'} 
                      className={`h-4 w-4 ${order.counterOfferedBy === 'buyer' ? 'text-blue-600' : 'text-orange-600'}`} 
                    />
                    <span className="font-semibold text-foreground">
                      {order.counterOfferedBy === 'buyer' 
                        ? (isBuyer 
                          ? 'Ваше встречное предложение покупки:' 
                          : `Встречное предложение покупателя: ${order.buyerName}`)
                        : (isSeller 
                          ? 'Ваше встречное предложение продажи:' 
                          : `Встречное предложение продавца: ${order.sellerName}`)}
                    </span>
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Количество:</span>
                    <span className={`font-semibold ml-1 ${order.counterOfferedBy === 'buyer' ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                      {order.quantity} {order.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Цена:</span>
                    <span className={`font-semibold ml-1 ${order.counterOfferedBy === 'buyer' ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                      {order.counterPricePerUnit.toLocaleString('ru-RU')} ₽/{order.unit}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-1.5 border-t border-dashed">
                  <span className="text-sm text-muted-foreground">Сумма заказа:</span>
                  <span className={`font-bold text-base ${order.counterOfferedBy === 'buyer' ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                    {order.counterTotalAmount?.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
                
                {order.counterOfferMessage && (
                  <div className="pt-2 border-t border-dashed">
                    <span className="text-xs text-muted-foreground block mb-1">Комментарий:</span>
                    <p className="text-sm text-foreground bg-white/50 dark:bg-gray-800/50 p-2 rounded">
                      {order.counterOfferMessage}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {onAcceptCounter && (
              <>
                {isSeller && (!order.counterOfferedBy || order.counterOfferedBy === 'buyer') && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <Button onClick={onAcceptCounter} size="sm" className="bg-green-600 hover:bg-green-700 text-[11px] px-2.5 py-1.5 h-auto">
                      <Icon name="Check" className="mr-1 h-3.5 w-3.5" />
                      Принять
                    </Button>
                    <Button 
                      onClick={onShowCounterForm} 
                      variant="outline" 
                      size="sm"
                      className="text-[11px] px-2.5 py-1.5 h-auto"
                    >
                      <Icon name="MessageSquare" className="mr-1 h-3.5 w-3.5" />
                      Встречное
                    </Button>
                    {onCancelOrder && order.status === 'pending' && (
                      <Button 
                        onClick={onCancelOrder} 
                        variant="destructive" 
                        size="sm"
                        className="text-[11px] px-2.5 py-1.5 h-auto"
                      >
                        <Icon name="XCircle" className="mr-1 h-3.5 w-3.5" />
                        Отменить заказ
                      </Button>
                    )}
                  </div>
                )}
                
                {isBuyer && (!order.counterOfferedBy || order.counterOfferedBy === 'seller') && (
                  <div className="space-y-1.5 mt-3">
                    <div className="flex gap-1">
                      <Button 
                        onClick={onAcceptCounter} 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 text-[11px] px-2 py-1.5 h-auto flex-1"
                      >
                        <Icon name="Check" className="mr-0.5 h-3 w-3" />
                        Принять
                      </Button>
                      <Button 
                        onClick={onShowCounterForm} 
                        size="sm"
                        className={`text-[11px] px-2 py-1.5 h-auto flex-1 bg-white hover:bg-gray-50 text-black border border-black`}
                      >
                        <Icon name="MessageSquare" className="mr-0.5 h-3 w-3" />
                        Встречное
                      </Button>
                    </div>
                    {onCancelOrder && order.status === 'pending' && (
                      <Button 
                        onClick={onCancelOrder} 
                        variant="destructive" 
                        size="sm"
                        className="text-[11px] px-2 py-1.5 h-auto w-full"
                      >
                        <Icon name="XCircle" className="mr-1 h-3.5 w-3.5" />
                        Отменить заказ
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
            
            {isSeller && order.counterOfferedBy === 'seller' && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs mt-3">
                <Icon name="Clock" className="h-3.5 w-3.5" />
                <span>Ожидание ответа покупателя: <span className="font-semibold text-foreground">{order.buyerName}</span></span>
              </div>
            )}
            {isBuyer && order.counterOfferedBy === 'buyer' && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs mt-3">
                <Icon name="Clock" className="h-3.5 w-3.5" />
                <span>Ожидание ответа продавца: <span className="font-semibold text-foreground">{order.sellerName}</span></span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}