import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OfferInfoTab from './OfferInfoTab';
import OfferOrdersTab from './OfferOrdersTab';
import OfferMessagesTab from './OfferMessagesTab';
import type { Offer } from '@/types/offer';
import type { Order } from '@/types/order';

interface ChatMessage {
  id: string;
  orderId: string;
  orderNumber: string;
  buyerName: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

interface EditOfferTabsProps {
  offer: Offer;
  orders: Order[];
  messages: ChatMessage[];
  activeTab: string;
  hasChanges: boolean;
  initialEditMode?: boolean;
  onTabChange: (tab: string) => void;
  onOpenChat: (order: Order) => void;
  onAcceptOrder: (orderId: string) => void;
  onMessageClick: (orderId: string) => void;
  onDelete?: () => void;
  onUpdate?: () => void;
}

export default function EditOfferTabs({
  offer,
  orders,
  messages,
  activeTab,
  hasChanges,
  initialEditMode = false,
  onTabChange,
  onOpenChat,
  onAcceptOrder,
  onMessageClick,
  onDelete,
  onUpdate,
}: EditOfferTabsProps) {
  const unreadCount = messages.filter(m => !m.isRead).length;

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} defaultValue="info">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="info">Информация</TabsTrigger>
        <TabsTrigger value="orders">
          Заказы {orders.length > 0 && `(${orders.length})`}
        </TabsTrigger>
        <TabsTrigger value="messages" className="relative">
          Сообщения {messages.length > 0 && `(${messages.length})`}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="info">
        <OfferInfoTab 
          offer={offer} 
          hasChanges={hasChanges}
          initialEditMode={initialEditMode}
          onDelete={onDelete || (() => {})}
          onUpdate={onUpdate || (() => {})}
        />
      </TabsContent>

      <TabsContent value="orders">
        <OfferOrdersTab
          orders={orders}
          onOpenChat={onOpenChat}
          onAcceptOrder={onAcceptOrder}
        />
      </TabsContent>

      <TabsContent value="messages">
        <OfferMessagesTab
          messages={messages}
          onMessageClick={onMessageClick}
        />
      </TabsContent>
    </Tabs>
  );
}