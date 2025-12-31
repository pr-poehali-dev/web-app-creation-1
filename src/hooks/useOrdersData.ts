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
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadOrders(true);
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
      }));
      
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

  const handleCounterOffer = async (price: number, message: string) => {
    if (!selectedOrder) return;

    console.log('[handleCounterOffer] Called with:', { price, message, orderId: selectedOrder.id });

    try {
      const currentUser = getSession();
      const isSeller = currentUser?.id?.toString() === selectedOrder.sellerId;
      
      console.log('[handleCounterOffer] Sending to API:', { 
        orderId: selectedOrder.id,
        counterPrice: price,
        counterMessage: message,
        isSeller
      });

      await ordersAPI.updateOrder(selectedOrder.id, { 
        counterPrice: price,
        counterMessage: message 
      });

      console.log('[handleCounterOffer] API call successful');

      // Мгновенно обновляем данные локально для быстрого отклика
      setSelectedOrder({
        ...selectedOrder,
        status: 'negotiating',
        counterPricePerUnit: price,
        counterTotalAmount: price * selectedOrder.quantity,
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

  return {
    orders,
    selectedOrder,
    isChatOpen,
    isLoading,
    currentUser,
    handleAcceptOrder,
    handleCounterOffer,
    handleAcceptCounter,
    handleCompleteOrder,
    handleOpenChat,
    handleCloseChat,
    loadOrders,
  };
}