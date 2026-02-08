import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Вспомогательная функция для маппинга заказа
  const mapOrderData = (orderData: any): Order => {
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
      acceptedAt: orderData.acceptedAt || orderData.accepted_at ? new Date(orderData.acceptedAt || orderData.accepted_at) : undefined,
      completedDate: orderData.completedDate || orderData.completed_date ? new Date(orderData.completedDate || orderData.completed_date) : undefined,
      cancelledBy: orderData.cancelled_by || orderData.cancelledBy,
      cancellationReason: orderData.cancellation_reason || orderData.cancellationReason,
      buyerCompany: orderData.buyer_company || orderData.buyerCompany,
      buyerInn: orderData.buyer_inn || orderData.buyerInn,
      hasUnreadCounterOffer,
    };
  };

  const loadOrders = useCallback(async (showLoader = false) => {
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
      
      // Логируем встречные цены для отладки
      const ordersWithCounter = mappedOrders.filter((o: Order) => o.counterPricePerUnit);
      if (ordersWithCounter.length > 0) {
        console.log('[loadOrders] Заказы со встречными ценами:', ordersWithCounter.map((o: Order) => ({
          id: o.id,
          title: o.offerTitle,
          counterPrice: o.counterPricePerUnit,
          counterTotal: o.counterTotalAmount,
          counterBy: o.counterOfferedBy,
          counterAt: o.counterOfferedAt,
          hasUnread: o.hasUnreadCounterOffer
        })));
      }
      
      // CRITICAL: Принудительно создаём НОВЫЙ массив с НОВЫМИ объектами
      // чтобы React гарантированно обнаружил изменения
      setOrders(mappedOrders.map(order => ({ ...order })));
      
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
      
      // Если есть конкретный orderId - обновляем только его
      if (triggerData?.orderId) {
        console.log('🎯 Точечное обновление заказа:', triggerData.orderId);
        try {
          const updatedOrderData = await ordersAPI.getOrderById(triggerData.orderId);
          const mappedOrder = mapOrderData(updatedOrderData);
          
          // Обновляем этот заказ в массиве с timestamp для гарантированного ререндера
          setOrders(prevOrders => 
            prevOrders.map(o => 
              o.id === mappedOrder.id 
                ? { ...mappedOrder, _updateTimestamp: Date.now() } 
                : o
            )
          );
          
          // Если это открытый заказ - обновляем selectedOrder
          if (selectedOrder?.id === mappedOrder.id) {
            setSelectedOrder(mappedOrder);
          }
          
          console.log('✅ Заказ обновлен мгновенно');
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

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
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

  // Синхронизируем selectedOrder с актуальными данными из orders
  // НО: Когда модальное окно открыто, быстрое обновление управляет данными
  useEffect(() => {
    if (selectedOrder && !isChatOpen) {
      const actualOrder = orders.find(o => o.id === selectedOrder.id);
      if (actualOrder && JSON.stringify(actualOrder) !== JSON.stringify(selectedOrder)) {
        console.log('[useOrdersData] Синхронизируем selectedOrder с orders (окно закрыто)');
        setSelectedOrder(actualOrder);
      }
    }
  }, [orders, selectedOrder?.id, isChatOpen]);

  // Автообновление при возвращении на страницу
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        console.log('[useOrdersData] Страница стала видимой, обновляем заказы');
        loadOrders(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, loadOrders]);

  // Периодическое автообновление каждые 3 секунды для очень быстрой синхронизации встречных предложений
  useEffect(() => {
    if (!isAuthenticated) return;

    const intervalId = setInterval(() => {
      console.log('[useOrdersData] Периодическое обновление заказов');
      loadOrders(false);
    }, 3000); // 3 секунды - очень быстрое обновление для встречных предложений

    return () => clearInterval(intervalId);
  }, [isAuthenticated, loadOrders]);

  // Ref для хранения актуального selectedOrder (избегаем stale closure)
  const selectedOrderRef = useRef(selectedOrder);
  useEffect(() => {
    selectedOrderRef.current = selectedOrder;
  }, [selectedOrder]);

  // Дополнительное быстрое обновление при открытом чате (каждую секунду)
  useEffect(() => {
    if (!isAuthenticated || !isChatOpen || !selectedOrderRef.current) return;

    const orderId = selectedOrderRef.current.id;
    
    const fastIntervalId = setInterval(async () => {
      const currentSelectedOrder = selectedOrderRef.current;
      if (!currentSelectedOrder || currentSelectedOrder.id !== orderId) return;
      
      console.log('[useOrdersData] Быстрое обновление открытого заказа:', orderId);
      try {
        const updatedOrderData = await ordersAPI.getOrderById(orderId);
        const mappedOrder = mapOrderData(updatedOrderData);
        
        // Обновляем только если данные действительно изменились
        const current = selectedOrderRef.current;
        if (!current || JSON.stringify(mappedOrder) !== JSON.stringify(current)) {
          console.log('[useOrdersData] Быстрое обновление: данные изменились', {
            counterPrice: mappedOrder.counterPricePerUnit,
            counterTotal: mappedOrder.counterTotalAmount,
            prevCounterPrice: current?.counterPricePerUnit,
            prevCounterTotal: current?.counterTotalAmount
          });
          
          // Обновляем selectedOrder
          setSelectedOrder(mappedOrder);
          
          // Также обновляем этот заказ в массиве orders для обновления карточки
          setOrders(prevOrders => {
            const updated = prevOrders.map(o => 
              o.id === mappedOrder.id 
                ? { ...mappedOrder, _updateTimestamp: Date.now() } 
                : o
            );
            console.log('[useOrdersData] Обновлён заказ в массиве orders');
            return updated;
          });
        }
      } catch (error) {
        console.error('[useOrdersData] Ошибка быстрого обновления:', error);
      }
    }, 1000); // 1 секунда - мгновенное обновление для активного заказа

    return () => clearInterval(fastIntervalId);
  }, [isAuthenticated, isChatOpen, selectedOrderRef.current?.id]);

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

      // Триггер для немедленного обновления у контрагента
      localStorage.setItem('force_orders_reload', JSON.stringify({
        timestamp: Date.now(),
        orderId: orderToAccept
      }));
      window.dispatchEvent(new Event('storage'));
      
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

      // Небольшая задержка чтобы дать серверу обновить БД
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Получаем обновлённый заказ напрямую из API и маппим его
      const updatedOrderData = await ordersAPI.getOrderById(selectedOrder.id);
      const mappedOrder = mapOrderData(updatedOrderData);
      
      console.log('[handleCounterOffer] Обновлённый заказ с сервера:', {
        id: mappedOrder.id,
        counterPrice: mappedOrder.counterPricePerUnit,
        counterTotal: mappedOrder.counterTotalAmount
      });
      
      // НЕМЕДЛЕННО обновляем selectedOrder (модальное окно)
      setSelectedOrder(mappedOrder);
      
      // НЕМЕДЛЕННО обновляем этот заказ в массиве orders (карточка на странице)
      // Добавляем _updateTimestamp для гарантированного ререндера React
      setOrders(prevOrders => {
        const newOrders = prevOrders.map(o => 
          o.id === mappedOrder.id 
            ? { ...mappedOrder, _updateTimestamp: Date.now() } 
            : o
        );
        console.log('[handleCounterOffer] Карточка отправителя обновлена локально');
        return newOrders;
      });
      
      console.log('✅ Локальное обновление завершено (модальное окно + карточка отправителя)');
      
      // Триггер для немедленного обновления у контрагента
      const triggerData = JSON.stringify({
        timestamp: Date.now(),
        orderId: selectedOrder.id
      });
      
      localStorage.setItem('force_orders_reload', triggerData);
      
      // Уведомляем систему об обновлении заказа (для dataSync)
      notifyOrderUpdated(selectedOrder.id);
      
      // КРИТИЧНО: Немедленная перезагрузка всех заказов для синхронизации
      // Это гарантирует что контрагент получит обновление даже если polling не сработал
      setTimeout(() => {
        loadOrders(false);
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

      // Триггер для немедленного обновления у контрагента
      localStorage.setItem('force_orders_reload', JSON.stringify({
        timestamp: Date.now(),
        orderId: orderId
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
      
      // Триггер для немедленного обновления у контрагента
      localStorage.setItem('force_orders_reload', JSON.stringify({
        timestamp: Date.now(),
        orderId: orderToComplete
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
      
      // Даём время на обновление локального состояния перед переключением вкладки
      setTimeout(() => {
        if (onTabChange) {
          onTabChange('archive');
        }
      }, 100);
      
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