import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { Order } from '@/types/order';

interface AdminOrdersListProps {
  orders: Order[];
  isLoading: boolean;
  searchQuery: string;
  statusFilter: string;
  onArchiveClick: (order: Order) => void;
}

function getStatusBadge(status: Order['status']) {
  switch (status) {
    case 'new':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700">Новый</Badge>;
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Ожидает</Badge>;
    case 'negotiating':
      return <Badge variant="outline" className="bg-orange-50 text-orange-700">Переговоры</Badge>;
    case 'accepted':
      return <Badge variant="outline" className="bg-green-50 text-green-700">В работе</Badge>;
    case 'awaiting_payment':
      return <Badge variant="outline" className="bg-purple-50 text-purple-700">В работе (ожидает оплаты)</Badge>;
    case 'completed':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700">Завершен</Badge>;
    case 'rejected':
      return <Badge variant="outline" className="bg-red-50 text-red-700">Отклонен</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="bg-red-50 text-red-600">Отменен</Badge>;
    case 'archived':
      return <Badge variant="outline" className="text-slate-500">Архив</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function AdminOrdersList({
  orders,
  isLoading,
  searchQuery,
  statusFilter,
  onArchiveClick,
}: AdminOrdersListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Icon name="Loader2" className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Загрузка заказов...</p>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Icon name="ShoppingCart" className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== 'all'
              ? 'Заказы не найдены'
              : 'Заказов пока нет'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex gap-4">
              {order.offerImage && (
                <img
                  src={order.offerImage}
                  alt={order.offerTitle}
                  className="w-24 h-24 object-cover rounded-md flex-shrink-0"
                />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{order.offerTitle}</h3>
                    <p className="text-sm text-muted-foreground">
                      ID: {order.id.slice(0, 8)} • {order.createdAt.toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Количество</p>
                    <p className="font-medium">{order.quantity} {order.unit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Сумма</p>
                    <p className="font-bold text-primary">
                      {order.totalAmount?.toLocaleString('ru-RU') || '0'} ₽
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Покупатель</p>
                    <p className="font-medium truncate">{order.buyerName}</p>
                    <p className="text-xs text-muted-foreground">{order.buyerPhone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Продавец</p>
                    <p className="font-medium truncate">{order.sellerName}</p>
                    <p className="text-xs text-muted-foreground">{order.sellerPhone}</p>
                  </div>
                </div>

                {order.buyerCompany && (
                  <div className="mt-2 text-sm">
                    <p className="text-muted-foreground">Компания покупателя</p>
                    <p className="font-medium">{order.buyerCompany} {order.buyerInn && `(ИНН: ${order.buyerInn})`}</p>
                  </div>
                )}

                {order.comment && (
                  <div className="mt-2 text-sm">
                    <p className="text-muted-foreground">Комментарий</p>
                    <p className="mt-1">{order.comment}</p>
                  </div>
                )}

                {(order as unknown as Record<string, unknown>).admin_archive_reason && (
                  <div className="mt-2 text-sm p-2 bg-orange-50 border border-orange-200 rounded">
                    <p className="text-orange-700 font-medium">Архивирован администратором</p>
                    <p className="text-orange-600 mt-1">{(order as unknown as Record<string, unknown>).admin_archive_reason as string}</p>
                  </div>
                )}

                {order.status !== 'archived' && order.status !== 'completed' && (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-orange-300 text-orange-600 hover:bg-orange-50"
                      onClick={() => onArchiveClick(order)}
                    >
                      <Icon name="Archive" className="w-4 h-4 mr-1" />
                      В архив
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
