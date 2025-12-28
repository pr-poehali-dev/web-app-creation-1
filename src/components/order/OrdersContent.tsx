import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import OrderCard from './OrderCard';
import type { Order } from '@/types/order';

interface OrdersContentProps {
  activeTab: 'buyer' | 'seller' | 'archive';
  orders: Order[];
  isLoading: boolean;
  onOpenChat: (order: Order) => void;
  onAcceptOrder: (orderId: string) => void;
  onTabChange: (tab: 'buyer' | 'seller' | 'archive') => void;
}

export default function OrdersContent({
  activeTab,
  orders,
  isLoading,
  onOpenChat,
  onAcceptOrder,
  onTabChange,
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

  const buyerOrders = orders.filter(o => o.type === 'purchase' && o.status !== 'completed');
  const sellerOrders = orders.filter(o => o.type === 'sale' && o.status !== 'completed');
  const archiveOrders = orders.filter(o => o.status === 'completed');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Загрузка заказов...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as 'buyer' | 'seller' | 'archive')} className="mb-6">
      <TabsList className="grid w-full max-w-md grid-cols-3 gap-2 mb-6 h-auto p-1">
        <TabsTrigger value="buyer" className="py-2.5">
          Я покупатель ({buyerOrders.length})
        </TabsTrigger>
        <TabsTrigger value="seller" className="py-2.5">
          Я продавец ({sellerOrders.length})
        </TabsTrigger>
        <TabsTrigger value="archive" className="py-2.5">
          Архив ({archiveOrders.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="buyer">
        {displayOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Icon name="Package" className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">У вас пока нет заказов</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                isSeller={false}
                onOpenChat={onOpenChat}
                onAcceptOrder={undefined}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="seller">
        {displayOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Icon name="Package" className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">У вас пока нет заказов на ваши товары</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                isSeller={true}
                onOpenChat={onOpenChat}
                onAcceptOrder={onAcceptOrder}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="archive">
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
        {displayOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Icon name="Package" className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Архив пуст</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                isSeller={isSeller}
                onOpenChat={onOpenChat}
                onAcceptOrder={undefined}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}