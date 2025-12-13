import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import type { Offer } from '@/types/offer';
import type { Order } from '@/types/order';
import { offersAPI, ordersAPI } from '@/services/api';
import { getSession } from '@/utils/auth';
import { useToast } from '@/hooks/use-toast';
import { useDistrict } from '@/contexts/DistrictContext';
import { useOffers } from '@/contexts/OffersContext';
import OrderChatModal from '@/components/order/OrderChatModal';
import type { ChatMessage as OrderChatMessage } from '@/types/order';
import { useOrdersPolling } from '@/hooks/useOrdersPolling';
import OfferInfoTab from '@/components/edit-offer/OfferInfoTab';
import OfferOrdersTab from '@/components/edit-offer/OfferOrdersTab';
import OfferMessagesTab from '@/components/edit-offer/OfferMessagesTab';

interface EditOfferProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface ChatMessage {
  id: string;
  orderId: string;
  orderNumber: string;
  buyerName: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

export default function EditOffer({ isAuthenticated, onLogout }: EditOfferProps) {
  useScrollToTop();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getSession();
  const { districts } = useDistrict();
  
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState('info');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [chatMessages, setChatMessages] = useState<OrderChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { deleteOffer } = useOffers();

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
    await loadChatMessages(order.id);
    setIsChatOpen(true);
  };

  const loadChatMessages = async (orderId: string) => {
    try {
      setChatMessages([]);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить сообщения',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedOrder || !currentUser) return;

    try {
      const senderType = selectedOrder.sellerId === currentUser.id?.toString() ? 'seller' : 'buyer';
      
      await ordersAPI.createMessage({
        orderId: selectedOrder.id,
        senderId: currentUser.id || 0,
        senderType,
        message,
      });

      const newMessage: OrderChatMessage = {
        id: Date.now().toString(),
        orderId: selectedOrder.id,
        senderId: currentUser.id?.toString() || '',
        senderName: `${currentUser.firstName} ${currentUser.lastName}`,
        message,
        timestamp: new Date(),
        isRead: false,
      };

      setChatMessages([...chatMessages, newMessage]);

      toast({
        title: 'Отправлено',
        description: 'Сообщение успешно отправлено',
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

  const handleEdit = () => {
    if (!offer) return;
    
    toast({
      title: 'Редактирование',
      description: 'Для изменения объявления удалите его и создайте новое с актуальными данными',
    });
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!offer) return;
    
    deleteOffer(offer.id);
    setShowDeleteDialog(false);
    
    toast({
      title: 'Успешно',
      description: 'Объявление удалено',
    });
    
    navigate('/predlozheniya', { replace: true });
  };

  const handleMessageClick = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) handleOpenChat(order);
  };

  const districtName = districts.find(d => d.id === offer?.district)?.name || offer?.district;
  const unreadCount = messages.filter(m => !m.isRead).length;

  if (!currentUser) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="flex justify-center items-center h-64">
            <Icon name="Loader2" className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="container mx-auto px-4 py-8 flex-1">
          <Card>
            <CardContent className="py-8 text-center">
              <Icon name="AlertCircle" className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Объявление не найдено</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="container mx-auto px-4 py-8 flex-1 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
          Назад
        </Button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Управление объявлением</h1>
          <Button onClick={() => navigate(`/offer/${id}`)} variant="outline">
            <Icon name="Eye" className="w-4 h-4 mr-2" />
            Просмотр
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">
              <Icon name="Info" className="w-4 h-4 mr-2" />
              Информация
            </TabsTrigger>
            <TabsTrigger value="orders">
              <Icon name="ShoppingCart" className="w-4 h-4 mr-2" />
              Заказы
              {orders.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {orders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages">
              <Icon name="MessageSquare" className="w-4 h-4 mr-2" />
              Сообщения
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            <OfferInfoTab
              offer={offer}
              districtName={districtName}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <OfferOrdersTab
              orders={orders}
              onOpenChat={handleOpenChat}
            />
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <OfferMessagesTab
              messages={messages}
              onMessageClick={handleMessageClick}
            />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить объявление?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Объявление будет удалено безвозвратно.
              {orders.length > 0 && (
                <span className="block mt-2 text-destructive font-semibold">
                  У этого объявления есть активные заказы ({orders.length}). Удаление может повлиять на них.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedOrder && (
        <OrderChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          order={selectedOrder}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
        />
      )}
    </div>
  );
}