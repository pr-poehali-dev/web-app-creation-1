import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import OrderChatModal from '@/components/order/OrderChatModal';
import OfferCard from '@/components/OfferCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useOrdersData } from '@/hooks/useOrdersData';
import { offersAPI } from '@/services/api';
import type { Offer } from '@/types/offer';
import { useToast } from '@/hooks/use-toast';

interface MyOrdersProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function MyOrders({ isAuthenticated, onLogout }: MyOrdersProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [myOffers, setMyOffers] = useState<Offer[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      loadMyOffers();
    }
  }, [isAuthenticated, navigate]);

  const loadMyOffers = async () => {
    try {
      setIsLoadingOffers(true);
      const response = await offersAPI.getOffers({ status: 'active' });
      setMyOffers(response.offers || []);
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setIsLoadingOffers(false);
    }
  };
  
  const {
    orders,
    selectedOrder,
    messages,
    isChatOpen,
    currentUser,
    handleAcceptOrder,
    handleCounterOffer,
    handleAcceptCounter,
    handleCompleteOrder,
    handleOpenChat,
    handleCloseChat,
    handleSendMessage,
    loadOrders,
  } = useOrdersData(isAuthenticated, 'seller', () => {});

  const handleDeleteOffer = async (id: string) => {
    try {
      await offersAPI.updateOffer(id, { status: 'archived' });
      setMyOffers(prev => prev.filter(o => o.id !== id));
      toast({
        title: 'Успешно',
        description: 'Предложение удалено',
      });
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить предложение',
        variant: 'destructive',
      });
    }
  };

  const getUnreadMessages = (offerId: string): number => {
    const relatedOrders = orders.filter(o => {
      const orderOfferId = o.offer_id || o.offerId;
      return orderOfferId === offerId;
    });
    return relatedOrders.length;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/20 to-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <BackButton />
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Мои предложения</h1>
          <p className="text-muted-foreground">Управление предложениями и просмотр заказов</p>
        </div>

        <div className="mb-6">
          <Button onClick={() => navigate('/create-offer')} className="w-full sm:w-auto">
            <Icon name="Plus" className="h-4 w-4 mr-2" />
            Создать предложение
          </Button>
        </div>

        {isLoadingOffers ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Загрузка предложений...</p>
            </CardContent>
          </Card>
        ) : myOffers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Icon name="Package" className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">У вас пока нет опубликованных предложений</p>
              <Button onClick={() => navigate('/create-offer')}>
                <Icon name="Plus" className="h-4 w-4 mr-2" />
                Создать предложение
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {myOffers.map(offer => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onDelete={handleDeleteOffer}
                unreadMessages={getUnreadMessages(offer.id)}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />

      {selectedOrder && (
        <OrderChatModal
          isOpen={isChatOpen}
          onClose={handleCloseChat}
          order={selectedOrder}
          messages={messages}
          onSendMessage={handleSendMessage}
          onAcceptOrder={currentUser?.id?.toString() === selectedOrder.sellerId ? () => handleAcceptOrder() : undefined}
          onCounterOffer={handleCounterOffer}
          onAcceptCounter={handleAcceptCounter}
          onCompleteOrder={currentUser?.id?.toString() === selectedOrder.buyerId ? handleCompleteOrder : undefined}
        />
      )}
    </div>
  );
}