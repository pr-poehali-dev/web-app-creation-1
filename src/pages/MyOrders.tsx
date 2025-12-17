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

  const loadMessages = async (orderId: string) => {
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
      
      setMessages(mappedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить сообщения',
        variant: 'destructive',
      });
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await ordersAPI.updateOrder(orderId, { status: 'accepted' });
      
      const order = orders.find(o => o.id === orderId);
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
        description: 'Заказ успешно принят в работу',
      });

      await loadOrders();
    } catch (error) {
      console.error('Error accepting order:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось принять заказ',
        variant: 'destructive',
      });
    }
  };

  const handleOpenChat = (order: Order) => {
    setSelectedOrder(order);
    loadMessages(order.id);
    setIsChatOpen(true);
  };

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
          onClose={() => setIsChatOpen(false)}
          order={selectedOrder}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
      )}
    </div>
  );
}