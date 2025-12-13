import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { Order } from '@/types/order';

interface OfferOrdersTabProps {
  orders: Order[];
  onOpenChat: (order: Order) => void;
}

export default function OfferOrdersTab({ orders, onOpenChat }: OfferOrdersTabProps) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Icon name="ShoppingCart" className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Пока нет заказов</h3>
          <p className="text-muted-foreground">
            Заказы по этому объявлению будут отображаться здесь
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {orders.map((order) => (
        <Card key={order.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Заказ №{order.id.slice(0, 8)}</h3>
                  <Badge variant={
                    order.status === 'completed' ? 'default' :
                    order.status === 'rejected' ? 'destructive' :
                    order.status === 'accepted' ? 'default' :
                    'secondary'
                  }>
                    {order.status === 'pending' ? 'Ожидает' :
                     order.status === 'accepted' ? 'Принят' :
                     order.status === 'rejected' ? 'Отклонен' :
                     order.status === 'completed' ? 'Завершён' :
                     order.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  <Icon name="User" className="inline w-3 h-3 mr-1" />
                  {order.buyerName || 'Покупатель'}
                </p>
                <p className="text-sm font-semibold text-primary">
                  {order.totalAmount?.toLocaleString('ru-RU') || 0} ₽
                </p>
              </div>
              <Button onClick={() => onOpenChat(order)}>
                <Icon name="MessageSquare" className="w-4 h-4 mr-2" />
                Открыть чат
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
