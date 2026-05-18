import Icon from '@/components/ui/icon';
import QuantitySelector from './QuantitySelector';
import PriceDisplay from './PriceDisplay';
import DeliverySection from './DeliverySection';
import CounterPriceSection from './CounterPriceSection';
import TransportDateBadge from './TransportDateBadge';
import TransportSection from './TransportSection';
import OrderFormActions from './OrderFormActions';
import OrderInlineChat from './OrderInlineChat';
import type { InlineChatMessage } from './useOrderForm';

interface TransportWaypoint {
  id: string;
  address: string;
  price?: number;
  isActive: boolean;
}

interface OrderFormBodyProps {
  offerCategory?: string;
  offerTransportDateTime?: string;
  offerTransportRoute?: string;
  offerTransportWaypoints: TransportWaypoint[];
  offerTransportPriceType?: string;
  offerTransportNegotiable?: boolean;
  noNegotiation?: boolean;
  unit: string;
  pricePerUnit: number;
  remainingQuantity: number;
  minOrderQuantity?: number;
  availableDeliveryTypes: ('pickup' | 'delivery')[];
  availableDistricts: string[];
  createdOrderId?: string | null;

  isFreight: boolean;
  capacityUnit: string;
  effectivePricePerUnit: number;

  quantity: string;
  quantityError: string;
  address: string;
  comment: string;
  addressError: string;
  selectedDeliveryType: 'pickup' | 'delivery' | '';
  passengerRoute: string;
  selectedWaypoint: string;
  customPickupAddress: string;
  showCounterPrice: boolean;
  counterPrice: string;
  counterComment: string;
  chatMessages: InlineChatMessage[];
  chatText: string;
  isSendingMessage: boolean;
  chatScrollRef: React.RefObject<HTMLDivElement>;

  onQuantityChange: (v: string) => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onQuantityErrorClear: () => void;
  onDeliveryTypeChange: (v: 'pickup' | 'delivery' | '') => void;
  onAddressChange: (v: string) => void;
  onCommentChange: (v: string) => void;
  onAddressBlur: () => void;
  onMapOpen: () => void;
  onAddressErrorClear: () => void;
  onWaypointChange: (waypoint: string, route: string) => void;
  onPassengerRouteChange: (v: string) => void;
  onPickupMapOpen: () => void;
  onToggleCounterPrice: () => void;
  onCounterPriceChange: (v: string) => void;
  onCounterCommentChange: (v: string) => void;
  onChatTextChange: (v: string) => void;
  onSendChatMessage: () => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function OrderFormBody({
  offerCategory,
  offerTransportDateTime,
  offerTransportRoute,
  offerTransportWaypoints,
  offerTransportPriceType,
  offerTransportNegotiable,
  noNegotiation,
  unit,
  pricePerUnit,
  remainingQuantity,
  minOrderQuantity,
  availableDeliveryTypes,
  availableDistricts,
  createdOrderId,
  isFreight,
  capacityUnit,
  effectivePricePerUnit,
  quantity,
  quantityError,
  address,
  comment,
  addressError,
  selectedDeliveryType,
  passengerRoute,
  selectedWaypoint,
  customPickupAddress,
  showCounterPrice,
  counterPrice,
  counterComment,
  chatMessages,
  chatText,
  isSendingMessage,
  chatScrollRef,
  onQuantityChange,
  onIncrement,
  onDecrement,
  onQuantityErrorClear,
  onDeliveryTypeChange,
  onAddressChange,
  onCommentChange,
  onAddressBlur,
  onMapOpen,
  onAddressErrorClear,
  onWaypointChange,
  onPassengerRouteChange,
  onPickupMapOpen,
  onToggleCounterPrice,
  onCounterPriceChange,
  onCounterCommentChange,
  onChatTextChange,
  onSendChatMessage,
  onClose,
  onSubmit,
}: OrderFormBodyProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {offerCategory === 'transport' && offerTransportDateTime && (
        <TransportDateBadge dateTime={offerTransportDateTime} />
      )}

      {offerCategory !== 'auto-sale' && offerCategory !== 'utilities' && (
        <QuantitySelector
          quantity={quantity}
          unit={offerCategory === 'transport' ? capacityUnit : unit}
          minOrderQuantity={minOrderQuantity}
          remainingQuantity={remainingQuantity}
          quantityError={quantityError}
          onQuantityChange={onQuantityChange}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          onErrorClear={onQuantityErrorClear}
        />
      )}

      {offerCategory !== 'utilities' && (
        <PriceDisplay
          pricePerUnit={effectivePricePerUnit}
          quantity={quantity}
          unit={unit}
          quantityError={quantityError}
          showCounterPrice={showCounterPrice}
          priceType={offerTransportPriceType}
          isNegotiable={offerTransportNegotiable}
          isTransport={offerCategory === 'transport'}
        />
      )}

      {offerCategory === 'transport' && (
        <TransportSection
          isFreight={!!isFreight}
          passengerRoute={passengerRoute}
          offerTransportRoute={offerTransportRoute}
          offerTransportWaypoints={offerTransportWaypoints}
          selectedWaypoint={selectedWaypoint}
          customPickupAddress={customPickupAddress}
          pricePerUnit={pricePerUnit}
          onWaypointChange={onWaypointChange}
          onPassengerRouteChange={onPassengerRouteChange}
          onPickupMapOpen={onPickupMapOpen}
        />
      )}

      <DeliverySection
        availableDeliveryTypes={availableDeliveryTypes}
        selectedDeliveryType={selectedDeliveryType}
        address={address}
        comment={comment}
        addressError={addressError}
        availableDistricts={availableDistricts}
        isService={offerCategory === 'utilities'}
        onDeliveryTypeChange={onDeliveryTypeChange}
        onAddressChange={onAddressChange}
        onCommentChange={onCommentChange}
        onAddressBlur={onAddressBlur}
        onMapOpen={onMapOpen}
        onAddressErrorClear={onAddressErrorClear}
      />

      {offerCategory !== 'utilities' && (noNegotiation ? (
        <div className="border-t pt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Icon name="Lock" size={14} />
          <span>Цена фиксирована, торг не предусмотрен</span>
        </div>
      ) : (
        <CounterPriceSection
          showCounterPrice={showCounterPrice}
          pricePerUnit={pricePerUnit}
          counterPrice={counterPrice}
          counterComment={counterComment}
          quantity={quantity}
          unit={unit}
          onToggle={onToggleCounterPrice}
          onCounterPriceChange={onCounterPriceChange}
          onCounterCommentChange={onCounterCommentChange}
        />
      ))}

      {createdOrderId ? (
        <OrderInlineChat
          createdOrderId={createdOrderId}
          chatMessages={chatMessages}
          chatText={chatText}
          isSendingMessage={isSendingMessage}
          chatScrollRef={chatScrollRef}
          onChatTextChange={onChatTextChange}
          onSend={onSendChatMessage}
          onClose={onClose}
        />
      ) : (
        <OrderFormActions
          quantityError={quantityError}
          addressError={addressError}
          onClose={onClose}
        />
      )}
    </form>
  );
}