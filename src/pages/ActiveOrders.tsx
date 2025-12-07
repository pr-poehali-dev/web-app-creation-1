import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { getSession } from '@/utils/auth';
import { useDistrict } from '@/contexts/DistrictContext';
import { ordersAPI, type Order } from '@/services/api';

interface ActiveOrdersProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

type OrderStatus = 'new' | 'processing' | 'shipping' | 'completed' | 'cancelled';
type OrderType = 'purchase' | 'sale';

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Новый',
  processing: 'В обработке',
  shipping: 'Доставляется',
  completed: 'Завершен',
  cancelled: 'Отменен',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  new: 'bg-blue-500',
  processing: 'bg-orange-500',
  shipping: 'bg-purple-500',
  completed: 'bg-green-500',
  cancelled: 'bg-gray-500',
};



export default function ActiveOrders({ isAuthenticated, onLogout }: ActiveOrdersProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const { districts } = useDistrict();
  const currentUser = getSession();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'purchase' | 'sale'>('all');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }

    loadOrders();
  }, [isAuthenticated, currentUser, navigate, activeTab, statusFilter]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      
      if (activeTab !== 'all') {
        params.type = activeTab;
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const data = await ordersAPI.getUserOrders(params);
      setOrders(data.orders);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = orders
    .filter(order => activeTab === 'all' || order.type === activeTab)
    .filter(order => statusFilter === 'all' || order.status === statusFilter);

  const getOrderStats = () => {
    return {
      total: orders.length,
      purchase: orders.filter(o => o.type === 'purchase').length,
      sale: orders.filter(o => o.type === 'sale').length,
      new: orders.filter(o => o.status === 'new').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipping: orders.filter(o => o.status === 'shipping').length,
    };
  };

  const stats = getOrderStats();

  const OrderCard = ({ order }: { order: Order }) => {
    const districtName = districts.find(d => d.id === order.district)?.name;

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={order.type === 'purchase' ? 'default' : 'secondary'}>
                  {order.type === 'purchase' ? (
                    <>
                      <Icon name="ShoppingCart" className="h-3 w-3 mr-1" />
                      Покупка
                    </>
                  ) : (
                    <>
                      <Icon name="Package" className="h-3 w-3 mr-1" />
                      Продажа
                    </>
                  )}
                </Badge>
                <Badge className={STATUS_COLORS[order.status]}>
                  {STATUS_LABELS[order.status]}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg">{order.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {order.type === 'purchase' ? 'Продавец' : 'Покупатель'}: {order.counterparty}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between pb-2 border-b">
              <span className="text-muted-foreground">Сумма заказа:</span>
              <span className="font-bold text-lg text-primary">
                {order.totalAmount.toLocaleString()} ₽
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Количество:</span>
              <span className="font-medium">
                {order.quantity} {order.unit}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Дата заказа:</span>
              <span className="font-medium">
                {new Date(order.orderDate).toLocaleDateString('ru-RU')}
              </span>
            </div>
            {order.deliveryDate && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Дата доставки:</span>
                <span className="font-medium">
                  {new Date(order.deliveryDate).toLocaleDateString('ru-RU')}
                </span>
              </div>
            )}
            {order.trackingNumber && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Трек-номер:</span>
                <span className="font-mono text-sm font-medium">
                  {order.trackingNumber}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Район:</span>
              <span className="font-medium flex items-center gap-1">
                <Icon name="MapPin" className="h-3 w-3" />
                {districtName}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => navigate(`/order/${order.id}`)}
            >
              <Icon name="Eye" className="mr-2 h-4 w-4" />
              Детали
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
            Назад
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Мои заказы</h1>
          <p className="text-muted-foreground mt-1">
            Отслеживание покупок и продаж
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
            onClick={() => { setActiveTab('all'); setStatusFilter('all'); }}
          >
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary">{stats.total}</div>
              <p className="text-sm text-muted-foreground mt-1">Всего</p>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
            onClick={() => { setActiveTab('purchase'); setStatusFilter('all'); }}
          >
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-blue-500">{stats.purchase}</div>
              <p className="text-sm text-muted-foreground mt-1">Покупок</p>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
            onClick={() => { setActiveTab('sale'); setStatusFilter('all'); }}
          >
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-green-500">{stats.sale}</div>
              <p className="text-sm text-muted-foreground mt-1">Продаж</p>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
            onClick={() => setStatusFilter('new')}
          >
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-blue-400">{stats.new}</div>
              <p className="text-sm text-muted-foreground mt-1">Новых</p>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
            onClick={() => setStatusFilter('processing')}
          >
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-orange-500">{stats.processing}</div>
              <p className="text-sm text-muted-foreground mt-1">В обработке</p>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
            onClick={() => setStatusFilter('shipping')}
          >
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-purple-500">{stats.shipping}</div>
              <p className="text-sm text-muted-foreground mt-1">Доставка</p>
            </CardContent>
          </Card>
        </div>

        {statusFilter !== 'all' && (
          <div className="flex items-center gap-2 bg-muted/50 p-3 rounded-lg mb-4">
            <Icon name="Filter" className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Фильтр:</span>
            <Badge className={STATUS_COLORS[statusFilter as OrderStatus]}>
              {STATUS_LABELS[statusFilter as OrderStatus]}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setStatusFilter('all')}
              className="ml-auto h-7"
            >
              <Icon name="X" className="h-3 w-3" />
            </Button>
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as typeof activeTab); setStatusFilter('all'); }} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">
              Все заказы
            </TabsTrigger>
            <TabsTrigger value="purchase">
              <Icon name="ShoppingCart" className="h-4 w-4 mr-2" />
              Покупки
            </TabsTrigger>
            <TabsTrigger value="sale">
              <Icon name="Package" className="h-4 w-4 mr-2" />
              Продажи
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="h-80 animate-pulse bg-muted" />
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-20">
                <Icon name="ShoppingCart" className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-2">Нет активных заказов</h3>
                <p className="text-muted-foreground mb-8">
                  Здесь будут отображаться ваши покупки и продажи
                </p>
                <Button onClick={() => navigate('/')}>
                  <Icon name="Home" className="mr-2 h-4 w-4" />
                  На главную
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Показано: <span className="font-semibold text-foreground">{filteredOrders.length}</span> заказов
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}