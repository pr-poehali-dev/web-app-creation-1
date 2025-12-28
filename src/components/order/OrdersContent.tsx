import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import OrderCard from './OrderCard';
import type { Order } from '@/types/order';

interface OrdersContentProps {
  activeTab: 'buyer' | 'seller' | 'archive';
  orders: Order[];
  isLoading: boolean;
  onOpenChat: (order: Order) => void;
  onAcceptOrder: (orderId: string) => void;
}

export default function OrdersContent({
  activeTab,
  orders,
  isLoading,
  onOpenChat,
  onAcceptOrder,
}: OrdersContentProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const displayOrders = orders.filter(order => {
    if (activeTab === 'archive') {
      const isCompleted = order.status === 'completed';
      if (!isCompleted) return false;

      if (searchQuery && !order.offerTitle.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    }
    const typeMatch = activeTab === 'buyer' ? order.type === 'purchase' : order.type === 'sale';
    return typeMatch && order.status !== 'completed';
  });

  const isSeller = activeTab === 'seller';

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Загрузка заказов...</p>
        </CardContent>
      </Card>
    );
  }

  if (displayOrders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Icon name="Package" className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            {isSeller 
              ? 'У вас пока нет заказов на ваши товары' 
              : 'У вас пока нет заказов'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {activeTab === 'archive' && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Поиск по названию</label>
              <Input
                placeholder="Название товара..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayOrders.map(order => (
          <OrderCard 
            key={order.id} 
            order={order} 
            isSeller={isSeller}
            onOpenChat={onOpenChat}
            onAcceptOrder={isSeller ? onAcceptOrder : undefined}
          />
        ))}
      </div>
    </>
  );
}