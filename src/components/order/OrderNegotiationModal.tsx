import { useEffect, useRef, useState } from 'react';
import type { Order } from '@/types/order';
import { getSession } from '@/utils/auth';
import OrderNegotiationSection from './OrderNegotiationSection';
import OrderChatInfoCard from './OrderChatInfoCard';
import Icon from '@/components/ui/icon';

interface OrderNegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onAcceptOrder?: () => void;
  onCounterOffer?: (price: number, message: string) => void;
  onAcceptCounter?: () => void;
  onCancelOrder?: (orderId?: string, reason?: string) => void;
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

  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTranslateX(0);
      setTranslateY(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy < -10 || Math.abs(dx) > 10) {
      setTranslateX(dx);
      setTranslateY(Math.min(0, dy));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const THRESHOLD = 80;
    if (Math.abs(translateX) > THRESHOLD || translateY < -THRESHOLD) {
      onClose();
    } else {
      setTranslateX(0);
      setTranslateY(0);
    }
  };

  if (!isOpen) return null;

  const opacity = Math.max(0.2, 1 - (Math.abs(translateX) + Math.abs(translateY)) / 300);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-200"
        style={{ opacity }}
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        className="relative z-10 w-full sm:max-w-2xl bg-background rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl"
        style={{
          maxHeight: '92dvh',
          transform: `translateX(${translateX}px) translateY(${translateY}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s ease',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 border-b">
          <div className="sm:hidden w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
          <h2 className="font-semibold text-base">
            Заказ {order.orderNumber ? `№${order.orderNumber}` : `#${order.id.slice(0, 8)}`}
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 transition-colors text-white shrink-0 ml-2"
            aria-label="Закрыть"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

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
              onCancelOrder={onCancelOrder ? (orderId, reason) => onCancelOrder(orderId, reason) : undefined}
              onCompleteOrder={onCompleteOrder ? () => onCompleteOrder() : undefined}
              onAcceptOrder={onAcceptOrder ? () => onAcceptOrder() : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
