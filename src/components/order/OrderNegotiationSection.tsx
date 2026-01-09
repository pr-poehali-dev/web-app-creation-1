import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import type { Order } from '@/types/order';

interface OrderNegotiationSectionProps {
  order: Order;
  isBuyer: boolean;
  isSeller: boolean;
  onCounterOffer?: (price: number, message: string, quantity?: number) => void;
  onAcceptCounter?: () => void;
  onCancelOrder?: () => void;
  onCompleteOrder?: () => void;
}

export default function OrderNegotiationSection({
  order,
  isBuyer,
  isSeller,
  onCounterOffer,
  onAcceptCounter,
  onCancelOrder,
  onCompleteOrder,
}: OrderNegotiationSectionProps) {
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterPrice, setCounterPrice] = useState(order.pricePerUnit.toString());
  const [counterQuantity, setCounterQuantity] = useState(order.quantity.toString());
  const [counterMessage, setCounterMessage] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const handleCounterOffer = async () => {
    const price = parseFloat(counterPrice);
    const quantity = parseFloat(counterQuantity);
    console.log('[OrderNegotiation.handleCounterOffer] Validating:', { counterPrice, price, counterQuantity, quantity, isValid: !isNaN(price) && price > 0 && !isNaN(quantity) && quantity > 0 });
    
    if (isNaN(price) || price <= 0) {
      console.error('[OrderNegotiation.handleCounterOffer] Invalid price');
      return;
    }
    
    if (isNaN(quantity) || quantity <= 0) {
      console.error('[OrderNegotiation.handleCounterOffer] Invalid quantity');
      return;
    }
    
    if (onCounterOffer) {
      console.log('[OrderNegotiation.handleCounterOffer] Calling onCounterOffer with:', { price, quantity, message: counterMessage.trim() });
      try {
        await onCounterOffer(price, counterMessage.trim(), quantity);
        console.log('[OrderNegotiation.handleCounterOffer] Success, closing form');
        setShowCounterForm(false);
        setCounterMessage('');
      } catch (error) {
        console.error('[OrderNegotiation.handleCounterOffer] Error:', error);
      }
    } else {
      console.error('[OrderNegotiation.handleCounterOffer] onCounterOffer is not defined');
    }
  };

  return (
    <>
      {/* Кнопки действий для покупателя - предложить свою цену */}
      {isBuyer && order.status === 'new' && !showCounterForm && !order.counterPricePerUnit && onCounterOffer && (
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowCounterForm(true)} 
            variant="outline" 
            size="sm" 
            className="flex-1 border-2 border-primary hover:bg-primary/10 font-semibold shadow-sm"
          >
            <Icon name="MessageSquare" className="mr-1.5 h-4 w-4" />
            Предложить свою цену
          </Button>
        </div>
      )}

      {/* Кнопка "Предложить свою цену" для модалки заказа */}
      {isBuyer && order.status === 'accepted' && !showCounterForm && !order.counterPricePerUnit && onCounterOffer && (
        <Button 
          onClick={() => setShowCounterForm(true)} 
          variant="default" 
          size="sm" 
          className="w-full border-2 font-semibold shadow-sm"
        >
          <Icon name="MessageSquare" className="mr-1.5 h-4 w-4" />
          Предложить свою цену
        </Button>
      )}

      {/* Встречное предложение - показываем тому кто должен ответить */}
      {order.counterPricePerUnit && order.status === 'negotiating' && !order.buyerAcceptedCounter && order.status !== 'accepted' && (
        <Card className={order.counterOfferedBy === 'buyer' ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' : 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'}>
          <CardContent className="pt-4">
            <div className="flex items-start">
              <div className="flex-1 min-w-0">
                <div className="space-y-2.5">
                  {/* 2. Встречные предложения - показываем последнее */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5">
                        <Icon 
                          name={order.counterOfferedBy === 'buyer' ? 'User' : 'Store'} 
                          className={`h-4 w-4 ${order.counterOfferedBy === 'buyer' ? 'text-blue-600' : 'text-orange-600'}`} 
                        />
                        <span className="font-semibold text-foreground">
                          {order.counterOfferedBy === 'buyer' ? 'Встречное предложение покупателя:' : 'Встречное предложение продавца:'}
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
                    
                    {/* Сумма заказа */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-dashed">
                      <span className="text-sm text-muted-foreground">Сумма заказа:</span>
                      <span className={`font-bold text-base ${order.counterOfferedBy === 'buyer' ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {order.counterTotalAmount?.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Кнопки торга - показываем в зависимости от того, кто сделал последнее предложение */}
                {onAcceptCounter && (
                  <>
                    {/* Продавец отвечает на предложение покупателя */}
                    {isSeller && (!order.counterOfferedBy || order.counterOfferedBy === 'buyer') && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <Button onClick={onAcceptCounter} size="sm" className="bg-green-600 hover:bg-green-700 text-[11px] px-2.5 py-1.5 h-auto">
                          <Icon name="Check" className="mr-1 h-3.5 w-3.5" />
                          Принять
                        </Button>
                        <Button 
                          onClick={() => setShowCounterForm(true)} 
                          variant="outline" 
                          size="sm"
                          className="text-[11px] px-2.5 py-1.5 h-auto"
                        >
                          <Icon name="MessageSquare" className="mr-1 h-3.5 w-3.5" />
                          Встречное
                        </Button>
                        {onCancelOrder && (
                          <Button 
                            onClick={onCancelOrder} 
                            variant="destructive" 
                            size="sm"
                            className="text-[11px] px-2.5 py-1.5 h-auto"
                          >
                            <Icon name="X" className="mr-1 h-3.5 w-3.5" />
                            Отменить
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {/* Покупатель отвечает на встречное предложение продавца */}
                    {isBuyer && (!order.counterOfferedBy || order.counterOfferedBy === 'seller') && (
                      <div className="space-y-1.5 mt-3">
                        <div className="flex gap-1">
                          <Button 
                            onClick={onAcceptCounter} 
                            size="sm" 
                            className={`text-[11px] px-2 py-1.5 h-auto flex-1 ${
                              !showCounterForm 
                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                : 'bg-white hover:bg-gray-50 text-black border border-black'
                            }`}
                          >
                            <Icon name="Check" className="mr-0.5 h-3 w-3" />
                            Принять
                          </Button>
                          <Button 
                            onClick={() => {
                              if (!showCounterForm) {
                                setCounterPrice(order.counterPricePerUnit?.toString() || order.pricePerUnit.toString());
                                setCounterQuantity(order.quantity.toString());
                              }
                              setShowCounterForm(true);
                            }} 
                            size="sm"
                            className={`text-[11px] px-2 py-1.5 h-auto flex-1 ${
                              showCounterForm 
                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                : 'bg-white hover:bg-gray-50 text-black border border-black'
                            }`}
                          >
                            <Icon name="MessageSquare" className="mr-0.5 h-3 w-3" />
                            Встречное
                          </Button>
                        </div>
                        {onCancelOrder && (
                          <Button 
                            onClick={onCancelOrder} 
                            variant="destructive" 
                            size="sm"
                            className="w-full text-[11px] px-2 py-1.5 h-auto"
                          >
                            <Icon name="X" className="mr-0.5 h-3 w-3" />
                            Отменить
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                )}
                
                {/* Статус ожидания */}
                {isSeller && order.counterOfferedBy === 'seller' && (
                  <div className="flex items-center gap-2 mt-3 text-muted-foreground text-xs">
                    <Icon name="Clock" className="h-3.5 w-3.5" />
                    <span>Ожидание ответа покупателя</span>
                  </div>
                )}
                {isBuyer && order.counterOfferedBy === 'buyer' && (
                  <div className="flex items-center gap-2 mt-3 text-muted-foreground text-xs">
                    <Icon name="Clock" className="h-3.5 w-3.5" />
                    <span>Ожидание ответа продавца</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Форма встречного предложения от покупателя */}
      {showCounterForm && isBuyer && order.status === 'new' && (
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4 space-y-3">
            <h3 className="font-semibold text-sm">Предложить свои условия</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Количество ({order.unit})</label>
                <Input
                  type="number"
                  value={counterQuantity}
                  onChange={(e) => setCounterQuantity(e.target.value)}
                  min="1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Цена за {order.unit}</label>
                <Input
                  type="number"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
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

            <div className="flex gap-2">
              <Button
                onClick={handleCounterOffer}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Отправить предложение
              </Button>
              <Button onClick={() => setShowCounterForm(false)} size="sm" variant="outline">
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Форма встречного предложения от продавца */}
      {showCounterForm && isSeller && order.status === 'negotiating' && (
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
                  onChange={(e) => setCounterPrice(e.target.value)}
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
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (onCounterOffer) {
                    onCounterOffer(parseFloat(counterPrice), '');
                    setShowCounterForm(false);
                  }
                }}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700"
              >
                Отправить встречное
              </Button>
              <Button onClick={() => setShowCounterForm(false)} size="sm" variant="outline">
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Заказ принят покупателем после торгов */}
      {order.buyerAcceptedCounter && order.status === 'negotiating' && (
        <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Icon name="CheckCircle" className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-sm mb-1">Покупатель принял предложение</h3>
                <p className="text-sm text-muted-foreground">
                  Цена согласована: {order.counterPricePerUnit?.toLocaleString('ru-RU')} ₽/{order.unit}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Завершение заказа продавцом */}
      {isSeller && order.status === 'accepted' && onCompleteOrder && (
        <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Icon name="PackageCheck" className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1">Заказ принят</h3>
                <p className="text-sm text-muted-foreground mb-3">Товар отправлен покупателю? Завершите заказ.</p>
                <Button onClick={onCompleteOrder} size="sm" className="bg-green-600 hover:bg-green-700">
                  <Icon name="CheckCircle" className="mr-1.5 h-4 w-4" />
                  Завершить заказ
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Завершение заказа покупателем с отзывом */}
      {isBuyer && order.status === 'accepted' && onCompleteOrder && (
        <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
          <CardContent className="pt-4">
            {!showReviewForm ? (
              <div className="flex items-center gap-3">
                <Icon name="PackageCheck" className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-1">Заказ принят</h3>
                  <p className="text-sm text-muted-foreground mb-3">Товар получен? Завершите заказ и оставьте отзыв.</p>
                  <Button 
                    onClick={() => setShowReviewForm(true)} 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Icon name="Star" className="mr-1.5 h-4 w-4" />
                    Завершить с отзывом
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Оставьте отзыв о продавце</h3>
                
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">Оценка</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Icon 
                          name="Star" 
                          className={`h-6 w-6 ${
                            star <= rating 
                              ? 'fill-yellow-400 text-yellow-400' 
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-2">
                    Отзыв (необязательно)
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Расскажите о вашем опыте работы с продавцом..."
                    className="w-full p-3 border rounded-lg min-h-[100px] bg-background"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      onCompleteOrder();
                      setShowReviewForm(false);
                    }}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Icon name="CheckCircle" className="mr-1.5 h-4 w-4" />
                    Завершить заказ
                  </Button>
                  <Button
                    onClick={() => setShowReviewForm(false)}
                    size="sm"
                    variant="outline"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Заказ завершён */}
      {order.status === 'completed' && (
        <Card className="bg-gray-100 dark:bg-gray-900/30 border-gray-300 dark:border-gray-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Icon name="CheckCircle2" className="h-5 w-5 text-gray-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1">Заказ завершён</h3>
                <p className="text-sm text-muted-foreground">Сделка успешно завершена. Спасибо за работу!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}