import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import OrderCard from './OrderCard';
import type { Order } from '@/types/order';

interface OrdersContentProps {
  activeTab: 'buyer' | 'seller';
  onTabChange: (tab: 'buyer' | 'seller') => void;
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
  const displayOrders = orders.filter(order => 
    activeTab === 'buyer' ? order.type === 'purchase' : order.type === 'sale'
  );

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
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as 'buyer' | 'seller')}>
      <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 h-auto p-1 bg-muted/50">
        <TabsTrigger 
          value="buyer"
          className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:border-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-lg transition-all py-3 font-semibold"
        >
          Я покупатель ({displayOrders.length})
        </TabsTrigger>
        <TabsTrigger 
          value="seller"
          className="data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:border-2 data-[state=active]:border-green-600 data-[state=active]:shadow-lg transition-all py-3 font-semibold"
        >
          Я продавец ({displayOrders.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="buyer" className="space-y-4">
        {renderContent(false)}
      </TabsContent>

      <TabsContent value="seller" className="space-y-4">
        {renderContent(true)}
      </TabsContent>
    </Tabs>
  );
}