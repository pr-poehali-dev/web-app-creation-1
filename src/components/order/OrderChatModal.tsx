import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

import Icon from '@/components/ui/icon';
import type { Order, ChatMessage } from '@/types/order';
import { getSession } from '@/utils/auth';
import { formatTimeWithTimezone } from '@/utils/dateUtils';

interface OrderChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onAcceptOrder?: () => void;
  onCounterOffer?: (price: number, message: string) => void;
  onAcceptCounter?: () => void;
  onCompleteOrder?: () => void;
}

export default function OrderChatModal({
  isOpen,
  onClose,
  order,
  messages,
  onSendMessage,
  onAcceptOrder,
  onCounterOffer,
  onAcceptCounter,
  onCompleteOrder,
}: OrderChatModalProps) {
  const currentUser = getSession();
  const [newMessage, setNewMessage] = useState('');
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterPrice, setCounterPrice] = useState(order.pricePerUnit.toString());
  const [counterMessage, setCounterMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isBuyer = currentUser?.id?.toString() === order.buyerId?.toString();
  const isSeller = currentUser?.id?.toString() === order.sellerId?.toString();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);



  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const contactPerson = isBuyer 
    ? { name: order.sellerName, phone: order.sellerPhone, email: order.sellerEmail }
    : { name: order.buyerName, phone: order.buyerPhone, email: order.buyerEmail };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[95vh] sm:h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b">
          <DialogTitle>Заказ #{order.id.slice(0, 8)}</DialogTitle>
        </DialogHeader>

        {/* Верхняя часть с функциями торга - прокручивается */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 min-h-0">
          <div className="space-y-3 py-3">
            {/* Кнопки действий для покупателя - предложить свою цену */}
            {isBuyer && order.status === 'new' && !showCounterForm && !order.counterPricePerUnit && onCounterOffer && (
              <div className="flex gap-2">
                <Button onClick={() => setShowCounterForm(true)} variant="outline" size="sm" className="flex-1">
                  <Icon name="MessageSquare" className="mr-1.5 h-4 w-4" />
                  Предложить свою цену
                </Button>
              </div>
            )}

            {/* Встречное предложение - показываем тому кто должен ответить */}
            {order.counterPricePerUnit && order.status === 'negotiating' && !order.buyerAcceptedCounter && (
              <Card className={order.counterOfferedBy === 'buyer' ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}>
                <CardContent className="pt-4">
                  <div className="flex items-start">
                    <div className="flex-1 min-w-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Цена предложения:
                          </span>
                          <span className="font-medium">{order.pricePerUnit.toLocaleString('ru-RU')} ₽/{order.unit}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {isSeller ? 'Встречное предложение покупателя:' : 'Ваше встречное предложение:'}
                          </span>
                          <span className={`font-bold ${order.counterOfferedBy === 'buyer' ? 'text-blue-600' : 'text-orange-600'}`}>
                            {order.counterPricePerUnit.toLocaleString('ru-RU')} ₽/{order.unit}
                          </span>
                        </div>
                        <div className="text-sm font-medium pt-1">
                          Сумма: <span className={order.counterOfferedBy === 'buyer' ? 'text-blue-600' : 'text-orange-600'}>{order.counterTotalAmount?.toLocaleString('ru-RU')} ₽</span>
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
                            </div>
                          )}
                          
                          {/* Покупатель отвечает на встречное предложение продавца */}
                          {isBuyer && (!order.counterOfferedBy || order.counterOfferedBy === 'seller') && (
                            <div className="flex flex-col sm:flex-row gap-1.5 mt-3">
                              <Button onClick={onAcceptCounter} size="sm" className="bg-green-600 hover:bg-green-700 text-[11px] px-2.5 py-1.5 h-auto flex-1">
                                <Icon name="Check" className="mr-1 h-3.5 w-3.5" />
                                Принять
                              </Button>
                              <Button 
                                onClick={() => setShowCounterForm(true)} 
                                variant="outline" 
                                size="sm"
                                className="text-[11px] px-2.5 py-1.5 h-auto flex-1"
                              >
                                <Icon name="MessageSquare" className="mr-1 h-3.5 w-3.5" />
                                Встречное
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Статус ожидания */}
                      {isSeller && order.counterOfferedBy === 'seller' && (
                        <Badge className="mt-2 bg-yellow-500">Ожидает ответа покупателя</Badge>
                      )}
                      {isBuyer && (!order.counterOfferedBy || order.counterOfferedBy === 'buyer') && (
                        <Badge className="mt-2 bg-yellow-500">Ожидает ответа продавца</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Форма предложения цены от покупателя */}
            {showCounterForm && isBuyer && (order.status === 'new' || order.status === 'negotiating') && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4 space-y-3">
                  <h3 className="font-semibold text-sm">Предложить свою цену</h3>
                  <div className="text-xs text-muted-foreground">
                    Цена продавца: {order.pricePerUnit.toLocaleString('ru-RU')} ₽/{order.unit}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Ваша цена за {order.unit}</label>
                      <Input
                        type="number"
                        value={counterPrice}
                        onChange={(e) => setCounterPrice(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Общая сумма</label>
                      <div className="font-bold text-lg text-blue-600 pt-2">
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
              <Card className="bg-green-50 border-green-200">
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
              <Card className="bg-green-50 border-green-200">
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

            {/* Заказ завершён */}
            {order.status === 'completed' && (
              <Card className="bg-gray-100 border-gray-300">
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

            {/* Информация о заказе - в конце */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4 space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Товар</p>
                    <p className="font-medium">{order.offerTitle}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Количество</p>
                    <p className="font-medium">{order.quantity} {order.unit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Сумма</p>
                    <p className="font-bold text-primary">{order.totalAmount?.toLocaleString('ru-RU') || '0'} ₽</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Доставка</p>
                    <p className="font-medium">
                      {order.deliveryType === 'pickup' ? 'Самовывоз' : 'Доставка'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="User" className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">
                      {isBuyer ? 'Продавец' : 'Покупатель'}
                    </h3>
                  </div>
                  <p className="text-sm font-medium">{contactPerson.name}</p>
                  <div className="space-y-1 mt-2">
                    <a
                      href={`tel:${contactPerson.phone}`}
                      className="text-sm hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      <Icon name="Phone" className="h-3.5 w-3.5" />
                      {contactPerson.phone}
                    </a>
                    <a
                      href={`mailto:${contactPerson.email}`}
                      className="text-xs hover:text-primary transition-colors flex items-center gap-1.5 text-muted-foreground"
                    >
                      <Icon name="Mail" className="h-3.5 w-3.5" />
                      {contactPerson.email}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Нижняя часть с чатом - фиксированная */}
        <div className="flex-shrink-0 flex flex-col border-t px-4 sm:px-6 py-3 bg-background">
          <div className="h-40 sm:h-48 overflow-y-auto mb-3 pr-2" ref={scrollRef}>
            <div className="space-y-2">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  <Icon name="MessageSquare" className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Начните общение</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.senderId === currentUser?.id?.toString();
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] sm:max-w-[70%] rounded-lg px-3 py-2 ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {formatTimeWithTimezone(msg.timestamp, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {order.status === 'completed' ? (
            <div className="text-center py-2 text-sm text-muted-foreground">
              Чат закрыт — заказ завершён
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Введите сообщение..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={!newMessage.trim()} size="sm">
                <Icon name="Send" className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}