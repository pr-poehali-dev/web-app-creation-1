import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import OrderCard from './OrderCard';
import type { Order } from '@/types/order';
import type { OrderTab } from '@/hooks/useOrdersData';

interface OrdersContentProps {
  activeTab: OrderTab;
  onTabChange: (tab: OrderTab) => void;
  orders: Order[];
  isLoading: boolean;
  onOpenChat: (order: Order) => void;
  onAcceptOrder: (orderId: string) => void;
  onCompleteOrder?: (orderId: string) => void;
  onDeleteOrder?: (orderId: string) => void;
}

export default function OrdersContent({
  activeTab,
  onTabChange,
  orders,
  isLoading,
  onOpenChat,
  onAcceptOrder,
  onCompleteOrder,
  onDeleteOrder,
}: OrdersContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [exitingOrderIds, setExitingOrderIds] = useState<Set<string>>(new Set());
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const isFirstRenderRef = useRef(true);
  const wasLoadingRef = useRef(false);

  useEffect(() => {
    if (isLoading) {
      wasLoadingRef.current = true;
    } else if (wasLoadingRef.current) {
      wasLoadingRef.current = false;
      isFirstRenderRef.current = true;
      prevOrderIdsRef.current = new Set();
    }
  }, [isLoading]);

  const isOrderVisible = (order: Order) => {
    if (activeTab === 'archive') {
      return order.status === 'completed' || order.status === 'cancelled';
    }
    if (activeTab === 'my-requests') {
      return order.isRequest && order.type === 'sale' && order.status !== 'completed' && order.status !== 'cancelled';
    }
    if (activeTab === 'my-responses') {
      return order.isRequest && order.type === 'purchase' && order.status !== 'completed' && order.status !== 'cancelled';
    }
    const typeMatch = activeTab === 'buyer' ? order.type === 'purchase' : order.type === 'sale';
    return typeMatch && !order.isRequest && order.status !== 'completed' && order.status !== 'cancelled';
  };

  const visibleOrders = orders.filter(order => {
    if (!isOrderVisible(order)) return false;
    if (activeTab === 'archive' && searchQuery) {
      return order.offerTitle.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const visibleOrderIds = new Set(visibleOrders.map(o => o.id as string));
  const visibleIdsKey = Array.from(visibleOrderIds).sort().join(',');

  useEffect(() => {
    const prev = prevOrderIdsRef.current;
    const currentIds = new Set(visibleIdsKey.split(',').filter(Boolean));
    const disappeared: string[] = [];
    const appeared: string[] = [];

    prev.forEach(id => {
      if (!currentIds.has(id) && !exitingOrderIds.has(id)) {
        disappeared.push(id);
      }
    });

    if (!isFirstRenderRef.current) {
      currentIds.forEach(id => {
        if (!prev.has(id)) {
          appeared.push(id);
        }
      });
    }
    isFirstRenderRef.current = false;

    if (disappeared.length > 0) {
      setExitingOrderIds(prev => {
        const next = new Set(prev);
        disappeared.forEach(id => next.add(id));
        return next;
      });

      setTimeout(() => {
        setExitingOrderIds(prev => {
          const next = new Set(prev);
          disappeared.forEach(id => next.delete(id));
          return next;
        });
      }, 550);
    }

    if (appeared.length > 0) {
      setNewOrderIds(new Set(appeared));
      setTimeout(() => {
        setNewOrderIds(new Set());
      }, 400);
    }

    prevOrderIdsRef.current = currentIds;
  }, [visibleIdsKey]);

  const exitingOrders = orders.filter(o => exitingOrderIds.has(o.id as string) && !visibleOrderIds.has(o.id as string));

  const displayOrders = [...visibleOrders, ...exitingOrders]
    .sort((a, b) => {
      if (activeTab === 'archive') {
        const dateA = a.completedDate || a.createdAt;
        const dateB = b.completedDate || b.createdAt;
        return dateB.getTime() - dateA.getTime();
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

  const isSeller = activeTab === 'seller' || activeTab === 'my-requests';

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
            {activeTab === 'my-requests'
              ? 'Пока никто не откликнулся на ваши запросы'
              : activeTab === 'my-responses'
                ? 'Вы пока не откликались на чужие запросы'
                : isSeller 
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
            onCompleteOrder={onCompleteOrder}
            onDeleteOrder={onDeleteOrder}
            isExiting={exitingOrderIds.has(order.id as string)}
            isNew={newOrderIds.has(order.id as string)}
          />
        ))}
      </div>
    </div>
  );
}