import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import OrderChatModal from '@/components/order/OrderChatModal';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import type { Order, ChatMessage } from '@/types/order';

interface MyOrdersProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function MyOrders({ isAuthenticated, onLogout }: MyOrdersProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>('buyer');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadOrders();
  }, [isAuthenticated, navigate]);

  const loadOrders = () => {
    const storedOrders = localStorage.getItem('orders');
    if (storedOrders) {
      const parsedOrders = JSON.parse(storedOrders).map((order: any) => ({
        ...order,
        createdAt: new Date(order.createdAt),
        acceptedAt: order.acceptedAt ? new Date(order.acceptedAt) : undefined,
      }));
      setOrders(parsedOrders);
    }
  };

  const loadMessages = (orderId: string) => {
    const storedMessages = localStorage.getItem(`order_messages_${orderId}`);
    if (storedMessages) {
      const parsedMessages = JSON.parse(storedMessages).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
      setMessages(parsedMessages);
    } else {
      setMessages([]);
    }
  };

  const handleAcceptOrder = (orderId: string) => {
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          status: 'accepted' as const,
          acceptedAt: new Date(),
        };
      }
      return order;
    });
    setOrders(updatedOrders);
    localStorage.setItem('orders', JSON.stringify(updatedOrders));

    const order = orders.find(o => o.id === orderId);
    if (order) {
      const storedOffers = localStorage.getItem('offers');
      if (storedOffers) {
        const offers = JSON.parse(storedOffers);
        const updatedOffers = offers.map((offer: any) => {
          if (offer.id === order.offerId) {
            return {
              ...offer,
              quantity: offer.quantity - order.quantity,
              orderedQuantity: (offer.orderedQuantity || 0) + order.quantity,
            };
          }
          return offer;
        });
        localStorage.setItem('offers', JSON.stringify(updatedOffers));
      }
    }

    toast({
      title: 'Заказ принят',
      description: 'Количество товара обновлено в вашем предложении',
    });
  };

  const handleOpenChat = (order: Order) => {
    setSelectedOrder(order);
    loadMessages(order.id);
    setIsChatOpen(true);
  };

  const handleSendMessage = (message: string) => {
    if (!selectedOrder || !currentUser) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      orderId: selectedOrder.id,
      senderId: currentUser.id?.toString() || '',
      senderName: `${currentUser.firstName} ${currentUser.lastName}`,
      message,
      timestamp: new Date(),
      isRead: false,
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    localStorage.setItem(`order_messages_${selectedOrder.id}`, JSON.stringify(updatedMessages));
  };

  const myBuyerOrders = orders.filter(order => order.buyerId === currentUser?.id?.toString());
  const mySellerOrders = orders.filter(order => order.sellerId === currentUser?.id?.toString());

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50">Ожидает</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50">Принят</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50">Отклонен</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-50">Завершен</Badge>;
      default:
        return null;
    }
  };

  const OrderCard = ({ order, isSeller }: { order: Order; isSeller: boolean }) => (
    <Card key={order.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{order.offerTitle}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Заказ #{order.id.slice(0, 8)} • {new Date(order.createdAt).toLocaleDateString('ru-RU')}
            </p>
          </div>
          {getStatusBadge(order.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {order.offerImage && (
          <img
            src={order.offerImage}
            alt={order.offerTitle}
            className="w-full h-32 object-cover rounded-md"
          />
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Количество</p>
            <p className="font-medium">{order.quantity} {order.unit}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Сумма</p>
            <p className="font-bold text-primary">{order.totalPrice.toLocaleString('ru-RU')} ₽</p>
          </div>
          <div>
            <p className="text-muted-foreground">Доставка</p>
            <p className="font-medium">
              {order.deliveryType === 'pickup' ? 'Самовывоз' : 'Доставка'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{isSeller ? 'Покупатель' : 'Продавец'}</p>
            <p className="font-medium truncate">
              {isSeller ? order.buyerName : order.sellerName}
            </p>
          </div>
        </div>

        {order.comment && (
          <div className="text-sm">
            <p className="text-muted-foreground">Комментарий</p>
            <p className="text-sm mt-1">{order.comment}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={() => handleOpenChat(order)}
            variant="outline"
            className="flex-1"
            size="sm"
          >
            <Icon name="MessageSquare" className="mr-1.5 h-4 w-4" />
            Чат
          </Button>
          {isSeller && order.status === 'pending' && (
            <Button
              onClick={() => handleAcceptOrder(order.id)}
              className="flex-1"
              size="sm"
            >
              <Icon name="Check" className="mr-1.5 h-4 w-4" />
              Принять заказ
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/20 to-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <BackButton />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Мои заказы</h1>
          <p className="text-muted-foreground">Управление заказами и общение с контрагентами</p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'buyer' | 'seller')}>
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="buyer">
              Я покупатель ({myBuyerOrders.length})
            </TabsTrigger>
            <TabsTrigger value="seller">
              Я продавец ({mySellerOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buyer" className="space-y-4">
            {myBuyerOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Icon name="ShoppingCart" className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">У вас пока нет заказов</p>
                  <Button
                    onClick={() => navigate('/offers')}
                    variant="outline"
                    className="mt-4"
                  >
                    Перейти к предложениям
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myBuyerOrders.map(order => (
                  <OrderCard key={order.id} order={order} isSeller={false} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="seller" className="space-y-4">
            {mySellerOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Icon name="Package" className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">У вас пока нет заказов на ваши товары</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {mySellerOrders.map(order => (
                  <OrderCard key={order.id} order={order} isSeller={true} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      {selectedOrder && (
        <OrderChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          order={selectedOrder}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
      )}
    </div>
  );
}
