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
import { useOrdersData, type OrderTab } from '@/hooks/useOrdersData';

interface MyOrdersProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function MyOrders({ isAuthenticated, onLogout }: MyOrdersProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as OrderTab | null;
  const [activeTab, setActiveTab] = useState<OrderTab>(tabParam || 'buyer');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const validTabs: OrderTab[] = ['buyer', 'seller', 'my-requests', 'my-responses', 'archive'];
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  
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
    handleOpenChat,
    handleCloseChat,
    handleSubmitReview,
    handleCloseReviewModal,
    loadOrders,
  } = useOrdersData(isAuthenticated, activeTab, setActiveTab);

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

  const activeFilter = (order: { status: string }) => order.status !== 'completed' && order.status !== 'cancelled';
  const buyerOrdersCount = orders.filter(order => order.type === 'purchase' && !order.isRequest && activeFilter(order)).length;
  const sellerOrdersCount = orders.filter(order => order.type === 'sale' && !order.isRequest && activeFilter(order)).length;
  const myRequestsCount = orders.filter(order => order.isRequest && order.type === 'sale' && activeFilter(order)).length;
  const myResponsesCount = orders.filter(order => order.isRequest && order.type === 'purchase' && activeFilter(order)).length;
  const archiveOrdersCount = orders.filter(order => order.status === 'completed' || order.status === 'cancelled').length;

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
            <p className="text-muted-foreground">Управление заказами и общение с контрагентами</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as OrderTab)} className="mb-6" defaultValue="buyer">
            <TabsList className="grid w-full max-w-3xl grid-cols-5 gap-1 mb-6 h-auto p-1">
              <TabsTrigger value="buyer" className="py-2.5 px-1 text-[11px] sm:text-sm leading-tight">
                Покупки{buyerOrdersCount > 0 ? ` (${buyerOrdersCount})` : ''}
              </TabsTrigger>
              <TabsTrigger value="seller" className="py-2.5 px-1 text-[11px] sm:text-sm leading-tight">
                Продажи{sellerOrdersCount > 0 ? ` (${sellerOrdersCount})` : ''}
              </TabsTrigger>
              <TabsTrigger value="my-requests" className="py-2.5 px-1 text-[11px] sm:text-sm leading-tight">
                Запросы{myRequestsCount > 0 ? ` (${myRequestsCount})` : ''}
              </TabsTrigger>
              <TabsTrigger value="my-responses" className="py-2.5 px-1 text-[11px] sm:text-sm leading-tight">
                Отклики{myResponsesCount > 0 ? ` (${myResponsesCount})` : ''}
              </TabsTrigger>
              <TabsTrigger value="archive" className="py-2.5 px-1 text-[11px] sm:text-sm leading-tight">
                Архив{archiveOrdersCount > 0 ? ` (${archiveOrdersCount})` : ''}
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

          <TabsContent value="seller">
            <OrdersContent
              activeTab="seller"
              onTabChange={setActiveTab}
              orders={orders}
              isLoading={isLoading}
              onOpenChat={handleOpenChat}
              onAcceptOrder={handleAcceptOrder}
            />
          </TabsContent>

          <TabsContent value="my-requests">
            <OrdersContent
              activeTab="my-requests"
              onTabChange={setActiveTab}
              orders={orders}
              isLoading={isLoading}
              onOpenChat={handleOpenChat}
              onAcceptOrder={handleAcceptOrder}
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