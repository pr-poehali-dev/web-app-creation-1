import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './use-toast';
import { getSession } from '@/utils/auth';
import { notifyOrderAccepted } from '@/utils/notifications';
import type { Order } from '@/types/order';
import { ordersAPI, reviewsAPI } from '@/services/api';
import { showLoading, hideLoading } from '@/components/TopLoadingBar';
import { SmartCache, checkForUpdates } from '@/utils/smartCache';
import { dataSync, notifyOrderUpdated } from '@/utils/dataSync';

export type OrderTab = 'buyer' | 'seller' | 'my-requests' | 'my-responses' | 'archive';

export function useOrdersData(
  isAuthenticated: boolean, 
  activeTab: OrderTab,
  onTabChange?: (tab: OrderTab) => void
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
  const optimisticUpdatesRef = useRef<Map<string, { status: string; timestamp: number }>>(new Map());

  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSyAzvLZiTYIG2m98OScTgwNUrDo7beHHwU0j9zvyoEuBiV5yPLajkILEmG56+qnVxEKQ5zf8sFuJAUqfsvy14w6BxpnvfDtnjELDlCx6O+8hSMFMpDe7s+FOAYjdsjw3I9BCRFft+jrp1YRCkSc4PKzbSQFKXzM8teNOgcZZr7w7p4yCw5Psejtu4QkBTGQ3u/PhToGInXI8NyPQQkQX7bn7KlYEglEnN/ys2wlBSl8zPLXjToHGGa+8O6dMQwOT7Ho7buEJAUykN7uz4U6BiJ1yPDcj0EJD1+36+uoWBIJQ53g8rNsJQUpfM3y1404Bhlmv/DvnTEMDk+y6O27gyMFMpHe78+FOQYidc3w3I9BCQ9ftuvqqFYSCUOd4PKzbCUFKX3M8teNOQYZZr/w7pwxCw5Psuvrvo4iBS+Q3u/PhTkGInXO8NyQQQkPXrjr6qhVFAlEnuDys2wlBSh8zfLXjDkGGWe/8O+cMgsOTrPr7L+OIgUukN7wz4U6BiJ1zvDckEEJD1647OqnVRQJRJ7g8rNtJQUofM7y1404BhlozfHvmzALDk6068+/jSIFLZHe8c+FOgcjd87w3ZFBCg9eue3qplURCUSe4fK0bCQEJ33N8teMOAYZaM/x7pswCw5Oteve0LyQIgQrj9/xz4Y6ByR31PDelUEKEF+57OmmUxIIRKDh8rVsJAQnfs3y14o4BRZpz/HtmC4KDU607tCzjh8DHpDf8c+FOwgkedfx35ZACxFgsO3qpFIRB0Oh4vKybSMEJn7N89aLOAUVaM/x75gvCg1NvO7Rro8dAxyP3/LPhjsIJHnV8t+WQQsQYbDv66VUEgdDo+Lzs20kBCV+z/PXizcFFWfQ8u+ZMAoOTr/u07eQHwMbj+Dyz4c6CSN419TemkILEGKw8OylVBMHQ6Th8rJvJQQkftHy14s2BRRo0fPvmzIKDk+/7tO5kR8CGY/h89CIOggid9bz3ptCDBBjsvHtplQTB0Ol4/O0bSQEJH/S8tiMNgURZ9Hy8JwyDA9OwO7Uv5EhAxmP4fTRiTsIIXfY89+cQwwQY7Py7qZWEwZBp+TztW4lAyJ/0/LZjDYFEGfS8vGcMw0OT8Hu1cGSIgMYj+P00Io7CSB21/TfnEQNDmO08u6mVxMGQKnl87ZuJgIhftXz2Y0zBQ5m0/LynDUMDlDB79XBkiIDFo/j9dCLOwkhd9f035xGDQ1jtvPvp1gTBj+p5/O3cCcCH33W89qOMwcNZdPy8p02DA9Qw+/Ww5IkAxSN5PXRjDwJIXfZ8+CdRg0MZLb08KdZEwU+qun0uHEoAh191/Tbjjsj6sD5+GfJMKAAAAASUVORK5CYII=');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  const mapOrderData = (orderData: Record<string, unknown>): Order => {
    const counterOfferedAt = orderData.counter_offered_at || orderData.counterOfferedAt 
      ? new Date(orderData.counter_offered_at || orderData.counterOfferedAt) 
      : undefined;
    
    const counterOfferedBy = orderData.counter_offered_by || orderData.counterOfferedBy;
    
    // Определяем, есть ли непрочитанная встречная цена
    let hasUnreadCounterOffer = false;
    if (counterOfferedAt && counterOfferedBy && currentUser) {
      // Проверяем, что встречную цену предложил контрагент (не я)
      const isCounterByOther = (
        (counterOfferedBy === 'buyer' && currentUser.id !== orderData.buyer_id?.toString()) ||
        (counterOfferedBy === 'seller' && currentUser.id !== orderData.seller_id?.toString())
      );
      
      if (isCounterByOther) {
        // Время последнего просмотра этого заказа
        const lastViewedKey = `order_viewed_${orderData.id}`;
        const lastViewedStr = localStorage.getItem(lastViewedKey);
        const lastViewedAt = lastViewedStr ? new Date(lastViewedStr) : null;
        
        // Если встречная цена новее последнего просмотра — она непрочитана
        hasUnreadCounterOffer = !lastViewedAt || counterOfferedAt > lastViewedAt;
      }
    }
    
    return {
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
      counterOfferedAt,
      counterOfferedBy,
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
      updatedAt: orderData.updatedAt || orderData.updated_at ? new Date(orderData.updatedAt || orderData.updated_at) : undefined,
      acceptedAt: orderData.acceptedAt || orderData.accepted_at ? new Date(orderData.acceptedAt || orderData.accepted_at) : undefined,
      completedDate: orderData.completedDate || orderData.completed_date ? new Date(orderData.completedDate || orderData.completed_date) : undefined,
      cancelledBy: orderData.cancelled_by || orderData.cancelledBy,
      cancellationReason: orderData.cancellation_reason || orderData.cancellationReason,
      buyerCompany: orderData.buyer_company || orderData.buyerCompany,
      buyerInn: orderData.buyer_inn || orderData.buyerInn,
      isRequest: orderData.is_request || orderData.isRequest || false,
      buyerComment: orderData.buyer_comment || orderData.buyerComment,
      attachments: orderData.attachments,
      hasUnreadCounterOffer,
      unreadMessages: orderData.unreadMessages || 0,
      offerCategory: orderData.offerCategory,
      offerTransportRoute: orderData.offerTransportRoute,
      offerTransportServiceType: orderData.offerTransportServiceType,
      offerTransportDateTime: orderData.offerTransportDateTime,
      offerTransportNegotiable: orderData.offerTransportNegotiable,
      passengerPickupAddress: orderData.passengerPickupAddress || orderData.passenger_pickup_address,
      completionRequested: orderData.completionRequested || orderData.completion_requested || false,
      archivedByAdmin: orderData.archived_by_admin || orderData.archivedByAdmin || false,
      adminArchiveReason: orderData.admin_archive_reason || orderData.adminArchiveReason,
      tripCancelled: orderData.trip_cancelled || orderData.tripCancelled || false,
      buyerRating: orderData.buyer_rating != null ? orderData.buyer_rating : orderData.buyerRating,
      sellerRating: orderData.seller_rating != null ? orderData.seller_rating : orderData.sellerRating,
      sellerAvgReviewRating: orderData.sellerAvgReviewRating != null ? orderData.sellerAvgReviewRating : undefined,
      buyerAvgReviewRating: orderData.buyerAvgReviewRating != null ? orderData.buyerAvgReviewRating : undefined,
      offerImageUrl: orderData.offerImageUrl || orderData.offer_image_url,
    };
  };

  const loadOrders = useCallback(async (showLoader = false) => {
    showLoading();
    try {
      if (showLoader) {
        setIsLoading(true);
      } else {
        setIsSyncing(true);
      }
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Превышено время ожидания')), 15000)
      );
      
      const response = await Promise.race([
        ordersAPI.getAll('all'),
        timeoutPromise
      ]) as { orders: Record<string, unknown>[] };
      
      const mappedOrders = response.orders.map(mapOrderData);
      
      const ordersWithOptimistic = mappedOrders.map((order: Order) => {
        const opt = optimisticUpdatesRef.current.get(order.id as string);
        if (!opt) return order;
        if (order.status === opt.status) {
          optimisticUpdatesRef.current.delete(order.id as string);
          return order;
        }
        return { ...order, status: opt.status };
      });
      
      setOrders(ordersWithOptimistic);
      
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error || 'Не удалось загрузить заказы');
      
      if (showLoader) {
        toast({
          title: 'Ошибка загрузки',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      setOrders([]);
    } finally {
      hideLoading();
      if (showLoader) {
        setIsLoading(false);
      } else {
        setIsSyncing(false);
      }
    }
  }, [isInitialLoad, toast]);
  
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

    // Слушатель триггера принудительного обновления после действий с заказом
    const handleStorageChange = async (e: StorageEvent | Event) => {
      let triggerData: { orderId?: string } | null = null;
      
      if ('key' in e && e.key === 'force_orders_reload') {
        console.log('🔄 Force reload orders triggered by action');
        try {
          const data = localStorage.getItem('force_orders_reload');
          if (data) triggerData = JSON.parse(data);
        } catch (err) {
          // Старый формат (просто timestamp)
        }
      } else if (!('key' in e)) {
        const forceReload = localStorage.getItem('force_orders_reload');
        if (forceReload) {
          console.log('🔄 Force reload orders triggered by action (manual)');
          try {
            triggerData = JSON.parse(forceReload);
          } catch (err) {
            // Старый формат (просто timestamp)
          }
          localStorage.removeItem('force_orders_reload');
        }
      }
      
      // Если есть конкретный orderId - МГНОВЕННОЕ обновление только этого заказа
      if (triggerData?.orderId) {
        console.log('🎯 Точечное обновление заказа:', triggerData.orderId);
        try {
          const updatedOrderData = await ordersAPI.getOrderById(triggerData.orderId);
          const mappedOrder = mapOrderData(updatedOrderData);
          
          setOrders(prevOrders => 
            prevOrders.map(o => 
              o.id === mappedOrder.id ? mappedOrder : o
            )
          );
          
          setSelectedOrder(prev => 
            prev?.id === mappedOrder.id ? mappedOrder : prev
          );
          
          console.log('✅ Заказ', triggerData.orderId, 'обновлен мгновенно у контрагента');
        } catch (err) {
          console.error('Ошибка точечного обновления, загружаем все:', err);
          await loadOrders(false);
        }
      } else {
        // Полная перезагрузка если нет orderId
        await loadOrders(false);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);

    const handleGlobalRefresh = () => loadOrders(false);
    window.addEventListener('globalRefresh', handleGlobalRefresh);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('globalRefresh', handleGlobalRefresh);
    };
  }, [isAuthenticated, navigate, currentUser?.id, loadOrders]);

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

  // Удалено: этот effect вызывал постоянные перерисовки модалки
  // Теперь selectedOrder обновляется только при явных действиях (counter offer, accept, etc)

  // Периодическое обновление всех заказов каждые 30 секунд (optimistic updates уже мгновенные)
  useEffect(() => {
    if (!isAuthenticated) return;

    loadOrders(false);

    const intervalId = setInterval(() => {
      loadOrders(false);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, loadOrders]);

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
  }, [activeTab, orders.length, loadOrders]);



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

      toast({
        title: 'Заказ принят',
        description: 'Заказ успешно принят в работу. Остаток товара обновлен.',
      });

      // Инвалидируем кэш запросов — после принятия отклика запрос мог изменить состояние
      SmartCache.invalidate('requests_list');

      // Триггер для МГНОВЕННОГО обновления у контрагента
      localStorage.setItem('force_orders_reload', JSON.stringify({
        timestamp: Date.now(),
        orderId: orderToAccept,
        action: 'accept'
      }));
      window.dispatchEvent(new Event('storage'));
      
      // notifyOrderUpdated уже триггерит обновление через событие order_updated
      notifyOrderUpdated(orderToAccept);
    } catch (error) {
      console.error('Error accepting order:', error);
      
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === orderToAccept ? order : o)
      );
      
      if (selectedOrder?.id === orderToAccept) {
        setSelectedOrder(order);
      }
      
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось принять заказ',
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

      const updatedOrderData = await ordersAPI.getOrderById(selectedOrder.id);
      const mappedOrder = mapOrderData(updatedOrderData);
      
      setSelectedOrder(mappedOrder);
      
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === mappedOrder.id ? mappedOrder : o)
      );
      
      localStorage.setItem('force_orders_reload', JSON.stringify({
        timestamp: Date.now(),
        orderId: selectedOrder.id,
        action: 'counter_offer'
      }));
      window.dispatchEvent(new Event('storage'));
      
      // Уведомляем систему об обновлении заказа (для dataSync)
      notifyOrderUpdated(selectedOrder.id);
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

      // Триггер для МГНОВЕННОГО обновления у контрагента
      localStorage.setItem('force_orders_reload', JSON.stringify({
        timestamp: Date.now(),
        orderId: orderId,
        action: 'accept_counter'
      }));
      window.dispatchEvent(new Event('storage'));

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
      optimisticUpdatesRef.current.set(orderToComplete as string, { status: 'completed', timestamp: Date.now() });

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

      await ordersAPI.updateOrder(orderToComplete, { status: 'completed' });

      setTimeout(() => setIsChatOpen(false), 400);
      
      localStorage.setItem('force_orders_reload', JSON.stringify({
        timestamp: Date.now(),
        orderId: orderToComplete,
        action: 'complete'
      }));
      window.dispatchEvent(new Event('storage'));
      
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
      optimisticUpdatesRef.current.delete(orderToComplete as string);
      
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

  const handleOpenChat = async (order: Order) => {
    // Ищем самую актуальную версию заказа из списка orders
    const actualOrder = orders.find(o => o.id === order.id) || order;
    
    
    // Сохраняем время просмотра для отметки встречных цен как прочитанных
    const lastViewedKey = `order_viewed_${actualOrder.id}`;
    localStorage.setItem(lastViewedKey, new Date().toISOString());
    
    // Обновляем заказ, чтобы сбросить флаг непрочитанной встречной цены
    const updatedOrder = { ...actualOrder, hasUnreadCounterOffer: false };
    
    setSelectedOrder(updatedOrder);
    setIsChatOpen(true);
    
    // Также обновляем в массиве orders
    setOrders(prevOrders => 
      prevOrders.map(o => o.id === actualOrder.id ? updatedOrder : o)
    );
    
    // КРИТИЧНО: Получаем свежие данные с сервера при открытии модалки
    try {
      const freshOrderData = await ordersAPI.getOrderById(actualOrder.id);
      const freshOrder = mapOrderData(freshOrderData);
      
      console.log('[handleOpenChat] Получены свежие данные:', {
        id: freshOrder.id,
        counterPrice: freshOrder.counterPricePerUnit,
        counterTotal: freshOrder.counterTotalAmount
      });
      
      // Обновляем selectedOrder свежими данными
      setSelectedOrder({ ...freshOrder, hasUnreadCounterOffer: false });
      
      // Обновляем карточку в списке заказов
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === freshOrder.id ? { ...freshOrder, hasUnreadCounterOffer: false } : o)
      );
    } catch (error) {
      console.error('[handleOpenChat] Ошибка получения свежих данных:', error);
    }
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    // НЕ сбрасываем selectedOrder в null, чтобы избежать пропадания карточки
    // Он автоматически обновится при следующем loadOrders
  };

  const handleCancelOrder = async (orderId?: string, reason?: string) => {
    const orderToCancel = orderId || selectedOrder?.id;
    if (!orderToCancel) return;

    const order = orders.find(o => o.id === orderToCancel);
    if (!order) return;
    
    const cancelledBy = currentUser?.id?.toString() === order?.buyerId?.toString() ? 'buyer' : 'seller';

    try {
      optimisticUpdatesRef.current.set(orderToCancel as string, { status: 'cancelled', timestamp: Date.now() });

      const updatedOrder = {
        ...order,
        status: 'cancelled' as const,
        cancelledBy,
        cancellationReason: reason || undefined,
      };
      
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === orderToCancel ? updatedOrder : o)
      );
      
      if (selectedOrder?.id === orderToCancel) {
        setSelectedOrder(updatedOrder);
      }
      
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

      localStorage.setItem('force_orders_reload', JSON.stringify({
        timestamp: Date.now(),
        orderId: orderToCancel,
        action: 'cancel'
      }));
      window.dispatchEvent(new Event('storage'));

      setTimeout(() => setIsChatOpen(false), 400);
    } catch (error) {
      console.error('Error cancelling order:', error);
      optimisticUpdatesRef.current.delete(orderToCancel as string);
      
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
    } catch (error: unknown) {
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

  const handleRequestCompletion = async (orderId?: string) => {
    const orderToUpdate = orderId || selectedOrder?.id;
    if (!orderToUpdate) return;

    const order = orders.find(o => o.id === orderToUpdate);
    if (!order) return;

    try {
      const updatedOrder = { ...order, completionRequested: true };
      setOrders(prev => prev.map(o => o.id === orderToUpdate ? updatedOrder : o));
      if (selectedOrder?.id === orderToUpdate) setSelectedOrder(updatedOrder);

      await ordersAPI.updateOrder(orderToUpdate, { completionRequested: true });

      toast({
        title: 'Запрос отправлен',
        description: 'Заказчик получил уведомление о завершении работы',
      });

      notifyOrderUpdated(orderToUpdate);
      localStorage.setItem('force_orders_reload', JSON.stringify({ timestamp: Date.now(), orderId: orderToUpdate, action: 'request_completion' }));
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Error requesting completion:', error);
      setOrders(prev => prev.map(o => o.id === orderToUpdate ? order : o));
      if (selectedOrder?.id === orderToUpdate) setSelectedOrder(order);
      toast({ title: 'Ошибка', description: 'Не удалось отправить запрос', variant: 'destructive' });
    }
  };

  const handleCancelTrip = async (offerId: string, reason: string) => {
    try {
      await ordersAPI.cancelTrip(offerId, reason);

      toast({
        title: 'Рейс отменён',
        description: 'Все пассажиры уведомлены об отмене рейса',
      });

      localStorage.setItem('force_orders_reload', JSON.stringify({
        timestamp: Date.now(),
        action: 'cancel_trip'
      }));
      window.dispatchEvent(new Event('storage'));
      await loadOrders(false);
      setIsChatOpen(false);
    } catch (error) {
      console.error('Error cancelling trip:', error);
      toast({ title: 'Ошибка', description: 'Не удалось отменить рейс', variant: 'destructive' });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    try {
      setOrders(prev => prev.filter(o => o.id !== orderId));

      await ordersAPI.deleteOrder(orderId);

      toast({
        title: 'Отклик удалён',
        description: 'Ваш отклик успешно удалён',
      });

      localStorage.setItem('force_orders_reload', JSON.stringify({
        timestamp: Date.now(),
        orderId,
        action: 'delete'
      }));
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Error deleting order:', error);
      setOrders(prev => [...prev, order].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));

      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить отклик',
        variant: 'destructive',
      });
    }
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
    handleCancelTrip,
    handleCompleteOrder,
    handleRequestCompletion,
    handleDeleteOrder,
    handleOpenChat,
    handleCloseChat,
    handleSubmitReview,
    handleCloseReviewModal,
    loadOrders,
  };
}