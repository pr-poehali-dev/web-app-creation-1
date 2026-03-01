import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { Order } from '@/types/order';
import { getOrderRoles } from '@/utils/orderRoles';

interface OrderCardProps {
  order: Order;
  isSeller: boolean;
  onOpenChat: (order: Order) => void;
  onAcceptOrder?: (orderId: string) => void;
  onCompleteOrder?: (orderId: string) => void;
  onDeleteOrder?: (orderId: string) => void;
  isExiting?: boolean;
  isNew?: boolean;
}

export default function OrderCard({ order, isSeller, onOpenChat, onAcceptOrder, onCompleteOrder, onDeleteOrder, isExiting, isNew }: OrderCardProps) {
  const roles = getOrderRoles(order);
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
      case 'archived':
        return <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">В архиве</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card 
      className={`hover:shadow-md transition-shadow cursor-pointer relative ${isExiting ? 'animate-order-exit' : isNew ? 'animate-order-enter' : ''}`}
      onClick={() => onOpenChat(order)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg line-clamp-1">{order.offerTitle}</h3>
              {(order.unreadMessages && order.unreadMessages > 0) ? (
                <span className="animate-pulse inline-flex items-center gap-1 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping inline-block"></span>
                  {order.unreadMessages === 1 ? 'Новое сообщение' : `${order.unreadMessages} новых`}
                </span>
              ) : order.hasUnreadCounterOffer ? (
                <div className="relative flex items-center">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>
              ) : null}
            </div>
            {order.orderNumber && (
              <p className="text-xs text-muted-foreground">Заказ #{order.orderNumber}</p>
            )}
          </div>
          {order.status === 'negotiating' ? (
            <Badge variant="outline" className={`${order.hasUnreadCounterOffer ? 'bg-red-50 border-red-300 text-red-700 animate-pulse' : 'bg-orange-50 border-orange-200 text-orange-700'} font-semibold shrink-0`}>
              <Icon name="MessageSquare" className="mr-1 h-3 w-3" />
              {order.hasUnreadCounterOffer ? 'Новая цена' : 'Торг'}
            </Badge>
          ) : (
            getStatusBadge(order.status)
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {!order.isRequest && (
          <div>
            <p className="text-muted-foreground">Количество</p>
            <p className="font-medium">{order.quantity} {order.unit}</p>
          </div>
          )}
          <div>
            <p className="text-muted-foreground">Сумма</p>
            <p className="font-bold text-primary">
              {order.offerTransportNegotiable && order.offerCategory === 'transport' && !order.totalAmount
                ? 'Договорная'
                : `${(order.counterTotalAmount !== undefined && order.counterTotalAmount !== null 
                    ? order.counterTotalAmount 
                    : order.totalAmount)?.toLocaleString('ru-RU') || '0'} ₽`}
            </p>
          </div>
          {order.status === 'negotiating' && order.counterPricePerUnit && (
            <div className="col-span-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded p-2">
              <p className="text-xs text-muted-foreground mb-1">
                {order.counterOfferedBy === 'buyer' ? `Предложение ${roles.counterBuyer}` : `Встречная цена ${roles.counterSeller}`}
              </p>
              <p className="font-bold text-orange-700 dark:text-orange-400">
                {order.counterPricePerUnit.toLocaleString('ru-RU')} ₽/{order.unit}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Сумма: {order.counterTotalAmount?.toLocaleString('ru-RU')} ₽
              </p>
            </div>
          )}
          {!order.isRequest && (
          <div>
            {order.offerCategory === 'transport' ? (
              <>
                <p className="text-muted-foreground">Маршрут</p>
                <p className="font-medium">
                  {order.buyerComment?.includes('Маршрут:') 
                    ? order.buyerComment.match(/Маршрут:\s*([^\n]*)/)?.[1]?.trim() || order.offerTransportRoute || '—'
                    : order.offerTransportRoute || '—'}
                </p>
                {order.passengerPickupAddress && (
                  <p className="text-xs text-primary mt-0.5">
                    Посадка: {order.passengerPickupAddress}
                  </p>
                )}
                {order.offerTransportDateTime && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(order.offerTransportDateTime).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-muted-foreground">Способ получения</p>
                <p className="font-medium">
                  {order.deliveryType === 'pickup' ? 'Самовывоз' : 'Доставка'}
                </p>
              </>
            )}
          </div>
          )}
          <div>
            <p className="text-muted-foreground">
              {isSeller ? roles.buyer : roles.seller}
            </p>
            <p className="font-medium truncate">
              {isSeller 
                ? order.buyerName 
                : (order.sellerName || roles.seller)}
            </p>
          </div>

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
          {(order as unknown as Record<string, unknown>).archivedByAdmin && (
            <div className="col-span-2 p-2 bg-orange-50 border border-orange-200 rounded">
              <p className="text-orange-700 font-medium text-sm">🔒 Перемещён в архив администратором</p>
              {(order as unknown as Record<string, unknown>).adminArchiveReason && (
                <p className="text-sm text-orange-600 mt-1">{(order as unknown as Record<string, unknown>).adminArchiveReason as string}</p>
              )}
            </div>
          )}
        </div>

        {order.isRequest && order.buyerComment && (() => {
          const educationMatch = order.buyerComment.match(/Образование: ([^\n]*)/);
          return educationMatch ? (
            <div className="text-sm">
              <p className="text-muted-foreground">Образование</p>
              <p className="font-medium">{educationMatch[1].trim()}</p>
            </div>
          ) : null;
        })()}

        {order.status === 'accepted' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 text-sm space-y-1">
            <p className="font-semibold text-green-800 flex items-center gap-1.5">
              <Icon name="UserCheck" className="h-3.5 w-3.5" />
              Контакты {order.isRequest
                ? (isSeller ? 'исполнителя' : 'заказчика')
                : (isSeller ? 'покупателя' : 'продавца')}
            </p>
            {(isSeller ? order.buyerPhone : order.sellerPhone) && (
              <a
                href={`tel:${isSeller ? order.buyerPhone : order.sellerPhone}`}
                className="text-blue-600 hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Icon name="Phone" className="h-3 w-3" />
                {isSeller ? order.buyerPhone : order.sellerPhone}
              </a>
            )}
            {(isSeller ? order.buyerEmail : order.sellerEmail) && (
              <a
                href={`mailto:${isSeller ? order.buyerEmail : order.sellerEmail}`}
                className="text-blue-600 hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Icon name="Mail" className="h-3 w-3" />
                {isSeller ? order.buyerEmail : order.sellerEmail}
              </a>
            )}
          </div>
        )}

        {order.comment && (
          <div className="text-sm">
            <p className="text-muted-foreground">Комментарий</p>
            <p className="text-sm mt-1">{order.comment}</p>
          </div>
        )}



        <div className="flex gap-2">
          {order.isRequest && isSeller && (order.status === 'new' || order.status === 'pending') ? (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onOpenChat(order);
              }}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              <Icon name="Eye" className="mr-1.5 h-4 w-4" />
              Просмотреть отклик
            </Button>
          ) : order.isRequest && !isSeller && (order.status === 'new' || order.status === 'pending') ? (
            <>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenChat(order);
                }}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                <Icon name="Eye" className="mr-1.5 h-4 w-4" />
                Детали отклика
              </Button>
              {onDeleteOrder && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Вы уверены, что хотите удалить свой отклик?')) {
                      onDeleteOrder(order.id);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Icon name="Trash2" className="h-4 w-4" />
                </Button>
              )}
            </>
          ) : order.status === 'accepted' ? (
            <div className="flex gap-2 w-full">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenChat(order);
                }}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                <Icon name="FileText" className="mr-1.5 h-4 w-4" />
                {isSeller ? 'Детали заказа' : 'Детали заказа'}
              </Button>
              {onCompleteOrder && !isSeller && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCompleteOrder(order.id);
                  }}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Icon name="CheckCircle" className="mr-1.5 h-4 w-4" />
                  Завершить
                </Button>
              )}
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