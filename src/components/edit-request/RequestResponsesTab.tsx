import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface ResponseOrder {
  id: string;
  sellerName?: string;
  buyerName?: string;
  status: string;
  totalAmount?: number;
  counterTotalAmount?: number;
  transportPrice?: number;
}

interface RequestResponsesTabProps {
  orders: ResponseOrder[];
}

export default function RequestResponsesTab({ orders }: RequestResponsesTabProps) {
  const navigate = useNavigate();

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Icon name="Send" className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Пока нет откликов</h3>
          <p className="text-muted-foreground">
            Отклики от исполнителей появятся здесь
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleViewOrder = (order: ResponseOrder) => {
    navigate('/my-orders');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openOrderChat', {
        detail: { orderId: order.id, tab: 'seller' }
      }));
    }, 500);
  };

  const statusLabel: Record<string, string> = {
    pending: 'Новый',
    accepted: 'Принят',
    rejected: 'Отклонён',
    completed: 'Завершён',
    cancelled: 'Отменён',
    negotiating: 'Переговоры',
  };

  const statusVariant = (status: string) => {
    if (status === 'accepted' || status === 'completed') return 'default';
    if (status === 'rejected' || status === 'cancelled') return 'destructive';
    return 'secondary';
  };

  return (
    <div className="grid gap-4">
      {orders.map((order) => {
        const amount = order.counterTotalAmount ?? order.transportPrice ?? order.totalAmount;
        return (
          <Card key={order.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Отклик №{order.id.slice(0, 8)}</h3>
                    <Badge variant={statusVariant(order.status)}>
                      {statusLabel[order.status] || order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <Icon name="User" className="inline w-3 h-3 mr-1" />
                    {order.sellerName || order.buyerName || 'Исполнитель'}
                  </p>
                  {amount != null && (
                    <p className="text-sm font-semibold text-primary">
                      {Number(amount).toLocaleString('ru-RU')} ₽
                    </p>
                  )}
                </div>
                <Button onClick={() => handleViewOrder(order)}>
                  <Icon name="MessageSquare" className="w-4 h-4 mr-2" />
                  Открыть
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
