import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useOrderForm, type TransportWaypoint } from './order-modal/useOrderForm';
import OrderFormBody from './order-modal/OrderFormBody';
import OrderMapOverlays from './order-modal/OrderMapOverlays';

interface OfferOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (orderData: any) => void;
  remainingQuantity: number;
  minOrderQuantity?: number;
  unit: string;
  pricePerUnit: number;
  availableDeliveryTypes: ('pickup' | 'delivery')[];
  availableDistricts?: string[];
  offerDistrict?: string;
  offerCategory?: string;
  offerTransportRoute?: string;
  offerTransportWaypoints?: TransportWaypoint[];
  offerTransportPriceType?: string;
  offerTransportNegotiable?: boolean;
  offerTransportDateTime?: string;
  offerTransportServiceType?: string;
  offerTransportCapacity?: string;
  noNegotiation?: boolean;
  createdOrderId?: string | null;
  currentUserId?: string;
  onSendChatMessage?: (orderId: string, text: string) => Promise<void>;
}

export default function OfferOrderModal({
  isOpen,
  onClose,
  onSubmit,
  remainingQuantity,
  minOrderQuantity,
  unit,
  pricePerUnit,
  availableDeliveryTypes,
  availableDistricts = [],
  offerCategory,
  offerTransportRoute,
  offerTransportWaypoints = [],
  offerTransportPriceType,
  offerTransportNegotiable,
  offerTransportDateTime,
  offerTransportServiceType,
  offerTransportCapacity,
  noNegotiation,
  createdOrderId,
  onSendChatMessage,
}: OfferOrderModalProps) {
  const form = useOrderForm({
    remainingQuantity,
    minOrderQuantity,
    unit,
    pricePerUnit,
    availableDeliveryTypes,
    offerCategory,
    offerTransportRoute,
    offerTransportWaypoints,
    offerTransportCapacity,
    offerTransportServiceType,
    createdOrderId,
    onSubmit,
    onSendChatMessage,
  });

  return (
    <>
      <Dialog open={isOpen && !form.isMapOpen && !form.isPickupMapOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4 pr-10">
              <DialogTitle>
                {createdOrderId ? 'Обсуждение заказа' : offerCategory === 'utilities' ? 'Написать исполнителю' : 'Оформление заказа'}
              </DialogTitle>
              {!createdOrderId && offerCategory !== 'utilities' && (
                <div className="text-sm font-bold text-black whitespace-nowrap">
                  Доступно: {remainingQuantity} {unit}
                </div>
              )}
            </div>
            {!createdOrderId && (
              <DialogDescription>
                {offerCategory === 'utilities'
                  ? 'Опишите вашу задачу, и исполнитель свяжется с вами'
                  : 'Заполните форму, и мы свяжемся с вами для подтверждения заказа'}
              </DialogDescription>
            )}
          </DialogHeader>

          <OrderFormBody
            offerCategory={offerCategory}
            offerTransportDateTime={offerTransportDateTime}
            offerTransportRoute={offerTransportRoute}
            offerTransportWaypoints={offerTransportWaypoints}
            offerTransportPriceType={offerTransportPriceType}
            offerTransportNegotiable={offerTransportNegotiable}
            noNegotiation={noNegotiation}
            unit={unit}
            pricePerUnit={pricePerUnit}
            remainingQuantity={remainingQuantity}
            minOrderQuantity={minOrderQuantity}
            availableDeliveryTypes={availableDeliveryTypes}
            availableDistricts={availableDistricts}
            createdOrderId={createdOrderId}
            isFreight={!!form.isFreight}
            capacityUnit={form.capacityUnit}
            effectivePricePerUnit={form.effectivePricePerUnit}
            quantity={form.quantity}
            quantityError={form.quantityError}
            address={form.address}
            comment={form.comment}
            addressError={form.addressError}
            selectedDeliveryType={form.selectedDeliveryType}
            passengerRoute={form.passengerRoute}
            selectedWaypoint={form.selectedWaypoint}
            customPickupAddress={form.customPickupAddress}
            showCounterPrice={form.showCounterPrice}
            counterPrice={form.counterPrice}
            counterComment={form.counterComment}
            chatMessages={form.chatMessages}
            chatText={form.chatText}
            isSendingMessage={form.isSendingMessage}
            chatScrollRef={form.chatScrollRef}
            onQuantityChange={form.handleQuantityChange}
            onIncrement={form.incrementQuantity}
            onDecrement={form.decrementQuantity}
            onQuantityErrorClear={() => form.setQuantityError('')}
            onDeliveryTypeChange={form.setSelectedDeliveryType}
            onAddressChange={form.setAddress}
            onCommentChange={form.setComment}
            onAddressBlur={() => form.validateAddress(form.address)}
            onMapOpen={() => form.setIsMapOpen(true)}
            onAddressErrorClear={() => form.setAddressError('')}
            onWaypointChange={form.handleWaypointChange}
            onPassengerRouteChange={form.setPassengerRoute}
            onPickupMapOpen={() => form.setIsPickupMapOpen(true)}
            onToggleCounterPrice={() => form.setShowCounterPrice(!form.showCounterPrice)}
            onCounterPriceChange={form.setCounterPrice}
            onCounterCommentChange={form.setCounterComment}
            onChatTextChange={form.setChatText}
            onSendChatMessage={form.handleSendChatMessage}
            onClose={onClose}
            onSubmit={form.handleSubmit}
          />
        </DialogContent>
      </Dialog>

      <OrderMapOverlays
        isMapOpen={form.isMapOpen}
        isPickupMapOpen={form.isPickupMapOpen}
        gpsCoordinates={form.gpsCoordinates}
        pickupGpsCoordinates={form.pickupGpsCoordinates}
        onDeliveryMapClose={() => form.setIsMapOpen(false)}
        onPickupMapClose={() => form.setIsPickupMapOpen(false)}
        onCoordinatesChange={form.handleCoordinatesChange}
        onPickupCoordinatesChange={form.setPickupGpsCoordinates}
        onAddressChange={form.handleAddressChange}
        onPickupAddressFromMap={form.handlePickupAddressFromMap}
      />
    </>
  );
}