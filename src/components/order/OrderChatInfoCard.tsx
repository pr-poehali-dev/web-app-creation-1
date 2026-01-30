import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { Order } from '@/types/order';

interface OrderChatInfoCardProps {
  order: Order;
  isBuyer: boolean;
  contactPerson: {
    name: string;
    phone: string;
    email: string;
  };
  onCancelOrder?: (orderId: string) => void;
  onCompleteOrder?: (orderId: string) => void;
}

export default function OrderChatInfoCard({ order, isBuyer, contactPerson, onCancelOrder, onCompleteOrder }: OrderChatInfoCardProps) {
  return (
    <Card className="bg-muted/50">
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-start gap-3 mb-3">
          {order.offerImageUrl ? (
            <img src={order.offerImageUrl} alt={order.offerTitle} className="w-20 h-20 object-cover rounded" />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded flex items-center justify-center flex-shrink-0">
              <Icon name="Package" className="w-10 h-10 text-primary/40" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-muted-foreground text-xs">Товар</p>
            <p className="font-medium">{order.offerTitle}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Количество</p>
            <div className="flex items-center gap-2">
              <p className="font-medium">{order.quantity} {order.unit}</p>
              {order.originalQuantity && order.originalQuantity !== order.quantity && (
                <span className="text-xs text-muted-foreground line-through">
                  {order.originalQuantity} {order.unit}
                </span>
              )}
            </div>
          </div>
          <div>
            <p className="text-muted-foreground">Сумма</p>
            <p className="font-bold text-primary">{order.totalAmount?.toLocaleString('ru-RU') || '0'} ₽</p>
          </div>
          {order.offerPricePerUnit && (
            <div>
              <p className="text-muted-foreground">Начальная цена</p>
              <p className="font-medium">{order.offerPricePerUnit?.toLocaleString('ru-RU')} ₽/{order.unit}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">Конечная цена</p>
            <p className="font-medium text-primary">{order.pricePerUnit?.toLocaleString('ru-RU')} ₽/{order.unit}</p>
          </div>
          {order.offerAvailableQuantity !== undefined && (
            <div>
              <p className="text-muted-foreground">Доступно</p>
              <p className="font-medium">{order.offerAvailableQuantity} {order.unit}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">Способ получения</p>
            <p className="font-medium">
              {order.deliveryType === 'pickup' ? 'Самовывоз' : 'Доставка'}
            </p>
          </div>
        </div>

        {order.status === 'accepted' && (
          <>
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
              <div className="flex items-center gap-2 mt-3">
                <a
                  href={`https://api.whatsapp.com/send?phone=${contactPerson.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors"
                  title="WhatsApp"
                >
                  <Icon name="MessageCircle" className="h-4 w-4" />
                </a>
                <a
                  href={`tg://resolve?phone=${contactPerson.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                  title="Telegram"
                >
                  <Icon name="Send" className="h-4 w-4" />
                </a>
              </div>
            </div>
          </>
        )}

        {order.status !== 'completed' && order.status !== 'cancelled' && (
          <>
            <Separator />
            {order.status === 'pending' && isBuyer && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <Icon name="Clock" className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Продавец: {contactPerson.name}</p>
                  <p>Заказ ожидает подтверждения продавца. После принятия статус изменится на "Принят"</p>
                </div>
              </div>
            )}
            {order.status === 'accepted' && onCompleteOrder ? (
              <Button
                onClick={() => onCompleteOrder(order.id)}
                variant="default"
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Icon name="Check" className="mr-1.5 h-4 w-4" />
                Заказ в работе
              </Button>
            ) : onCancelOrder ? (
              <Button
                onClick={() => onCancelOrder(order.id)}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                <Icon name="XCircle" className="mr-1.5 h-4 w-4" />
                Отменить заказ
              </Button>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}