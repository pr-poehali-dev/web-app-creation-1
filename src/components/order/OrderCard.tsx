import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { Order } from '@/types/order';

interface OrderCardProps {
  order: Order;
  isSeller: boolean;
  onOpenChat: (order: Order) => void;
  onAcceptOrder?: (orderId: string) => void;
  onCompleteOrder?: (orderId: string) => void;
}

export default function OrderCard({ order, isSeller, onOpenChat, onAcceptOrder, onCompleteOrder }: OrderCardProps) {
  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'new':
        return <Badge variant="outline" className="bg-blue-50">Новый</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50">Ожидает</Badge>;
      case 'negotiating':
        return null; // Будет показана кнопка вместо бейджа
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50">Принят</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50">Отклонен</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-200 text-gray-700 border-gray-400">Отменён</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-400">Завершён</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onOpenChat(order)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg line-clamp-1">{order.offerTitle}</h3>
            </div>
            {order.orderNumber && (
              <p className="text-xs text-muted-foreground">Заказ #{order.orderNumber}</p>
            )}
          </div>
          {order.status === 'negotiating' ? (
            <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700 font-semibold shrink-0">
              <Icon name="MessageSquare" className="mr-1 h-3 w-3" />
              Торг
            </Badge>
          ) : (
            getStatusBadge(order.status)
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Количество</p>
            <p className="font-medium">{order.quantity} {order.unit}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Сумма</p>
            <p className="font-bold text-primary">{order.totalAmount?.toLocaleString('ru-RU') || '0'} ₽</p>
          </div>
          {order.status === 'negotiating' && order.counterPricePerUnit && (
            <div className="col-span-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded p-2">
              <p className="text-xs text-muted-foreground mb-1">
                {order.counterOfferedBy === 'buyer' ? 'Предложение покупателя' : 'Встречная цена продавца'}
              </p>
              <p className="font-bold text-orange-700 dark:text-orange-400">
                {order.counterPricePerUnit.toLocaleString('ru-RU')} ₽/{order.unit}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Сумма: {order.counterTotalAmount?.toLocaleString('ru-RU')} ₽
              </p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">Способ получения</p>
            <p className="font-medium">
              {order.deliveryType === 'pickup' ? 'Самовывоз' : 'Доставка'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{isSeller ? 'Покупатель' : 'Продавец'}</p>
            <p className="font-medium truncate">
              {isSeller ? order.buyerName : (order.sellerName || 'Продавец')}
            </p>
          </div>
          {isSeller && order.status === 'accepted' && order.buyerPhone && (
            <div className="col-span-2">
              <p className="text-muted-foreground mb-2">Связаться с покупателем</p>
              <div className="flex gap-2">
                <a
                  href={`https://wa.me/${order.buyerPhone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Icon name="MessageCircle" className="h-4 w-4" />
                  WhatsApp
                </a>
                <a
                  href={`https://t.me/${order.buyerPhone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Icon name="Send" className="h-4 w-4" />
                  Telegram
                </a>
                <a
                  href={`https://maks.ru/chat/${order.buyerPhone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md text-sm font-medium transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Icon name="MessagesSquare" className="h-4 w-4" />
                  Макс
                </a>
              </div>
            </div>
          )}
          {order.status === 'completed' && order.completedDate && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Дата завершения</p>
              <p className="font-medium">
                {new Date(order.completedDate).toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}
          {order.status === 'cancelled' && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Причина отмены</p>
              <p className="font-medium text-red-600">
                {order.cancelledBy === 'seller' ? '❌ Отменён продавцом' : '❌ Отменён покупателем'}
              </p>
              {order.cancellationReason && (
                <p className="text-sm text-muted-foreground mt-1">{order.cancellationReason}</p>
              )}
            </div>
          )}
        </div>

        {order.comment && (
          <div className="text-sm">
            <p className="text-muted-foreground">Комментарий</p>
            <p className="text-sm mt-1">{order.comment}</p>
          </div>
        )}

        <div className="flex gap-2">
          {order.status === 'accepted' && !isSeller && onCompleteOrder ? (
            <>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onCompleteOrder(order.id);
                }}
                className="flex-1"
                size="sm"
              >
                <Icon name="CheckCircle" className="mr-1.5 h-4 w-4" />
                Завершить заказ
              </Button>
            </>
          ) : isSeller && order.status === 'accepted' ? (
            <div className="flex-1 bg-green-50 border border-green-200 rounded-md px-3 py-2 flex items-center justify-center gap-2">
              <Icon name="CheckCircle" className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Заказ в работе</span>
            </div>
          ) : isSeller && (order.status === 'new' || order.status === 'pending') ? (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onOpenChat(order);
              }}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              <Icon name="Clock" className="mr-1.5 h-4 w-4" />
              Ожидает подтверждения
            </Button>
          ) : (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onOpenChat(order);
              }}
              variant={order.status === 'completed' || order.status === 'cancelled' ? 'secondary' : 'outline'}
              className="flex-1"
              size="sm"
            >
              <Icon name="FileText" className="mr-1.5 h-4 w-4" />
              Детали заказа
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}