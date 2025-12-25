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
}

export default function OrderCard({ order, isSeller, onOpenChat, onAcceptOrder }: OrderCardProps) {
  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'new':
        return <Badge variant="outline" className="bg-blue-50">Новый</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50">Ожидает</Badge>;
      case 'negotiating':
        return <Badge variant="outline" className="bg-orange-50">Торг</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50">Принят</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50">Отклонен</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-gray-200 text-gray-700 border-gray-400">Завершён</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg line-clamp-2">{order.offerTitle}</h3>
          {getStatusBadge(order.status)}
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
          <div>
            <p className="text-muted-foreground">Доставка</p>
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
        </div>

        {order.comment && (
          <div className="text-sm">
            <p className="text-muted-foreground">Комментарий</p>
            <p className="text-sm mt-1">{order.comment}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={() => onOpenChat(order)}
            variant={order.status === 'completed' ? 'secondary' : 'outline'}
            className="flex-1"
            size="sm"
          >
            <Icon name="MessageSquare" className="mr-1.5 h-4 w-4" />
            {order.status === 'completed' ? 'Завершён' : 'Чат'}
          </Button>
          {isSeller && (order.status === 'new' || order.status === 'pending') && onAcceptOrder && (
            <Button
              onClick={() => onAcceptOrder(order.id)}
              className="flex-1"
              size="sm"
            >
              <Icon name="Check" className="mr-1.5 h-4 w-4" />
              Принять заказ
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}