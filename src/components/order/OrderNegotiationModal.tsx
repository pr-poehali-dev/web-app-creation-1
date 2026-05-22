import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { Order } from '@/types/order';
import { getSession } from '@/utils/auth';
import OrderNegotiationSection from './OrderNegotiationSection';
import OrderChatInfoCard from './OrderChatInfoCard';
import ChatImageLightbox from './ChatImageLightbox';
import { sendInvitation } from '@/services/onlineInvite';

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
  const [inviteSending, setInviteSending] = useState(false);

  const contactPerson = isBuyer 
    ? { name: order.sellerName, phone: order.sellerPhone, email: order.sellerEmail }
    : { name: order.buyerName, phone: order.buyerPhone, email: order.buyerEmail };

  const counterpartId = isBuyer ? order.sellerId : order.buyerId;
  const counterpartName = isBuyer ? order.sellerName : order.buyerName;

  const handleSendInvite = async () => {
    if (!currentUser?.id || !counterpartId) return;
    setInviteSending(true);
    // order.id — UUID строка, counterpartId — числовой id пользователя
    const invId = await sendInvitation(Number(currentUser.id), Number(counterpartId), order.id);
    setInviteSending(false);
    if (invId) {
      window.dispatchEvent(new CustomEvent('onlineInviteSent', {
        detail: { invitationId: invId, orderId: order.id, recipientName: counterpartName },
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={lightboxUrl ? undefined : onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0" onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="sticky top-0 z-10 bg-background border-b px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
          <div className="flex items-center justify-between gap-2 pr-8">
            <DialogTitle className="text-lg font-semibold leading-none tracking-tight">
              {(order.status === 'pending' || order.status === 'new' || order.status === 'negotiating')
                ? <span>Обсуждение заказа и торг</span>
                : <span>Заказ {order.orderNumber ? `№${order.orderNumber}` : `#${order.id.slice(0, 8)}`}</span>
              }
            </DialogTitle>
            {(isBuyer || isSeller) && counterpartId && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5 shrink-0 border-primary/40 text-primary hover:bg-primary/10"
                onClick={handleSendInvite}
                disabled={inviteSending}
              >
                <Icon name="PhoneCall" size={13} />
                {inviteSending ? 'Отправка…' : 'Позвать онлайн'}
              </Button>
            )}
          </div>
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