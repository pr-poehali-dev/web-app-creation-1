import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DataSyncIndicator from '@/components/DataSyncIndicator';
import BackButton from '@/components/BackButton';
import OrderNegotiationModal from '@/components/order/OrderNegotiationModal';
import OrderReviewModal from '@/components/reviews/OrderReviewModal';
import OrdersContent from '@/components/order/OrdersContent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrdersData } from '@/hooks/useOrdersData';

interface MyOrdersProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function MyOrders({ isAuthenticated, onLogout }: MyOrdersProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as 'buyer' | 'seller' | 'archive' | null;
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller' | 'archive'>(tabParam || 'buyer');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (tabParam && (tabParam === 'buyer' || tabParam === 'seller' || tabParam === 'archive')) {
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

  // Обновляем заказы при переходе после создания нового заказа
  useEffect(() => {
    if (location.state?.refresh && location.state?.newOrderId) {
      console.log('[MyOrders] Обнаружен флаг refresh с новым заказом:', location.state.newOrderId);
      
      const updateOrders = async () => {
        let attempts = 0;
        const maxAttempts = 5;
        
        // Пытаемся загрузить заказы несколько раз, пока не найдем новый заказ
        while (attempts < maxAttempts) {
          console.log(`[MyOrders] Попытка ${attempts + 1} загрузки заказов`);
          await loadOrders(attempts === 0); // Показываем лоадер только при первой попытке
          
          // Небольшая задержка перед проверкой
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Проверяем, появился ли новый заказ
          const orderExists = orders.some(o => o.id === location.state.newOrderId);
          
          if (orderExists) {
            console.log('[MyOrders] Новый заказ найден, обновление завершено');
            break;
          }
          
          attempts++;
          
          // Задержка перед следующей попыткой (кроме последней)
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        // Очищаем state после завершения
        navigate(location.pathname, { replace: true, state: {} });
      };
      
      updateOrders();
    }
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

  // Считаем количество заказов для каждого типа
  const buyerOrdersCount = orders.filter(order => order.type === 'purchase' && order.status !== 'completed' && order.status !== 'cancelled').length;
  const sellerOrdersCount = orders.filter(order => order.type === 'sale' && order.status !== 'completed' && order.status !== 'cancelled').length;
  const archiveOrdersCount = orders.filter(order => order.status === 'completed' || order.status === 'cancelled').length;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/20 to-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      <DataSyncIndicator isVisible={isSyncing} />
        
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
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'buyer' | 'seller' | 'archive')} className="mb-6"  defaultValue="buyer">
            <TabsList className="grid w-full max-w-md grid-cols-3 gap-2 mb-6 h-auto p-1">
              <TabsTrigger value="buyer" className="py-2.5">
                Я покупатель {buyerOrdersCount > 0 && `(${buyerOrdersCount})`}
              </TabsTrigger>
              <TabsTrigger value="seller" className="py-2.5">
                Я продавец {sellerOrdersCount > 0 && `(${sellerOrdersCount})`}
              </TabsTrigger>
              <TabsTrigger value="archive" className="py-2.5">
                Архив {archiveOrdersCount > 0 && `(${archiveOrdersCount})`}
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