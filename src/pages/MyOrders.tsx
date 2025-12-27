import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import OrderChatModal from '@/components/order/OrderChatModal';
import OrdersContent from '@/components/order/OrdersContent';
import { useOrdersData } from '@/hooks/useOrdersData';

interface MyOrdersProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function MyOrders({ isAuthenticated, onLogout }: MyOrdersProps) {
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller' | 'archive'>('buyer');
  
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/20 to-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <BackButton />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Мои заказы</h1>
          <p className="text-muted-foreground">Управление заказами и общение с контрагентами</p>
        </div>

        <OrdersContent
          activeTab={activeTab}
          onTabChange={setActiveTab}
          orders={orders}
          isLoading={isLoading}
          onOpenChat={handleOpenChat}
          onAcceptOrder={handleAcceptOrder}
        />
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