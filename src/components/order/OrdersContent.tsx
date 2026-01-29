import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import OrderCard from './OrderCard';
import type { Order } from '@/types/order';

interface OrdersContentProps {
  activeTab: 'buyer' | 'seller' | 'archive';
  onTabChange: (tab: 'buyer' | 'seller' | 'archive') => void;
  orders: Order[];
  isLoading: boolean;
  onOpenChat: (order: Order) => void;
  onAcceptOrder: (orderId: string) => void;
  onCompleteOrder?: (orderId: string) => void;
}

export default function OrdersContent({
  activeTab,
  onTabChange,
  orders,
  isLoading,
  onOpenChat,
  onAcceptOrder,
  onCompleteOrder,
}: OrdersContentProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const displayOrders = orders.filter(order => {
    if (activeTab === 'archive') {
      const isArchived = order.status === 'completed' || order.status === 'cancelled';
      if (!isArchived) return false;

      // Фильтр по названию
      if (searchQuery && !order.offerTitle.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    }
    const typeMatch = activeTab === 'buyer' ? order.type === 'purchase' : order.type === 'sale';
    return typeMatch && order.status !== 'completed' && order.status !== 'cancelled';
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
              : activeTab === 'archive' 
                ? 'У вас пока нет завершенных заказов'
                : 'У вас пока нет заказов'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activeTab === 'archive' && (
        <Card>
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
            onCompleteOrder={!isSeller ? onCompleteOrder : undefined}
          />
        ))}
      </div>
    </div>
  );
}