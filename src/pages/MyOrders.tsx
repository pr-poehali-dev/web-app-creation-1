import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import OrderChatModal from '@/components/order/OrderChatModal';
import OrdersContent from '@/components/order/OrdersContent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrdersData } from '@/hooks/useOrdersData';

interface MyOrdersProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function MyOrders({ isAuthenticated, onLogout }: MyOrdersProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller' | 'archive'>('buyer');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  const {
    orders,
    selectedOrder,
    messages,
    isChatOpen,
    isLoading,
    currentUser,
    handleAcceptOrder,
    handleCounterOffer,
    handleAcceptCounter,
    handleCompleteOrder,
    handleOpenChat,
    handleCloseChat,
    handleSendMessage,
    loadOrders,
  } = useOrdersData(isAuthenticated, activeTab, setActiveTab);

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
  const buyerOrdersCount = orders.filter(order => order.type === 'purchase' && order.status !== 'completed').length;
  const sellerOrdersCount = orders.filter(order => order.type === 'sale' && order.status !== 'completed').length;
  const archiveOrdersCount = orders.filter(order => order.status === 'completed').length;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/20 to-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <BackButton />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Мои заказы</h1>
          <p className="text-muted-foreground">Управление заказами и общение с контрагентами</p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'buyer' | 'seller' | 'archive')} className="mb-6">
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