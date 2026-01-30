import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './use-toast';
import { getSession } from '@/utils/auth';
import { notifyOrderAccepted } from '@/utils/notifications';
import type { Order } from '@/types/order';
import { ordersAPI } from '@/services/api';
import { SmartCache, checkForUpdates } from '@/utils/smartCache';

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

    return () => {};
  }, [isAuthenticated, navigate, currentUser?.id]);

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

      toast({
        title: 'Встречное предложение отправлено',
        description: isSeller ? 'Покупатель получит уведомление' : 'Продавец получит уведомление',
      });

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

      toast({
        title: 'Встречное предложение принято',
        description: 'Заказ переведён в статус "Принято"',
      });

      // Обновляем список заказов для синхронизации с сервером
      await loadOrders(false);
      
      // Получаем обновлённый заказ напрямую из API и маппим его
      const updatedOrderData = await ordersAPI.getOrderById(selectedOrder.id);
      setSelectedOrder(mapOrderData(updatedOrderData));
    } catch (error) {
      console.error('Error accepting counter offer:', error);
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

    try {
      await ordersAPI.updateOrder(orderToComplete, { status: 'completed' });

      const order = orders.find(o => o.id === orderToComplete);
      const isBuyer = currentUser?.id?.toString() === order?.buyerId?.toString();

      setIsChatOpen(false);
      
      // Переключаем на вкладку "Архив" сразу после завершения
      if (onTabChange) {
        onTabChange('archive');
      }
      
      await loadOrders(false);

      toast({
        title: 'Заказ завершён',
        description: isBuyer 
          ? 'Заказ успешно завершён. Вы можете оставить отзыв о продавце.' 
          : 'Заказ успешно завершён. Спасибо за работу!',
        action: isBuyer ? {
          label: 'Оставить отзыв',
          onClick: () => {
            // TODO: Открыть форму отзыва
            console.log('Open review form for order:', orderToComplete);
          }
        } : undefined,
      });
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
    isSyncing,
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