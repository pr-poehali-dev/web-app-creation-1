import { useState } from 'react';
import type { Order } from '@/types/order';
import NegotiationActions from './NegotiationActions';
import CounterOfferDisplay from './CounterOfferDisplay';
import CounterOfferForm from './CounterOfferForm';

interface OrderNegotiationSectionProps {
  order: Order;
  isBuyer: boolean;
  isSeller: boolean;
  onCounterOffer?: (price: number, message: string, quantity?: number) => void;
  onAcceptCounter?: () => void;
  onCancelOrder?: () => void;
  onCompleteOrder?: () => void;
}

export default function OrderNegotiationSection({
  order,
  isBuyer,
  isSeller,
  onCounterOffer,
  onAcceptCounter,
  onCancelOrder,
  onCompleteOrder,
}: OrderNegotiationSectionProps) {
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterPrice, setCounterPrice] = useState(order.pricePerUnit.toString());
  const [counterQuantity, setCounterQuantity] = useState(order.quantity.toString());
  const [counterMessage, setCounterMessage] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const handleCounterOffer = async () => {
    const price = parseFloat(counterPrice);
    const quantity = parseFloat(counterQuantity);
    console.log('[OrderNegotiation.handleCounterOffer] Validating:', { counterPrice, price, counterQuantity, quantity, isValid: !isNaN(price) && price > 0 && !isNaN(quantity) && quantity > 0 });
    
    if (isNaN(price) || price <= 0) {
      console.error('[OrderNegotiation.handleCounterOffer] Invalid price');
      return;
    }
    
    if (isNaN(quantity) || quantity <= 0) {
      console.error('[OrderNegotiation.handleCounterOffer] Invalid quantity');
      return;
    }
    
    if (onCounterOffer) {
      console.log('[OrderNegotiation.handleCounterOffer] Calling onCounterOffer with:', { price, quantity, message: counterMessage.trim() });
      try {
        await onCounterOffer(price, counterMessage.trim(), quantity);
        console.log('[OrderNegotiation.handleCounterOffer] Success, closing form');
        setShowCounterForm(false);
        setCounterMessage('');
      } catch (error) {
        console.error('[OrderNegotiation.handleCounterOffer] Error:', error);
      }
    } else {
      console.error('[OrderNegotiation.handleCounterOffer] onCounterOffer is not defined');
    }
  };

  return (
    <>
      <NegotiationActions
        order={order}
        isBuyer={isBuyer}
        showCounterForm={showCounterForm}
        onShowCounterForm={() => setShowCounterForm(true)}
        onCounterOffer={onCounterOffer}
      />

      <CounterOfferDisplay
        order={order}
        isBuyer={isBuyer}
        isSeller={isSeller}
        onAcceptCounter={onAcceptCounter}
        onShowCounterForm={() => setShowCounterForm(true)}
        onCancelOrder={onCancelOrder}
      />

      <CounterOfferForm
        order={order}
        isBuyer={isBuyer}
        isSeller={isSeller}
        showCounterForm={showCounterForm}
        counterPrice={counterPrice}
        counterQuantity={counterQuantity}
        counterMessage={counterMessage}
        onCounterPriceChange={setCounterPrice}
        onCounterQuantityChange={setCounterQuantity}
        onCounterMessageChange={setCounterMessage}
        onSubmit={handleCounterOffer}
        onCancel={() => setShowCounterForm(false)}
        onCounterOffer={onCounterOffer}
      />
    </>
  );
}
