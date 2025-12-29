import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Order, ChatMessage } from '@/types/order';
import { getSession } from '@/utils/auth';
import OrderNegotiationSection from './OrderNegotiationSection';
import OrderChatInfoCard from './OrderChatInfoCard';
import OrderChatSection from './OrderChatSection';

interface OrderChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onAcceptOrder?: () => void;
  onCounterOffer?: (price: number, message: string) => void;
  onAcceptCounter?: () => void;
  onCompleteOrder?: () => void;
}

export default function OrderChatModal({
  isOpen,
  onClose,
  order,
  messages,
  onSendMessage,
  onAcceptOrder,
  onCounterOffer,
  onAcceptCounter,
  onCompleteOrder,
}: OrderChatModalProps) {
  const currentUser = getSession();
  const isBuyer = currentUser?.id?.toString() === order.buyerId?.toString();
  const isSeller = currentUser?.id?.toString() === order.sellerId?.toString();

  const contactPerson = isBuyer 
    ? { name: order.sellerName, phone: order.sellerPhone, email: order.sellerEmail }
    : { name: order.buyerName, phone: order.buyerPhone, email: order.buyerEmail };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[95vh] sm:h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b">
          <DialogTitle>Заказ {order.orderNumber ? `№${order.orderNumber}` : `#${order.id.slice(0, 8)}`}</DialogTitle>
        </DialogHeader>

        {/* Верхняя часть с функциями торга - прокручивается */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 min-h-0">
          <div className="space-y-3 py-3">
            <OrderNegotiationSection
              order={order}
              isBuyer={isBuyer}
              isSeller={isSeller}
              onCounterOffer={onCounterOffer}
              onAcceptCounter={onAcceptCounter}
              onCompleteOrder={onCompleteOrder}
            />

            <OrderChatInfoCard
              order={order}
              isBuyer={isBuyer}
              contactPerson={contactPerson}
            />
          </div>
        </div>

        {/* Нижняя часть с чатом - фиксированная */}
        <OrderChatSection
          messages={messages}
          currentUserId={currentUser?.id?.toString()}
          onSendMessage={onSendMessage}
          isCompleted={order.status === 'completed'}
        />
      </DialogContent>
    </Dialog>
  );
}