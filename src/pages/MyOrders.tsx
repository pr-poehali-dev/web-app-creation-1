import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DataSyncIndicator from '@/components/DataSyncIndicator';
import BackButton from '@/components/BackButton';
import OrderNegotiationModal from '@/components/order/OrderNegotiationModal';
import OrderReviewModal from '@/components/reviews/OrderReviewModal';
import OrdersContent from '@/components/order/OrdersContent';
import PullToRefresh from '@/components/PullToRefresh';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useOrdersData, type OrderTab } from '@/hooks/useOrdersData';
import { offersAPI } from '@/services/api';
import { getSession } from '@/utils/auth';
import type { Order, Offer } from '@/types/offer';

interface MyOrdersProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

type AllTab = Exclude<OrderTab, 'seller'> | 'my-offers';

export default function MyOrders({ isAuthenticated, onLogout }: MyOrdersProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as OrderTab | null;
  const orderIdParam = searchParams.get('orderId');
  const sessionUser = getSession();
  const [activeTab, setActiveTab] = useState<AllTab>(tabParam || 'buyer');
  const [myOffers, setMyOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const validTabs: AllTab[] = ['buyer', 'my-offers', 'my-requests', 'my-responses', 'archive'];
    if (tabParam && validTabs.includes(tabParam as AllTab)) {
      setActiveTab(tabParam as AllTab);
    }
  }, [tabParam]);

  useEffect(() => {
    if (!sessionUser?.id) return;
    setOffersLoading(true);
    offersAPI.getOffers({ userId: sessionUser.id, status: 'all', limit: 100 })
      .then(res => setMyOffers(res.offers || []))
      .catch(() => setMyOffers([]))
      .finally(() => setOffersLoading(false));
  }, [sessionUser?.id]);
  
  const {
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
    handleRequestCompletion,
    handleDeleteOrder,
    handleOpenChat,
    handleCloseChat,
    handleSubmitReview,
    handleCloseReviewModal,
    loadOrders,
  } = useOrdersData(isAuthenticated, activeTab as OrderTab, (tab) => setActiveTab(tab));

  // При переходе после создания заказа — принудительно обновляем данные
  useEffect(() => {
    if (!location.state?.refresh || !location.state?.newOrderId) return;
    
    console.log('[MyOrders] Обнаружен флаг refresh с новым заказом:', location.state.newOrderId);
    navigate(location.pathname, { replace: true, state: {} });
    
    // Доп. загрузка через 1.5с на случай если первоначальная не подхватила новый заказ
    const timer = setTimeout(() => {
      loadOrders(false);
    }, 1500);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.refresh, location.state?.newOrderId]);

  useEffect(() => {
    if (!orderIdParam || isLoading) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`order-card-${orderIdParam}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
        setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2'), 3000);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [orderIdParam, isLoading]);

  useEffect(() => {
    const handleOpenOrderChat = async (event: CustomEvent) => {
      const { orderId, tab } = event.detail;
      
      if (tab && tab !== activeTab) {
        setActiveTab(tab);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      let order = orders.find(o => o.id === orderId);
      
      if (!order) {
        await loadOrders(true);
        await new Promise(resolve => setTimeout(resolve, 200));
        order = orders.find(o => o.id === orderId);
      }
      
      if (order) {
        handleOpenChat(order);
      }
    };

    window.addEventListener('openOrderChat' as any, handleOpenOrderChat);
    return () => window.removeEventListener('openOrderChat' as any, handleOpenOrderChat);
  }, [orders, activeTab]);

  const isArchived = (s: string) => s === 'completed' || s === 'cancelled' || s === 'archived' || s === 'rejected';
  const isTransportExpired = (order: Order) => {
    const dt = (order as unknown as Record<string, unknown>).offerTransportDateTime as string | undefined;
    return !!dt && new Date(dt) < new Date();
  };
  const isEffectivelyArchived = (order: Order) => isArchived(order.status) || isTransportExpired(order);
  const activeFilter = (order: Order) => !isEffectivelyArchived(order);
  const buyerOrdersCount = orders.filter(order => order.type === 'purchase' && !order.isRequest && activeFilter(order)).length;

  const myRequestsCount = orders.filter(order => order.isRequest && order.type === 'sale' && activeFilter(order)).length;
  const myResponsesCount = orders.filter(order => order.isRequest && order.type === 'purchase' && activeFilter(order)).length;
  const archiveOrdersCount = orders.filter(order => isEffectivelyArchived(order)).length;
  const myOffersCount = myOffers.filter(o => o.status !== 'archived').length;

  if (!isAuthenticated) {
    return null;
  }

  const handleRefresh = async () => {
    await loadOrders(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/20 to-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      <DataSyncIndicator isVisible={isSyncing} />
      
      <PullToRefresh onRefresh={handleRefresh}>
        <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
          <BackButton />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Мои заказы</h1>
            <p className="text-foreground">Управление заказами и общение с контрагентами</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AllTab)} className="mb-6" defaultValue="buyer">
            <TabsList className="grid w-full grid-cols-5 gap-0.5 mb-6 h-auto p-1">
              <TabsTrigger value="buyer" className="py-2 px-1 text-[11px] sm:text-xs leading-tight flex flex-col sm:flex-row gap-0.5 sm:gap-1">
                <span>Покупки</span>
                {buyerOrdersCount > 0 && <span className="text-[10px] font-bold text-primary">({buyerOrdersCount})</span>}
              </TabsTrigger>
              <TabsTrigger value="my-offers" className="py-2 px-1 text-[11px] sm:text-xs leading-tight flex flex-col sm:flex-row gap-0.5 sm:gap-1">
                <span>Продажи</span>
                {myOffersCount > 0 && <span className="text-[10px] font-bold text-primary">({myOffersCount})</span>}
              </TabsTrigger>
              <TabsTrigger value="my-requests" className="py-2 px-1 text-[11px] sm:text-xs leading-tight flex flex-col sm:flex-row gap-0.5 sm:gap-1">
                <span>Запросы</span>
                {myRequestsCount > 0 && <span className="text-[10px] font-bold text-primary">({myRequestsCount})</span>}
              </TabsTrigger>
              <TabsTrigger value="my-responses" className="py-2 px-1 text-[11px] sm:text-xs leading-tight flex flex-col sm:flex-row gap-0.5 sm:gap-1">
                <span>Отклики</span>
                {myResponsesCount > 0 && <span className="text-[10px] font-bold text-primary">({myResponsesCount})</span>}
              </TabsTrigger>
              <TabsTrigger value="archive" className="py-2 px-1 text-[11px] sm:text-xs leading-tight flex flex-col sm:flex-row gap-0.5 sm:gap-1">
                <span>Архив</span>
                {archiveOrdersCount > 0 && <span className="text-[10px] font-bold text-primary">({archiveOrdersCount})</span>}
              </TabsTrigger>
            </TabsList>

          <TabsContent value="buyer">
            <OrdersContent
              activeTab="buyer"
              onTabChange={setActiveTab}
              orders={orders}
              isLoading={isLoading}
              onOpenChat={handleOpenChat}
              onAcceptOrder={handleAcceptOrder}
              onCompleteOrder={handleCompleteOrder}
            />
          </TabsContent>

          <TabsContent value="my-offers">
            {offersLoading ? (
              <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">Загрузка предложений...</p></CardContent></Card>
            ) : myOffers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Icon name="Package" className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">У вас пока нет предложений</p>
                  <Button onClick={() => navigate('/create-offer')} size="sm">
                    <Icon name="Plus" className="h-4 w-4 mr-2" />
                    Создать предложение
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => navigate('/create-offer')} size="sm" variant="outline">
                    <Icon name="Plus" className="h-4 w-4 mr-2" />
                    Создать предложение
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {myOffers.map(offer => {
                    const image = offer.images?.[0]?.url;
                    const isTransport = offer.category === 'transport';
                    const statusLabels: Record<string, { label: string; color: string }> = {
                      active: { label: 'Активно', color: 'bg-green-500' },
                      moderation: { label: 'На модерации', color: 'bg-orange-500' },
                      pending: { label: 'На проверке', color: 'bg-yellow-500' },
                      archived: { label: 'В архиве', color: 'bg-slate-500' },
                    };
                    const statusInfo = statusLabels[offer.status || 'active'] || statusLabels.active;
                    return (
                      <Card key={offer.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-0">
                          <div className="relative aspect-video bg-muted overflow-hidden rounded-t-lg">
                            {image ? (
                              <img src={image} alt={offer.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Icon name="Package" className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute top-2 left-2">
                              <Badge className={`${statusInfo.color} text-white text-xs`}>{statusInfo.label}</Badge>
                            </div>
                          </div>
                          <div className="p-3 space-y-2">
                            <p className="font-semibold line-clamp-2">{offer.title}</p>
                            {isTransport && offer.transportRoute && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{offer.transportRoute}</p>
                            )}
                            <p className="text-sm font-bold text-primary">
                              {isTransport
                                ? (offer.transportNegotiable || !offer.transportPrice ? 'Договорная' : `${Number(offer.transportPrice).toLocaleString('ru-RU')} ₽`)
                                : `${offer.pricePerUnit?.toLocaleString('ru-RU')} ₽/${offer.unit}`
                              }
                            </p>
                            {(offer.responses ?? 0) > 0 && (
                              <p className="text-xs text-muted-foreground">{offer.responses} откликов</p>
                            )}
                            <div className="flex gap-2 pt-1">
                              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => navigate(`/offer/${offer.id}`)}>
                                <Icon name="Eye" className="h-3.5 w-3.5 mr-1" />
                                Просмотр
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => navigate(`/edit-offer/${offer.id}`)}>
                                <Icon name="Pencil" className="h-3.5 w-3.5 mr-1" />
                                Изменить
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-requests">
            <OrdersContent
              activeTab="my-requests"
              onTabChange={setActiveTab}
              orders={orders}
              isLoading={isLoading}
              onOpenChat={handleOpenChat}
              onAcceptOrder={handleAcceptOrder}
              onCompleteOrder={handleCompleteOrder}
            />
          </TabsContent>

          <TabsContent value="my-responses">
            <OrdersContent
              activeTab="my-responses"
              onTabChange={setActiveTab}
              orders={orders}
              isLoading={isLoading}
              onOpenChat={handleOpenChat}
              onAcceptOrder={handleAcceptOrder}
              onCompleteOrder={handleCompleteOrder}
              onDeleteOrder={handleDeleteOrder}
            />
          </TabsContent>

          <TabsContent value="archive">
            <OrdersContent
              activeTab="archive"
              onTabChange={setActiveTab}
              orders={orders}
              isLoading={isLoading}
              onOpenChat={handleOpenChat}
              onAcceptOrder={handleAcceptOrder}
            />
          </TabsContent>
        </Tabs>
        )}
        </main>
      </PullToRefresh>

      <Footer />

      {selectedOrder && (
        <OrderNegotiationModal
          isOpen={isChatOpen}
          onClose={handleCloseChat}
          order={selectedOrder}
          onAcceptOrder={currentUser?.id?.toString() === selectedOrder.sellerId ? () => handleAcceptOrder() : undefined}
          onCounterOffer={handleCounterOffer}
          onAcceptCounter={handleAcceptCounter}
          onCancelOrder={handleCancelOrder}
          onCompleteOrder={currentUser?.id?.toString() === selectedOrder.buyerId ? handleCompleteOrder : undefined}
          onRequestCompletion={currentUser?.id?.toString() === selectedOrder.sellerId ? handleRequestCompletion : undefined}
        />
      )}

      {pendingReviewOrder && (
        <OrderReviewModal
          isOpen={reviewModalOpen}
          onClose={handleCloseReviewModal}
          onSubmit={handleSubmitReview}
          offerTitle={pendingReviewOrder.offerTitle}
          sellerName={pendingReviewOrder.sellerName}
        />
      )}
    </div>
  );
}