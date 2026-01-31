import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './use-toast';
import { getSession } from '@/utils/auth';
import { notifyOrderAccepted } from '@/utils/notifications';
import type { Order } from '@/types/order';
import { ordersAPI, reviewsAPI } from '@/services/api';
import { SmartCache, checkForUpdates } from '@/utils/smartCache';
import { dataSync, notifyOrderUpdated } from '@/utils/dataSync';

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
  const [isSyncing, setIsSyncing] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [pendingReviewOrder, setPendingReviewOrder] = useState<Order | null>(null);

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
    
    // Сбрасываем данные при смене пользователя
    setOrders([]);
    setSelectedOrder(null);
    setIsChatOpen(false);
    
    loadOrders(true);

    // Подписываемся на обновления заказов
    const unsubscribe = dataSync.subscribe('order_updated', () => {
      console.log('[useOrdersData] Получено событие order_updated, обновляем заказы');
      loadOrders(false);
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, navigate, currentUser?.id]);

  // Закрываем модальное окно, если открытый заказ не принадлежит текущему пользователю
  useEffect(() => {
    if (selectedOrder && currentUser && isChatOpen) {
      const isUserInvolved = 
        String(selectedOrder.buyerId) === String(currentUser.id) ||
        String(selectedOrder.sellerId) === String(currentUser.id);
      
      if (!isUserInvolved) {
        console.log('[useOrdersData] Закрываем чужой заказ при смене пользователя');
        setSelectedOrder(null);
        setIsChatOpen(false);
      }
    }
  }, [currentUser?.id, selectedOrder, isChatOpen]);

  // Синхронизируем selectedOrder с актуальными данными из orders
  useEffect(() => {
    if (selectedOrder && isChatOpen) {
      const actualOrder = orders.find(o => o.id === selectedOrder.id);
      if (actualOrder) {
        // Проверяем, изменился ли статус или другие поля
        if (JSON.stringify(actualOrder) !== JSON.stringify(selectedOrder)) {
          console.log('[useOrdersData] Обновляем selectedOrder с актуальными данными');
          setSelectedOrder(actualOrder);
        }
      }
    }
  }, [orders, selectedOrder?.id, isChatOpen]);

  // Сбрасываем состояние при выходе из системы
  useEffect(() => {
    const handleLogout = () => {
      console.log('[useOrdersData] Пользователь вышел, сбрасываем состояние');
      setSelectedOrder(null);
      setIsChatOpen(false);
      setOrders([]);
      setPendingReviewOrder(null);
      setReviewModalOpen(false);
    };

    window.addEventListener('userLoggedOut', handleLogout);
    return () => window.removeEventListener('userLoggedOut', handleLogout);
  }, []);

  // Отмечаем заказы как просмотренные при открытии вкладки продавца
  useEffect(() => {
    if (activeTab === 'seller' && currentUser && orders.length > 0) {
      const newOrders = orders.filter(o => 
        o.status === 'new' && 
        o.type === 'sale' &&
        String(o.sellerId) === String(currentUser.id)
      );
      
      newOrders.forEach(async (order) => {
        try {
          await ordersAPI.updateOrder(order.id, { status: 'pending' });
        } catch (error) {
          console.error('Error updating order status:', error);
        }
      });
      
      if (newOrders.length > 0) {
        setTimeout(() => loadOrders(false), 500);
      }
    }
  }, [activeTab, orders.length]);

  // Вспомогательная функция для маппинга заказа
  const mapOrderData = (orderData: any): Order => ({
    id: orderData.id,
    orderNumber: orderData.order_number || orderData.orderNumber,
    offerId: orderData.offer_id,
    offerTitle: orderData.offer_title || orderData.title,
    offerImage: orderData.offer_image ? (typeof orderData.offer_image === 'string' ? JSON.parse(orderData.offer_image)[0]?.url : orderData.offer_image[0]?.url) : undefined,
    quantity: orderData.quantity,
    originalQuantity: orderData.original_quantity || orderData.originalQuantity,
    unit: orderData.unit,
    pricePerUnit: orderData.price_per_unit || orderData.pricePerUnit,
    totalAmount: orderData.total_amount || orderData.totalAmount,
    offerPricePerUnit: orderData.offerPricePerUnit,
    offerAvailableQuantity: orderData.offerAvailableQuantity,
    counterPricePerUnit: orderData.counter_price_per_unit || orderData.counterPricePerUnit,
    counterTotalAmount: orderData.counter_total_amount || orderData.counterTotalAmount,
    counterOfferMessage: orderData.counter_offer_message || orderData.counterOfferMessage,
    counterOfferedAt: orderData.counter_offered_at || orderData.counterOfferedAt ? new Date(orderData.counter_offered_at || orderData.counterOfferedAt) : undefined,
    counterOfferedBy: orderData.counter_offered_by || orderData.counterOfferedBy,
    buyerAcceptedCounter: orderData.buyer_accepted_counter || orderData.buyerAcceptedCounter,
    buyerId: orderData.buyer_id?.toString() || orderData.buyerId,
    buyerName: orderData.buyer_name || orderData.buyerName || orderData.buyer_full_name,
    buyerPhone: orderData.buyer_phone || orderData.buyerPhone,
    buyerEmail: orderData.buyer_email || orderData.buyerEmail,
    sellerId: orderData.seller_id?.toString() || orderData.sellerId,
    sellerName: orderData.seller_name || orderData.sellerName || orderData.seller_full_name,
    sellerPhone: orderData.seller_phone || orderData.sellerPhone,
    sellerEmail: orderData.seller_email || orderData.sellerEmail,
    status: orderData.status,
    deliveryType: orderData.delivery_type || orderData.deliveryType || 'delivery',
    comment: orderData.comment,
    type: orderData.type,
    createdAt: new Date(orderData.createdAt || orderData.created_at),
    acceptedAt: orderData.acceptedAt || orderData.accepted_at ? new Date(orderData.acceptedAt || orderData.accepted_at) : undefined,
    completedDate: orderData.completedDate || orderData.completed_date ? new Date(orderData.completedDate || orderData.completed_date) : undefined,
    cancelledBy: orderData.cancelled_by || orderData.cancelledBy,
    cancellationReason: orderData.cancellation_reason || orderData.cancellationReason,
    buyerCompany: orderData.buyer_company || orderData.buyerCompany,
    buyerInn: orderData.buyer_inn || orderData.buyerInn,
  });

  const loadOrders = async (showLoader = false) => {
    try {
      if (showLoader) {
        setIsLoading(true);
      } else {
        setIsSyncing(true);
      }
      
      // Таймаут для предотвращения вечной загрузки
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Превышено время ожидания')), 15000)
      );
      
      // Загружаем ВСЕ заказы сразу для правильного подсчета
      const response = await Promise.race([
        ordersAPI.getAll('all'),
        timeoutPromise
      ]) as any;
      
      const mappedOrders = response.orders.map(mapOrderData);
      
      setOrders(mappedOrders);
      
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Не удалось загрузить заказы';
      
      if (showLoader) {
        toast({
          title: 'Ошибка загрузки',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      // Устанавливаем пустой массив, чтобы не было белого экрана
      setOrders([]);
    } finally {
      if (showLoader) {
        setIsLoading(false);
      } else {
        setIsSyncing(false);
      }
    }
  };



  const handleAcceptOrder = async (orderId?: string) => {
    const orderToAccept = orderId || selectedOrder?.id;
    if (!orderToAccept) return;

    const order = orders.find(o => o.id === orderToAccept);
    if (!order) return;

    try {
      // СРАЗУ обновляем статус локально ДО отправки на сервер (optimistic update)
      const updatedOrder = {
        ...order,
        status: 'accepted' as const,
        acceptedAt: new Date(),
      };
      
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === orderToAccept ? updatedOrder : o)
      );
      
      if (selectedOrder && selectedOrder.id === orderToAccept) {
        setSelectedOrder(updatedOrder);
      }

      // Отправляем на сервер в фоне
      await ordersAPI.updateOrder(orderToAccept, { status: 'accepted' });
      
      notifyOrderAccepted(
        order.buyerId,
        order.sellerName,
        order.offerTitle,
        order.id
      );

      toast({
        title: 'Заказ принят',
        description: 'Заказ успешно принят в работу. Остаток товара обновлен.',
      });

      // notifyOrderUpdated уже триггерит обновление через событие order_updated
      notifyOrderUpdated(orderToAccept);
    } catch (error: any) {
      console.error('Error accepting order:', error);
      
      // В случае ошибки откатываем изменения
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === orderToAccept ? order : o)
      );
      
      if (selectedOrder?.id === orderToAccept) {
        setSelectedOrder(order);
      }
      
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

      toast({
        title: 'Встречное предложение отправлено',
        description: isSeller ? 'Покупатель получит уведомление' : 'Продавец получит уведомление',
      });

      notifyOrderUpdated(selectedOrder.id);
      // Обновляем список заказов для синхронизации с сервером
      await loadOrders(false);
      
      // Получаем обновлённый заказ напрямую из API и маппим его
      const updatedOrderData = await ordersAPI.getOrderById(selectedOrder.id);
      setSelectedOrder(mapOrderData(updatedOrderData));
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

    const orderId = selectedOrder.id;

    try {
      // СРАЗУ обновляем статус локально ДО отправки на сервер (optimistic update)
      const updatedOrder = {
        ...selectedOrder,
        status: 'accepted' as const,
        buyerAcceptedCounter: true,
        pricePerUnit: selectedOrder.counterPricePerUnit || selectedOrder.pricePerUnit,
        totalAmount: selectedOrder.counterTotalAmount || selectedOrder.totalAmount,
        acceptedAt: new Date(),
      };
      
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === orderId ? updatedOrder : o)
      );
      
      setSelectedOrder(updatedOrder);

      // Отправляем на сервер в фоне
      await ordersAPI.updateOrder(orderId, { 
        acceptCounter: true,
        status: 'accepted'
      });

      toast({
        title: 'Встречное предложение принято',
        description: 'Заказ переведён в статус "Принято"',
      });

      // notifyOrderUpdated уже триггерит обновление через событие order_updated
      notifyOrderUpdated(orderId);
    } catch (error) {
      console.error('Error accepting counter offer:', error);
      
      // В случае ошибки откатываем изменения
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === orderId ? selectedOrder : o)
      );
      setSelectedOrder(selectedOrder);
      
      toast({
        title: 'Ошибка',
        description: 'Не удалось принять встречное предложение',
        variant: 'destructive',
      });
    }
  };

  const handleCompleteOrder = async (orderId?: string) => {
    const orderToComplete = orderId || selectedOrder?.id;
    if (!orderToComplete) return;

    const order = orders.find(o => o.id === orderToComplete);
    if (!order) return;
    
    const isBuyer = currentUser?.id?.toString() === order?.buyerId?.toString();

    try {
      // СРАЗУ обновляем статус локально ДО отправки на сервер (optimistic update)
      const updatedOrder = {
        ...order,
        status: 'completed' as const,
        completedDate: new Date(),
      };
      
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === orderToComplete ? updatedOrder : o)
      );
      
      if (selectedOrder?.id === orderToComplete) {
        setSelectedOrder(updatedOrder);
      }

      // Отправляем на сервер в фоне
      await ordersAPI.updateOrder(orderToComplete, { status: 'completed' });

      setIsChatOpen(false);
      
      if (onTabChange) {
        onTabChange('archive');
      }
      
      // notifyOrderUpdated уже триггерит обновление через событие order_updated
      notifyOrderUpdated(orderToComplete);

      if (isBuyer) {
        setPendingReviewOrder(order);
        setReviewModalOpen(true);
      } else {
        toast({
          title: 'Заказ завершён',
          description: 'Заказ успешно завершён. Спасибо за работу!',
        });
      }
    } catch (error) {
      console.error('Error completing order:', error);
      
      // В случае ошибки откатываем изменения
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === orderToComplete ? order : o)
      );
      
      if (selectedOrder?.id === orderToComplete) {
        setSelectedOrder(order);
      }
      
      toast({
        title: 'Ошибка',
        description: 'Не удалось завершить заказ',
        variant: 'destructive',
      });
    }
  };

  const handleOpenChat = (order: Order) => {
    // Ищем самую актуальную версию заказа из списка orders
    const actualOrder = orders.find(o => o.id === order.id) || order;
    setSelectedOrder(actualOrder);
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setSelectedOrder(null);
  };

  const handleCancelOrder = async (orderId?: string, reason?: string) => {
    const orderToCancel = orderId || selectedOrder?.id;
    if (!orderToCancel) return;

    const order = orders.find(o => o.id === orderToCancel);
    if (!order) return;
    
    const cancelledBy = currentUser?.id?.toString() === order?.buyerId?.toString() ? 'buyer' : 'seller';

    try {
      // СРАЗУ обновляем локальный статус ДО отправки на сервер (optimistic update)
      const updatedOrder = {
        ...order,
        status: 'cancelled' as const,
        cancelledBy,
        cancellationReason: reason || undefined,
      };
      
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === orderToCancel ? updatedOrder : o)
      );
      
      // Обновляем selectedOrder для корректного отображения в модалке
      if (selectedOrder?.id === orderToCancel) {
        setSelectedOrder(updatedOrder);
      }
      
      // Отправляем на сервер в фоне
      await ordersAPI.updateOrder(orderToCancel, { 
        status: 'cancelled',
        cancelledBy,
        cancellationReason: reason || undefined
      });

      notifyOrderUpdated(orderToCancel);
      
      toast({
        title: 'Заказ отменён',
        description: 'Заказ успешно отменён',
      });

      // Закрываем модалку
      setIsChatOpen(false);
      
      // Переключаем на вкладку "Архив" после отмены
      if (onTabChange) {
        onTabChange('archive');
      }
      
      // notifyOrderUpdated уже триггерит обновление через событие order_updated (вызвано выше)
    } catch (error) {
      console.error('Error cancelling order:', error);
      
      // В случае ошибки откатываем изменения
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === orderToCancel ? order : o)
      );
      
      if (selectedOrder?.id === orderToCancel) {
        setSelectedOrder(order);
      }
      
      toast({
        title: 'Ошибка',
        description: 'Не удалось отменить заказ',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!pendingReviewOrder || !currentUser) return;

    try {
      await reviewsAPI.createReview({
        order_id: pendingReviewOrder.id,
        seller_id: Number(pendingReviewOrder.sellerId),
        rating,
        comment,
      });

      toast({
        title: 'Отзыв опубликован',
        description: 'Спасибо за ваш отзыв!',
      });

      setPendingReviewOrder(null);
      
      // Обновляем список заказов после публикации отзыва
      await loadOrders(false);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Ошибка',
        description: error?.message || 'Не удалось опубликовать отзыв',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleCloseReviewModal = async () => {
    setReviewModalOpen(false);
    setPendingReviewOrder(null);
    
    // Обновляем список заказов при закрытии модального окна (кнопка "Пропустить")
    await loadOrders(false);
  };

  return {
    orders,
    selectedOrder,
    isChatOpen,
    isLoading,
    isSyncing,
    currentUser,
    reviewModalOpen,
    pendingReviewOrder,
    handleAcceptOrder,
    handleCounterOffer,
    handleAcceptCounter,
    handleCancelOrder,
    handleCompleteOrder,
    handleOpenChat,
    handleCloseChat,
    handleSubmitReview,
    handleCloseReviewModal,
    loadOrders,
  };
}