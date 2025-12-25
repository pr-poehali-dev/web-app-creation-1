import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import { notifyOrderAccepted } from '@/utils/notifications';
import type { Order, ChatMessage } from '@/types/order';
import { ordersAPI } from '@/services/api';

export function useOrdersData(isAuthenticated: boolean, activeTab: 'buyer' | 'seller') {
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
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
    if (!isPolling || !selectedOrder) return;

    const interval = setInterval(() => {
      loadMessages(selectedOrder.id, false);
    }, 2000);

    return () => clearInterval(interval);
  }, [isPolling, selectedOrder]);

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
      
      setMessages(prevMessages => {
        const prevCount = prevMessages.length;
        const newCount = mappedMessages.length;
        
        if (newCount > prevCount && prevCount > 0) {
          playNotificationSound();
          if (!silent) {
            toast({
              title: '💬 Новое сообщение',
              description: 'Получено новое сообщение в чате заказа',
            });
          }
        }
        
        return mappedMessages;
      });
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

  const handleSendMessage = async (message: string) => {
    if (!selectedOrder || !currentUser) return;

    try {
      const senderType = selectedOrder.buyerId === currentUser.id?.toString() ? 'buyer' : 'seller';
      
      await ordersAPI.createMessage({
        orderId: selectedOrder.id,
        senderId: currentUser.id?.toString() || '',
        senderType,
        message,
      });

      await loadMessages(selectedOrder.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    }
  };

  return {
    orders,
    selectedOrder,
    messages,
    isChatOpen,
    isLoading,
    currentUser,
    handleAcceptOrder,
    handleCounterOffer,
    handleAcceptCounter,
    handleCompleteOrder,
    handleOpenChat,
    handleCloseChat,
    handleSendMessage,
    loadOrders,
  };
}