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
      <DialogContent className="max-w-2xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden p-4 sm:p-6">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Заказ #{order.id.slice(0, 8)}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-0">
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

        {/* Предложение цены от покупателя */}
        {order.counterPricePerUnit && order.status === 'negotiating' && !order.buyerAcceptedCounter && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Icon name="DollarSign" className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">
                    {isSeller ? 'Предложение от покупателя' : 'Ваше предложение цены'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">{order.counterOfferMessage || 'Покупатель предложил свою цену'}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Цена продавца:</span>{' '}
                      <span className="font-medium">{order.pricePerUnit.toLocaleString('ru-RU')} ₽/{order.unit}</span>
                    </div>
                    <Icon name="ArrowRight" className="h-4 w-4" />
                    <div>
                      <span className="text-muted-foreground">Предложение:</span>{' '}
                      <span className="font-bold text-blue-600">
                        {order.counterPricePerUnit.toLocaleString('ru-RU')} ₽/{order.unit}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm font-medium">
                    Сумма по предложению: <span className="text-blue-600">{order.counterTotalAmount?.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  {isSeller && onAcceptCounter && (
                    <div className="mt-3 flex gap-2">
                      <Button onClick={onAcceptCounter} size="sm" className="bg-green-600 hover:bg-green-700">
                        <Icon name="Check" className="mr-1.5 h-4 w-4" />
                        Принять предложение покупателя
                      </Button>
                      <Button 
                        onClick={() => setShowCounterForm(true)} 
                        variant="outline" 
                        size="sm"
                      >
                        <Icon name="MessageSquare" className="mr-1.5 h-4 w-4" />
                        Встречное предложение
                      </Button>
                    </div>
                  )}
                  {isBuyer && (
                    <Badge className="mt-3 bg-yellow-500">Ожидает ответа продавца</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Форма предложения цены от покупателя */}
        {showCounterForm && isBuyer && order.status === 'new' && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4 space-y-3">
              <h3 className="font-semibold text-sm">Предложить свою цену</h3>
              <div className="text-xs text-muted-foreground mb-2">
                Цена продавца: {order.pricePerUnit.toLocaleString('ru-RU')} ₽/{order.unit}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Ваша цена за {order.unit}</label>
                  <Input
                    type="number"
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Общая сумма</label>
                  <div className="mt-1 font-bold text-lg text-blue-600">
                    {(parseFloat(counterPrice) * order.quantity).toLocaleString('ru-RU')} ₽
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Комментарий (необязательно)</label>
                <Textarea
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  placeholder="Почему предлагаете эту цену?"
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (onCounterOffer) {
                      onCounterOffer(parseFloat(counterPrice), counterMessage);
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
              <div className="text-xs text-muted-foreground mb-2">
                Покупатель предложил: {order.counterPricePerUnit?.toLocaleString('ru-RU')} ₽/{order.unit}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Ваша цена за {order.unit}</label>
                  <Input
                    type="number"
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Общая сумма</label>
                  <div className="mt-1 font-bold text-lg text-orange-600">
                    {(parseFloat(counterPrice) * order.quantity).toLocaleString('ru-RU')} ₽
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Комментарий (необязательно)</label>
                <Textarea
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  placeholder="Объясните свою цену..."
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (onCounterOffer) {
                      onCounterOffer(parseFloat(counterPrice), counterMessage);
                      setShowCounterForm(false);
                    }
                  }}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Отправить встречное предложение
                </Button>
                <Button onClick={() => setShowCounterForm(false)} size="sm" variant="outline">
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Действия покупателя */}
        {isBuyer && order.status === 'new' && !showCounterForm && onCounterOffer && (
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowCounterForm(true)} 
              variant="outline" 
              className="flex-1"
              size="sm"
            >
              <Icon name="DollarSign" className="mr-1.5 h-4 w-4" />
              Предложить свою цену
            </Button>
          </div>
        )}

        {/* Действия продавца */}
        {isSeller && order.status === 'new' && !showCounterForm && (
          <div className="flex gap-2">
            {onAcceptOrder && (
              <Button onClick={onAcceptOrder} className="flex-1" size="sm">
                <Icon name="Check" className="mr-1.5 h-4 w-4" />
                Принять заказ по текущей цене
              </Button>
            )}
          </div>
        )}
        </div>

        <div className="flex-shrink-0 flex flex-col border-t pt-3 mt-3 space-y-3">
          <div className="h-48 sm:h-64 overflow-y-auto pr-2" ref={scrollRef}>
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Icon name="MessageSquare" className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Начните общение</p>
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
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
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
        </div>
      </DialogContent>
    </Dialog>
  );
}