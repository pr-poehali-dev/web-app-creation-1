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
import { notifyOrderAccepted, notifyNewMessage } from '@/utils/notifications';
import type { Order, ChatMessage } from '@/types/order';
import { ordersAPI } from '@/services/api';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  
  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSyAzvLZiTYIG2m98OScTgwNUrDo7beHHwU0j9zvyoEuBiV5yPLajkILEmG56+qnVxEKQ5zf8sFuJAUqfsvy14w6BxpnvfDtnjELDlCx6O+8hSMFMpDe7s+FOAYjdsjw3I9BCRFft+jrp1YRCkSc4PKzbSQFKXzM8teNOgcZZr7w7p4yCw5Psejtu4QkBTGQ3u/PhToGInXI8NyPQQkQX7bn7KlYEglEnN/ys2wlBSl8zPLXjToHGGa+8O6dMQwOT7Ho7buEJAUykN7uz4U6BiJ1yPDcj0EJD1+36+uoWBIJQ53g8rNsJQUpfM3y1404Bhlmv/DvnTEMDk+y6O27gyMFMpHe78+FOQYidc3w3I9BCQ9ftuvqqFYSCUOd4PKzbCUFKX3M8teNOQYZZr/w7pwxCw5Psuvrvo4iBS+Q3u/PhTkGInXO8NyQQQkPXrjr6qhVFAlEnuDys2wlBSh8zfLXjDkGGWe/8O+cMgsOTrPr7L+OIgUukN7wz4U6BiJ1zvDckEEJD1647OqnVRQJRJ7g8rNtJQUofM7y1404BhlozfHvmzALDk6068+/jSIFLZHe8c+FOgcjd87w3ZFBCg9eue3qplURCUSe4fK0bCQEJ33N8teMOAYZaM/x7pswCw5Oteve0LyQIgQrj9/xz4Y6ByR31PDelUEKEF+57OmmUxIIRKDh8rVsJAQnfs3y14o4BRZpz/HtmC4KDU607tCzjh8DHpDf8c+FOwgkedfx35ZACxFgsO3qpFIRB0Oh4vKybSMEJn7N89aLOAUVaM/x75gvCg1NvO7Rro8dAxyP3/LPhjsIJHnV8t+WQQsQYbDv66VUEgdDo+Lzs20kBCV+z/PXizcFFWfQ8u+ZMAoOTr/u07eQHwMbj+Dyz4c6CSN419TemkILEGKw8OylVBMHQ6Th8rJvJQQkftHy14s2BRRo0fPvmzIKDk+/7tO5kR8CGY/h89CIOggid9bz3ptCDBBjsvHtplQTB0Ol4/O0bSQEJH/S8tiMNgURZ9Hy8JwyDA9OwO7Uv5EhAxmP4fTRiTsIIXfY89+cQwwQY7Py7qZWEwZBp+TztW4lAyJ/0/LZjDYFEGfS8vGcMw0OT8Hu1cGSIgMYj+P00Io7CSB21/TfnEQNDmO08u6mVxMGQKnl87ZuJgIhftXz2Y0zBQ5m0/LynDUMDlDB79XBkiIDFo/j9dCLOwkhd9f035xGDQ1jtvPvp1gTBj+p5/O3cCcCH33W89qOMwcNZdPy8p02DA9Qw+/Ww5IkAxSN5PXRjDwJIXfZ8+CdRg0MZLb08KdZEwU+qun0uHEoAh191/Tbjjsj6sD5+GfJMKAAAAASUVORK5CYII=');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadOrders();
  }, [isAuthenticated, navigate, activeTab]);

  useEffect(() => {
    const handleOpenOrderChat = async (event: CustomEvent) => {
      const { orderId, tab } = event.detail;
      
      if (tab && tab !== activeTab) {
        setActiveTab(tab);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      let order = orders.find(o => o.id === orderId);
      
      if (!order) {
        await loadOrders();
        await new Promise(resolve => setTimeout(resolve, 200));
        order = orders.find(o => o.id === orderId);
      }
      
      if (order) {
        handleOpenChat(order);
      }
    };

    window.addEventListener('openOrderChat' as any, handleOpenOrderChat);
    return () => window.removeEventListener('openOrderChat' as any, handleOpenOrderChat);
  }, [orders, activeTab]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const orderType = activeTab === 'buyer' ? 'purchase' : 'sale';
      const response = await ordersAPI.getAll(orderType);
      
      const mappedOrders = response.orders.map((order: any) => ({
        id: order.id,
        offerId: order.offer_id,
        offerTitle: order.offer_title || order.title,
        offerImage: order.offer_image ? (typeof order.offer_image === 'string' ? JSON.parse(order.offer_image)[0]?.url : order.offer_image[0]?.url) : undefined,
        quantity: order.quantity,
        unit: order.unit,
        pricePerUnit: order.price_per_unit || order.pricePerUnit,
        totalAmount: order.total_amount || order.totalAmount,
        counterPricePerUnit: order.counter_price_per_unit || order.counterPricePerUnit,
        counterTotalAmount: order.counter_total_amount || order.counterTotalAmount,
        counterOfferMessage: order.counter_offer_message || order.counterOfferMessage,
        counterOfferedAt: order.counter_offered_at || order.counterOfferedAt ? new Date(order.counter_offered_at || order.counterOfferedAt) : undefined,
        buyerAcceptedCounter: order.buyer_accepted_counter || order.buyerAcceptedCounter,
        buyerId: order.buyer_id?.toString() || order.buyerId,
        buyerName: order.buyer_name || order.buyerName || order.buyer_full_name,
        buyerPhone: order.buyer_phone || order.buyerPhone,
        buyerEmail: order.buyer_email || order.buyerEmail,
        sellerId: order.seller_id?.toString() || order.sellerId,
        sellerName: order.seller_name || order.sellerName || order.seller_full_name,
        sellerPhone: order.seller_phone || order.sellerPhone,
        sellerEmail: order.seller_email || order.sellerEmail,
        status: order.status,
        deliveryType: order.delivery_type || order.deliveryType || 'delivery',
        comment: order.comment,
        type: order.type,
        createdAt: new Date(order.createdAt || order.created_at),
        acceptedAt: order.acceptedAt || order.accepted_at ? new Date(order.acceptedAt || order.accepted_at) : undefined,
      }));
      
      setOrders(mappedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить заказы',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (orderId: string, silent = false) => {
    try {
      const data = await ordersAPI.getMessagesByOrder(orderId);
      
      const mappedMessages: ChatMessage[] = data.messages.map((msg: any) => ({
        id: msg.id,
        orderId: msg.order_id || msg.orderId,
        senderId: msg.sender_id?.toString() || msg.senderId,
        senderName: msg.sender_name || msg.senderName || 'Пользователь',
        message: msg.message,
        timestamp: new Date(msg.createdAt || msg.created_at),
        isRead: msg.is_read || msg.isRead || false,
      }));
      
      const prevCount = messages.length;
      const newCount = mappedMessages.length;
      
      setMessages(mappedMessages);
      
      if (!silent && newCount > prevCount && prevCount > 0) {
        playNotificationSound();
        toast({
          title: '💬 Новое сообщение',
          description: 'Получено новое сообщение в чате заказа',
        });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      if (!silent) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить сообщения',
          variant: 'destructive',
        });
      }
    }
  };

  const handleAcceptOrder = async (orderId?: string) => {
    const orderToAccept = orderId || selectedOrder?.id;
    if (!orderToAccept) return;

    try {
      await ordersAPI.updateOrder(orderToAccept, { status: 'accepted' });
      
      const order = orders.find(o => o.id === orderToAccept);
      if (order) {
        notifyOrderAccepted(
          order.buyerId,
          order.sellerName,
          order.offerTitle,
          order.id
        );
      }

      toast({
        title: 'Заказ принят',
        description: 'Заказ успешно принят в работу. Остаток товара обновлен.',
      });

      setIsChatOpen(false);
      await loadOrders();
    } catch (error: any) {
      console.error('Error accepting order:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось принять заказ',
        variant: 'destructive',
      });
    }
  };

  const handleCounterOffer = async (price: number, message: string) => {
    if (!selectedOrder) return;

    try {
      await ordersAPI.updateOrder(selectedOrder.id, { 
        counterPrice: price,
        counterMessage: message 
      });

      toast({
        title: 'Встречное предложение отправлено',
        description: 'Покупатель получит уведомление',
      });

      await loadOrders();
      await loadMessages(selectedOrder.id);
    } catch (error) {
      console.error('Error sending counter offer:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить встречное предложение',
        variant: 'destructive',
      });
    }
  };

  const handleAcceptCounter = async () => {
    if (!selectedOrder) return;

    try {
      await ordersAPI.updateOrder(selectedOrder.id, { acceptCounter: true });

      toast({
        title: 'Встречное предложение принято',
        description: 'Продавец получит уведомление',
      });

      setIsChatOpen(false);
      await loadOrders();
    } catch (error) {
      console.error('Error accepting counter offer:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось принять встречное предложение',
        variant: 'destructive',
      });
    }
  };

  const handleCompleteOrder = async () => {
    if (!selectedOrder) return;

    try {
      await ordersAPI.updateOrder(selectedOrder.id, { status: 'completed' });

      toast({
        title: 'Заказ завершён',
        description: 'Заказ успешно завершён. Спасибо за работу!',
      });

      setIsChatOpen(false);
      await loadOrders();
    } catch (error) {
      console.error('Error completing order:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось завершить заказ',
        variant: 'destructive',
      });
    }
  };

  const handleOpenChat = (order: Order) => {
    setSelectedOrder(order);
    loadMessages(order.id);
    setIsChatOpen(true);
    setIsPolling(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setIsPolling(false);
    setSelectedOrder(null);
    setMessages([]);
  };

  useEffect(() => {
    if (!isPolling || !selectedOrder) return;

    const interval = setInterval(() => {
      loadMessages(selectedOrder.id, true);
    }, 3000);

    return () => clearInterval(interval);
  }, [isPolling, selectedOrder]);

  const handleSendMessage = async (message: string) => {
    if (!selectedOrder || !currentUser) return;

    try {
      const senderType = selectedOrder.buyerId === currentUser.id?.toString() ? 'buyer' : 'seller';
      
      await ordersAPI.createMessage({
        orderId: selectedOrder.id,
        senderId: currentUser.id || 0,
        senderType,
        message,
      });

      await loadMessages(selectedOrder.id);

      const recipientId = selectedOrder.buyerId === currentUser.id?.toString() 
        ? selectedOrder.sellerId 
        : selectedOrder.buyerId;

      notifyNewMessage(
        recipientId,
        `${currentUser.firstName} ${currentUser.lastName}`,
        message,
        selectedOrder.id
      );

      toast({
        title: 'Сообщение отправлено',
        description: 'Ваше сообщение успешно отправлено',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    }
  };

  const displayOrders = orders;

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'new':
        return <Badge variant="outline" className="bg-blue-50">Новый</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50">Ожидает</Badge>;
      case 'negotiating':
        return <Badge variant="outline" className="bg-orange-50">Торг</Badge>;
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
            <p className="font-bold text-primary">{order.totalAmount?.toLocaleString('ru-RU') || '0'} ₽</p>
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
              {isSeller ? order.buyerName : (order.sellerName || 'Продавец')}
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
          {isSeller && (order.status === 'new' || order.status === 'pending') && (
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
              Я покупатель ({displayOrders.length})
            </TabsTrigger>
            <TabsTrigger value="seller">
              Я продавец ({displayOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buyer" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Загрузка заказов...</p>
                </CardContent>
              </Card>
            ) : displayOrders.length === 0 ? (
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
                {displayOrders.map(order => (
                  <OrderCard key={order.id} order={order} isSeller={false} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="seller" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Загрузка заказов...</p>
                </CardContent>
              </Card>
            ) : displayOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Icon name="Package" className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">У вас пока нет заказов на ваши товары</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayOrders.map(order => (
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
          onClose={handleCloseChat}
          order={selectedOrder}
          messages={messages}
          onSendMessage={handleSendMessage}
          onAcceptOrder={() => handleAcceptOrder()}
          onCounterOffer={handleCounterOffer}
          onAcceptCounter={handleAcceptCounter}
          onCompleteOrder={handleCompleteOrder}
        />
      )}
    </div>
  );
}