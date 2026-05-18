import { useState } from 'react';
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
import ChatImageLightbox from './ChatImageLightbox';

interface OrderNegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onAcceptOrder?: () => void;
  onCounterOffer?: (price: number, message: string) => void;
  onAcceptCounter?: () => void;
  onCancelOrder?: (orderId?: string, reason?: string) => void;
  onCompleteOrder?: () => void;
  onRequestCompletion?: (orderId: string) => void;
  onCancelTrip?: (offerId: string, reason: string) => void;
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
  onRequestCompletion,
  onCancelTrip,
}: OrderNegotiationModalProps) {
  const currentUser = getSession();
  const isBuyer = currentUser?.id?.toString() === order.buyerId?.toString();
  const isSeller = currentUser?.id?.toString() === order.sellerId?.toString();
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const contactPerson = isBuyer 
    ? { name: order.sellerName, phone: order.sellerPhone, email: order.sellerEmail }
    : { name: order.buyerName, phone: order.buyerPhone, email: order.buyerEmail };

  return (
    <Dialog open={isOpen} onOpenChange={lightboxUrl ? undefined : onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0" onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="sticky top-0 z-10 bg-background border-b px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
          <DialogTitle className="text-lg font-semibold leading-none tracking-tight pr-8">
            {(order.status === 'pending' || order.status === 'new' || order.status === 'negotiating')
              ? <span>Обсуждение заказа и торг</span>
              : <span>Заказ {order.orderNumber ? `№${order.orderNumber}` : `#${order.id.slice(0, 8)}`}</span>
            }
          </DialogTitle>
        </div>

        <div className="space-y-4 px-4 sm:px-6 py-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
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
            onLightboxOpen={setLightboxUrl}
            onCancelOrder={onCancelOrder ? (orderId, reason) => onCancelOrder(orderId, reason) : undefined}
            onCompleteOrder={onCompleteOrder ? () => onCompleteOrder() : undefined}
            onAcceptOrder={onAcceptOrder ? () => onAcceptOrder() : undefined}
            onRequestCompletion={onRequestCompletion}
            onCancelTrip={onCancelTrip}
          />
        </div>

        {lightboxUrl && (
          <ChatImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
        )}
      </DialogContent>
    </Dialog>
  );
}