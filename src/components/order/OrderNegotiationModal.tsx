import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Order } from '@/types/order';
import { getSession } from '@/utils/auth';
import OrderNegotiationSection from './OrderNegotiationSection';
import OrderChatInfoCard from './OrderChatInfoCard';

interface OrderNegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onAcceptOrder?: () => void;
  onCounterOffer?: (price: number, message: string) => void;
  onAcceptCounter?: () => void;
  onCancelOrder?: () => void;
  onCompleteOrder?: () => void;
}

export default function OrderNegotiationModal({
  isOpen,
  onClose,
  order,
  onAcceptOrder,
  onCounterOffer,
  onAcceptCounter,
  onCancelOrder,
  onCompleteOrder,
}: OrderNegotiationModalProps) {
  const currentUser = getSession();
  const isBuyer = currentUser?.id?.toString() === order.buyerId?.toString();
  const isSeller = currentUser?.id?.toString() === order.sellerId?.toString();

  const contactPerson = isBuyer 
    ? { name: order.sellerName, phone: order.sellerPhone, email: order.sellerEmail }
    : { name: order.buyerName, phone: order.buyerPhone, email: order.buyerEmail };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b">
          <DialogTitle>Заказ {order.orderNumber ? `№${order.orderNumber}` : `#${order.id.slice(0, 8)}`}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
            <OrderNegotiationSection
              order={order}
              isBuyer={isBuyer}
              isSeller={isSeller}
              onCounterOffer={onCounterOffer}
              onAcceptCounter={onAcceptCounter}
              onCancelOrder={onCancelOrder}
              onCompleteOrder={onCompleteOrder}
            />

            <OrderChatInfoCard
              order={order}
              isBuyer={isBuyer}
              contactPerson={contactPerson}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}