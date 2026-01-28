import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Offer } from '@/types/offer';
import type { Order } from '@/types/order';
import { offersAPI, ordersAPI } from '@/services/api';
import { getSession, clearSession } from '@/utils/auth';
import { useToast } from '@/hooks/use-toast';
import { useOrdersPolling } from '@/hooks/useOrdersPolling';
import EditOfferHeader from '@/components/edit-offer/EditOfferHeader';
import EditOfferTabs from '@/components/edit-offer/EditOfferTabs';
import EditOfferDeleteDialog from '@/components/edit-offer/EditOfferDeleteDialog';
import EditOfferOrderModal from '@/components/edit-offer/EditOfferOrderModal';

interface ChatMessage {
  id: string;
  orderId: string;
  orderNumber: string;
  buyerName: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

export default function EditOffer() {
  useScrollToTop();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getSession();
  const isAuthenticated = !!currentUser;
  
  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };
  
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState('info');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useOrdersPolling({
    enabled: isAuthenticated && !!id,
    interval: 15000,
    onNewOrder: (order: any) => {
      if ((order.offer_id || order.offerId) === id) {
        toast({
          title: '🎉 Новый заказ!',
          description: `Заказ от ${order.buyer_name || 'покупателя'} на сумму ${order.total_amount?.toLocaleString('ru-RU') || 0} ₽`,
        });
        loadData();
      }
    },
  });

  const loadData = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const [offerData, ordersResponse, messagesData] = await Promise.all([
        offersAPI.getOfferById(id),
        ordersAPI.getAll('sale'),
        ordersAPI.getMessagesByOffer(id)
      ]);
      
      const mappedOffer: Offer = {
        ...offerData,
        pricePerUnit: offerData.price_per_unit || offerData.pricePerUnit || 0,
        userId: offerData.user_id || offerData.userId,
        createdAt: new Date(offerData.createdAt || offerData.created_at),
      };

      if (mappedOffer.userId !== currentUser?.id) {
        toast({
          title: 'Ошибка доступа',
          description: 'Вы не можете редактировать чужое объявление',
          variant: 'destructive',
        });
        navigate(`/offer/${id}`);
        return;
      }
      
      setOffer(mappedOffer);
      
      const ordersData = ordersResponse.orders || [];
      const relatedOrders = ordersData
        .filter((o: any) => (o.offer_id || o.offerId) === id)
        .map((order: any) => ({
          id: order.id,
          offerId: order.offer_id || order.offerId,
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
          buyerCompany: order.buyer_company || order.buyerCompany,
          buyerInn: order.buyer_inn || order.buyerInn,
          sellerId: order.seller_id?.toString() || order.sellerId,
          sellerName: order.seller_name || order.sellerName || order.seller_full_name,
          sellerPhone: order.seller_phone || order.sellerPhone,
          sellerEmail: order.seller_email || order.sellerEmail,
          status: order.status,
          deliveryType: order.delivery_type || order.deliveryType || 'delivery',
          comment: order.comment,
          createdAt: new Date(order.createdAt || order.created_at),
          acceptedAt: order.acceptedAt || order.accepted_at ? new Date(order.acceptedAt || order.accepted_at) : undefined,
        }));
      setOrders(relatedOrders);

      const mappedMessages: ChatMessage[] = messagesData.map((msg: any) => ({
        id: msg.id,
        orderId: msg.order_id,
        orderNumber: msg.order_number,
        buyerName: msg.sender_name || 'Пользователь',
        message: msg.message,
        timestamp: new Date(msg.created_at),
        isRead: msg.is_read,
      }));
      setMessages(mappedMessages);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные объявления',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser || !isAuthenticated) {
      navigate('/login');
      return;
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleOpenChat = async (order: Order) => {
    setSelectedOrder(order);
    setIsChatOpen(true);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!offer) return;
    
    try {
      await offersAPI.updateOffer(offer.id, { status: 'deleted' });
      
      localStorage.removeItem('cached_offers');
      localStorage.setItem('offers_updated', 'true');
      
      setShowDeleteDialog(false);
      
      toast({
        title: 'Успешно',
        description: 'Объявление удалено',
      });
      
      navigate('/predlozheniya', { replace: true });
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить объявление',
        variant: 'destructive',
      });
    }
  };

  const handleMessageClick = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) handleOpenChat(order);
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await ordersAPI.deleteOrder(orderId);
      
      const updatedOrders = orders.filter(o => o.id !== orderId);
      setOrders(updatedOrders);
      
      toast({
        title: 'Заказ удалён',
        description: 'Заказ успешно удалён',
      });

      if (updatedOrders.length === 0) {
        toast({
          title: 'Готово',
          description: 'Все заказы удалены. Теперь можно удалить объявление.',
        });
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить заказ',
        variant: 'destructive',
      });
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await ordersAPI.updateOrder(orderId, { status: 'accepted' });
      
      toast({
        title: 'Заказ принят',
        description: 'Заказ успешно принят в работу',
      });
      
      loadData();
    } catch (error) {
      console.error('Error accepting order:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось принять заказ',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Загрузка...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Объявление не найдено</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <EditOfferHeader />

        <EditOfferTabs
          offer={offer}
          orders={orders}
          messages={messages}
          activeTab={activeTab}
          hasChanges={hasChanges}
          onTabChange={setActiveTab}
          onOpenChat={handleOpenChat}
          onAcceptOrder={handleAcceptOrder}
          onMessageClick={handleMessageClick}
          onDelete={handleDelete}
          onUpdate={loadData}
        />
      </main>

      <Footer />

      <EditOfferDeleteDialog
        isOpen={showDeleteDialog}
        orders={orders}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        onDeleteOrder={handleDeleteOrder}
      />

      <EditOfferOrderModal
        selectedOrder={selectedOrder}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onDataReload={loadData}
      />
    </div>
  );
}