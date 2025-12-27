import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
}

export default function OrdersContent({
  activeTab,
  onTabChange,
  orders,
  isLoading,
  onOpenChat,
  onAcceptOrder,
}: OrdersContentProps) {
  const displayOrders = orders.filter(order => {
    if (activeTab === 'archive') {
      return order.status === 'completed';
    }
    const typeMatch = activeTab === 'buyer' ? order.type === 'purchase' : order.type === 'sale';
    return typeMatch && order.status !== 'completed';
  });

  // Считаем количество заказов для каждого типа отдельно
  const buyerOrdersCount = orders.filter(order => order.type === 'purchase' && order.status !== 'completed').length;
  const sellerOrdersCount = orders.filter(order => order.type === 'sale' && order.status !== 'completed').length;
  const archiveOrdersCount = orders.filter(order => order.status === 'completed').length;

  const renderContent = (isSeller: boolean) => {
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
    );
  };

  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as 'buyer' | 'seller' | 'archive')}>
      <TabsList className="grid w-full max-w-3xl grid-cols-3 gap-1.5 mb-6 h-auto p-0 bg-transparent">
        <TabsTrigger 
          value="buyer"
          className="border-2 border-green-600 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-green-600 transition-all py-2 px-2 text-xs font-medium rounded-md whitespace-nowrap"
        >
          Я покупатель ({buyerOrdersCount})
        </TabsTrigger>
        <TabsTrigger 
          value="seller"
          className="border-2 border-red-600 data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-red-600 transition-all py-2 px-2 text-xs font-medium rounded-md whitespace-nowrap"
        >
          Я продавец ({sellerOrdersCount})
        </TabsTrigger>
        <TabsTrigger 
          value="archive"
          className="border-2 border-gray-600 data-[state=active]:bg-gray-500 data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-gray-600 transition-all py-2 px-2 text-xs font-medium rounded-md whitespace-nowrap"
        >
          Архив ({archiveOrdersCount})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="buyer" className="space-y-4">
        {renderContent(false)}
      </TabsContent>

      <TabsContent value="seller" className="space-y-4">
        {renderContent(true)}
      </TabsContent>

      <TabsContent value="archive" className="space-y-4">
        {renderContent(false)}
      </TabsContent>
    </Tabs>
  );
}