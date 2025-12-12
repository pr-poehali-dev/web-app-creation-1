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

import Icon from '@/components/ui/icon';
import type { Order, ChatMessage } from '@/types/order';
import { getSession } from '@/utils/auth';

interface OrderChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

export default function OrderChatModal({
  isOpen,
  onClose,
  order,
  messages,
  onSendMessage,
}: OrderChatModalProps) {
  const currentUser = getSession();
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isBuyer = currentUser?.id === order.buyerId;

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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Заказ #{order.id.slice(0, 8)}</DialogTitle>
        </DialogHeader>

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
                <p className="font-bold text-primary">{order.totalPrice.toLocaleString('ru-RU')} ₽</p>
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

        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 overflow-y-auto pr-4" ref={scrollRef}>
            <div className="space-y-3 py-4">
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
                          {new Date(msg.timestamp).toLocaleTimeString('ru-RU', {
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

          <div className="flex gap-2 pt-4 border-t">
            <Input
              placeholder="Введите сообщение..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button onClick={handleSend} disabled={!newMessage.trim()}>
              <Icon name="Send" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}