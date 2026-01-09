import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './use-toast';
import { getSession } from '@/utils/auth';
import { notifyOrderAccepted } from '@/utils/notifications';
import type { Order } from '@/types/order';
import { ordersAPI } from '@/services/api';

export function useOrdersData(
  isAuthenticated: boolean, 
  activeTab: 'buyer' | 'seller' | 'archive',
  onTabChange?: (tab: 'buyer' | 'seller' | 'archive') => void
) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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
    loadOrders(true);

    // Автоматическое обновление каждые 30 секунд для проверки встречных предложений
    const pollInterval = setInterval(() => {
      if (!document.hidden) {
        loadOrders(false);
      }
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [isAuthenticated, navigate]);

  const loadOrders = async (showLoader = false) => {
    try {
      if (showLoader) {
        setIsLoading(true);
      }
      // Загружаем ВСЕ заказы сразу для правильного подсчета
      const response = await ordersAPI.getAll('all');
      
      const mappedOrders = response.orders.map((order: any) => ({
        id: order.id,
        orderNumber: order.order_number || order.orderNumber,
        offerId: order.offer_id,
        offerTitle: order.offer_title || order.title,
        offerImage: order.offer_image ? (typeof order.offer_image === 'string' ? JSON.parse(order.offer_image)[0]?.url : order.offer_image[0]?.url) : undefined,
        quantity: order.quantity,
        originalQuantity: order.original_quantity || order.originalQuantity,
        unit: order.unit,
        pricePerUnit: order.price_per_unit || order.pricePerUnit,
        totalAmount: order.total_amount || order.totalAmount,
        counterPricePerUnit: order.counter_price_per_unit || order.counterPricePerUnit,
        counterTotalAmount: order.counter_total_amount || order.counterTotalAmount,
        counterOfferMessage: order.counter_offer_message || order.counterOfferMessage,
        counterOfferedAt: order.counter_offered_at || order.counterOfferedAt ? new Date(order.counter_offered_at || order.counterOfferedAt) : undefined,
        counterOfferedBy: order.counter_offered_by || order.counterOfferedBy,
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
        completedDate: order.completedDate || order.completed_date ? new Date(order.completedDate || order.completed_date) : undefined,
        cancelledBy: order.cancelled_by || order.cancelledBy,
        cancellationReason: order.cancellation_reason || order.cancellationReason,
        buyerCompany: order.buyer_company || order.buyerCompany,
        buyerInn: order.buyer_inn || order.buyerInn,
      }));
      
      // Проверяем новые встречные предложения для звукового уведомления
      if (!isInitialLoad && orders.length > 0) {
        const currentUserId = currentUser?.id?.toString();
        
        mappedOrders.forEach((newOrder: Order) => {
          const oldOrder = orders.find(o => o.id === newOrder.id);
          
          // Если появилось новое встречное предложение от другой стороны
          if (newOrder.counterPricePerUnit && 
              (!oldOrder?.counterPricePerUnit || oldOrder.counterOfferedAt !== newOrder.counterOfferedAt)) {
            
            // Проверяем что это предложение для текущего пользователя
            const isForMe = (
              (newOrder.counterOfferedBy === 'seller' && currentUserId === newOrder.buyerId) ||
              (newOrder.counterOfferedBy === 'buyer' && currentUserId === newOrder.sellerId)
            );
            
            if (isForMe) {
              playNotificationSound();
              toast({
                title: '💰 Новое встречное предложение',
                description: `Заказ #${newOrder.orderNumber || newOrder.id.slice(0, 8)} - ${newOrder.counterPricePerUnit.toLocaleString('ru-RU')} ₽/${newOrder.unit}`,
                duration: 5000,
              });
            }
          }
        });
      }
      
      setOrders(mappedOrders);
      
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      if (showLoader) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить заказы',
          variant: 'destructive',
        });
      }
    } finally {
      if (showLoader) {
        setIsLoading(false);
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
      await loadOrders(false);
    } catch (error: any) {
      console.error('Error accepting order:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось принять заказ',
        variant: 'destructive',
      });
    }
  };

  const handleCounterOffer = async (price: number, message: string, quantity?: number) => {
    if (!selectedOrder) return;

    const finalQuantity = quantity ?? selectedOrder.quantity;
    console.log('[handleCounterOffer] Called with:', { price, message, quantity: finalQuantity, orderId: selectedOrder.id });

    try {
      const currentUser = getSession();
      const isSeller = currentUser?.id?.toString() === selectedOrder.sellerId;
      
      console.log('[handleCounterOffer] Sending to API:', { 
        orderId: selectedOrder.id,
        counterPrice: price,
        counterQuantity: finalQuantity,
        counterMessage: message,
        isSeller
      });

      await ordersAPI.updateOrder(selectedOrder.id, { 
        counterPrice: price,
        counterQuantity: finalQuantity,
        counterMessage: message 
      });

      console.log('[handleCounterOffer] API call successful');

      // Мгновенно обновляем данные локально для быстрого отклика
      setSelectedOrder({
        ...selectedOrder,
        status: 'negotiating',
        quantity: finalQuantity,
        counterPricePerUnit: price,
        counterTotalAmount: price * finalQuantity,
        counterOfferedBy: isSeller ? 'seller' : 'buyer',
        counterOfferMessage: message,
        counterOfferedAt: new Date(),
      });

      toast({
        title: 'Встречное предложение отправлено',
        description: isSeller ? 'Покупатель получит уведомление' : 'Продавец получит уведомление',
      });

      // Обновляем список заказов для синхронизации с сервером
      await loadOrders(false);
      
      // Дополнительно обновляем selectedOrder из свежих данных через 500мс
      setTimeout(() => {
        const updatedOrder = orders.find(o => o.id === selectedOrder.id);
        if (updatedOrder) {
          setSelectedOrder(updatedOrder);
        }
      }, 500);
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
      await ordersAPI.updateOrder(selectedOrder.id, { 
        acceptCounter: true,
        status: 'accepted'
      });

      // Мгновенно обновляем статус локально для быстрого отклика
      setSelectedOrder({
        ...selectedOrder,
        status: 'accepted',
        buyerAcceptedCounter: true,
        pricePerUnit: selectedOrder.counterPricePerUnit || selectedOrder.pricePerUnit,
        totalAmount: selectedOrder.counterTotalAmount || selectedOrder.totalAmount,
      });

      // Обновляем список заказов для синхронизации с сервером
      await loadOrders(false);

      toast({
        title: 'Встречное предложение принято',
        description: 'Заказ переведён в статус "Принято"',
      });
      
      // Дополнительно обновляем selectedOrder из свежих данных через 500мс
      setTimeout(() => {
        const updatedOrder = orders.find(o => o.id === selectedOrder.id);
        if (updatedOrder) {
          setSelectedOrder(updatedOrder);
        }
      }, 500);
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
      
      // Переключаем на вкладку "Архив" сразу после завершения
      if (onTabChange) {
        onTabChange('archive');
      }
      
      await loadOrders(false);
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
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setSelectedOrder(null);
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    try {
      await ordersAPI.updateOrder(selectedOrder.id, { status: 'cancelled' });

      toast({
        title: 'Заказ отменён',
        description: 'Заказ успешно отменён',
      });

      setIsChatOpen(false);
      await loadOrders(false);
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отменить заказ',
        variant: 'destructive',
      });
    }
  };

  return {
    orders,
    selectedOrder,
    isChatOpen,
    isLoading,
    currentUser,
    handleAcceptOrder,
    handleCounterOffer,
    handleAcceptCounter,
    handleCancelOrder,
    handleCompleteOrder,
    handleOpenChat,
    handleCloseChat,
    loadOrders,
  };
}