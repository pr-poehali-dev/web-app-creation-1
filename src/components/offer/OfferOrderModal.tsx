import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import MapModal from '@/components/auction/MapModal';
import QuantitySelector from './order-modal/QuantitySelector';
import PriceDisplay from './order-modal/PriceDisplay';
import DeliverySection from './order-modal/DeliverySection';
import CounterPriceSection from './order-modal/CounterPriceSection';
import TransportDateBadge from './order-modal/TransportDateBadge';
import TransportSection from './order-modal/TransportSection';
import OrderFormActions from './order-modal/OrderFormActions';

function shortenAddress(fullAddress: string): string {
  return fullAddress
    .replace('Республика Саха (Якутия)', 'РС(Я)')
    .replace('Респ Саха (Якутия)', 'РС(Я)')
    .replace('Республика Саха', 'РС(Я)')
    .replace('Московская область', 'МО')
    .replace('Ленинградская область', 'ЛО')
    .replace('Республика', 'Р.')
    .replace('область', 'обл.')
    .replace('край', 'кр.')
    .replace('улица', '')
    .replace(/,\s+,/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}

interface TransportWaypoint {
  id: string;
  address: string;
  price?: number;
  isActive: boolean;
}

interface OfferOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  offerDistrict,
  offerCategory,
  offerTransportRoute,
  offerTransportWaypoints = [],
  offerTransportPriceType,
  offerTransportNegotiable,
  offerTransportDateTime,
  offerTransportServiceType,
  offerTransportCapacity,
  noNegotiation,
}: OfferOrderModalProps) {
  const isFreight = offerTransportServiceType?.toLowerCase().includes('груз');

  const capacityUnit = (() => {
    if (!offerTransportCapacity) return unit || 'мест';
    const match = offerTransportCapacity.trim().match(/^[\d.,]+\s*(.+)$/);
    return match ? match[1].trim() : (unit || 'мест');
  })();

  const currentUser = getSession();
  const { toast } = useToast();
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<'pickup' | 'delivery' | ''>('');
  const [quantity, setQuantity] = useState<string>(String(minOrderQuantity || 1));
  const [address, setAddress] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [passengerRoute, setPassengerRoute] = useState<string>('');
  const [selectedWaypoint, setSelectedWaypoint] = useState<string>('');
  const [customPickupAddress, setCustomPickupAddress] = useState<string>('');
  const [quantityError, setQuantityError] = useState<string>('');
  const [counterPrice, setCounterPrice] = useState<string>('');
  const [counterComment, setCounterComment] = useState<string>('');
  const [showCounterPrice, setShowCounterPrice] = useState<boolean>(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isPickupMapOpen, setIsPickupMapOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [addressError, setAddressError] = useState<string>('');
  const [gpsCoordinates, setGpsCoordinates] = useState<string>('');
  const [addressSetFromMap, setAddressSetFromMap] = useState<boolean>(false);
  const [pickupGpsCoordinates, setPickupGpsCoordinates] = useState<string>('');

  useEffect(() => {
    if (availableDeliveryTypes.length === 1) {
      setSelectedDeliveryType(availableDeliveryTypes[0]);
    }
  }, [availableDeliveryTypes]);

  useEffect(() => {
    if (currentUser?.legalAddress && selectedDeliveryType === 'delivery' && !addressSetFromMap) {
      const shortened = shortenAddress(currentUser.legalAddress);
      setAddress(shortened);
    }
  }, [currentUser, selectedDeliveryType, addressSetFromMap]);

  useEffect(() => {
    const numQuantity = Number(quantity);
    if (minOrderQuantity && numQuantity < minOrderQuantity) {
      setQuantity(String(minOrderQuantity));
    }
  }, [minOrderQuantity]);

  useEffect(() => {
    console.log('📍 Address state changed to:', address);
  }, [address]);

  const handleQuantityChange = (value: string) => {
    setQuantity(value);

    const numValue = Number(value);
    const minValue = minOrderQuantity || 1;

    if (value === '' || isNaN(numValue) || numValue < minValue) {
      setQuantityError(`Минимальное количество для заказа: ${minValue} ${unit}`);
    } else if (numValue > remainingQuantity) {
      setQuantityError(`Доступно только ${remainingQuantity} ${unit}`);
    } else {
      setQuantityError('');
    }
  };

  const incrementQuantity = () => {
    const newValue = Number(quantity) + 1;
    if (newValue <= remainingQuantity) {
      handleQuantityChange(String(newValue));
    }
  };

  const decrementQuantity = () => {
    const minValue = minOrderQuantity || 1;
    const newValue = Number(quantity) - 1;
    if (newValue >= minValue) {
      handleQuantityChange(String(newValue));
    }
  };

  const handleCoordinatesChange = (coords: string) => {
    setGpsCoordinates(coords);
    const [lat, lng] = coords.split(',').map(c => parseFloat(c.trim()));
    if (!isNaN(lat) && !isNaN(lng)) {
      setSelectedLocation({ lat, lng });
    }
  };

  const extractShortAddress = (fullAddress: string): string => {
    const parts = fullAddress.split(',').map(p => p.trim());
    const streetPart = parts.find(p => /улица|ул\.|проспект|пр\.|переулок|пер\.|шоссе|бульвар|набережная|площадь|алея/i.test(p));
    const housePart = parts.find(p => /^\d[\dа-яёА-ЯЁ/]*$/.test(p) && parts.indexOf(p) > (streetPart ? parts.indexOf(streetPart) : -1));
    if (streetPart) {
      const streetClean = streetPart
        .replace(/улица/i, 'ул.')
        .replace(/проспект/i, 'пр.')
        .replace(/переулок/i, 'пер.')
        .replace(/бульвар/i, 'бул.')
        .replace(/набережная/i, 'наб.')
        .replace(/площадь/i, 'пл.');
      return housePart ? `${streetClean} ${housePart}` : streetClean;
    }
    return parts.slice(0, 2).join(', ');
  };

  const handlePickupAddressFromMap = (fullAddress: string, _district: string, coords?: string) => {
    const shortAddr = extractShortAddress(fullAddress);
    setCustomPickupAddress(shortAddr);
    setSelectedWaypoint('__custom__');
    if (coords) setPickupGpsCoordinates(coords);
    if (offerTransportRoute) {
      const routeEnd = offerTransportRoute.split(/\s*[-–—]\s*/).pop()?.trim() || '';
      if (routeEnd) {
        const cityPart = shortAddr.split(',')[0].split(' ').slice(-1)[0] || shortAddr;
        setPassengerRoute(`${cityPart} — ${routeEnd}`);
      }
    }
  };

  const handleAddressChange = (fullAddress: string, district: string, coords?: string) => {
    console.log('📍 OfferOrderModal handleAddressChange called:', { fullAddress, district, coords });
    console.log('📍 Setting address to:', fullAddress);
    setAddress(fullAddress);
    setAddressSetFromMap(true);
    setAddressError('');
    if (coords) {
      console.log('📍 Setting GPS coordinates to:', coords);
      setGpsCoordinates(coords);
      const [lat, lng] = coords.split(',').map(c => parseFloat(c.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        setSelectedLocation({ lat, lng });
        console.log('📍 Updated location:', { lat, lng });
      }
    }
    console.log('📍 handleAddressChange complete');
  };

  const validateAddress = async (addressText: string) => {
    if (!addressText || selectedDeliveryType !== 'delivery') {
      setAddressError('');
      return true;
    }

    if (addressText.trim().length < 5) {
      setAddressError('Укажите полный адрес доставки');
      return false;
    }

    setAddressError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (minOrderQuantity && Number(quantity) < minOrderQuantity) {
      setQuantityError(`Минимальное количество для заказа: ${minOrderQuantity} ${unit}`);
      return;
    }

    if (Number(quantity) > remainingQuantity) {
      setQuantityError(`Доступно только ${remainingQuantity} ${unit}`);
      return;
    }

    if (selectedDeliveryType === 'delivery') {
      const isAddressValid = await validateAddress(address);
      if (!isAddressValid || addressError) {
        return;
      }
    }

    const finalComment = offerCategory === 'transport' && passengerRoute
      ? `Маршрут: ${passengerRoute}${comment ? `\n${comment}` : ''}`
      : comment;

    const pickupAddress = offerCategory === 'transport'
      ? (selectedWaypoint === '__custom__' ? customPickupAddress : selectedWaypoint) || undefined
      : undefined;

    onSubmit({
      quantity: Number(quantity),
      deliveryType: selectedDeliveryType,
      address: selectedDeliveryType === 'delivery' ? address : undefined,
      comment: finalComment,
      counterPrice: showCounterPrice && counterPrice ? parseFloat(counterPrice) : undefined,
      counterComment: showCounterPrice && counterComment ? counterComment : undefined,
      passengerPickupAddress: pickupAddress,
    });
  };

  const handleWaypointChange = (waypoint: string, route: string) => {
    setSelectedWaypoint(waypoint);
    setPassengerRoute(route);
  };

  const effectivePricePerUnit =
    offerCategory === 'transport' && selectedWaypoint && selectedWaypoint !== '__custom__'
      ? (offerTransportWaypoints.find(w => w.address === selectedWaypoint)?.price ?? pricePerUnit)
      : pricePerUnit;

  return (
    <>
      <Dialog open={isOpen && !isMapOpen && !isPickupMapOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4 pr-10">
              <DialogTitle>Оформление заказа</DialogTitle>
              <div className="text-sm font-bold text-black whitespace-nowrap">
                Доступно: {remainingQuantity} {unit}
              </div>
            </div>
            <DialogDescription>
              Заполните форму, и мы свяжемся с вами для подтверждения заказа
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            {offerCategory === 'transport' && offerTransportDateTime && (
              <TransportDateBadge dateTime={offerTransportDateTime} />
            )}

            {offerCategory !== 'auto-sale' && (
              <QuantitySelector
                quantity={quantity}
                unit={offerCategory === 'transport' ? capacityUnit : unit}
                minOrderQuantity={minOrderQuantity}
                remainingQuantity={remainingQuantity}
                quantityError={quantityError}
                onQuantityChange={handleQuantityChange}
                onIncrement={incrementQuantity}
                onDecrement={decrementQuantity}
                onErrorClear={() => setQuantityError('')}
              />
            )}

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

            {offerCategory === 'transport' && (
              <TransportSection
                isFreight={!!isFreight}
                passengerRoute={passengerRoute}
                offerTransportRoute={offerTransportRoute}
                offerTransportWaypoints={offerTransportWaypoints}
                selectedWaypoint={selectedWaypoint}
                customPickupAddress={customPickupAddress}
                pricePerUnit={pricePerUnit}
                onWaypointChange={handleWaypointChange}
                onPassengerRouteChange={setPassengerRoute}
                onPickupMapOpen={() => setIsPickupMapOpen(true)}
              />
            )}

            <DeliverySection
              availableDeliveryTypes={availableDeliveryTypes}
              selectedDeliveryType={selectedDeliveryType}
              address={address}
              comment={comment}
              addressError={addressError}
              availableDistricts={availableDistricts}
              showCounterPrice={showCounterPrice}
              onDeliveryTypeChange={setSelectedDeliveryType}
              onAddressChange={setAddress}
              onCommentChange={setComment}
              onAddressBlur={() => validateAddress(address)}
              onMapOpen={() => setIsMapOpen(true)}
              onAddressErrorClear={() => setAddressError('')}
            />

            {noNegotiation ? (
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
                onToggle={() => setShowCounterPrice(!showCounterPrice)}
                onCounterPriceChange={setCounterPrice}
                onCounterCommentChange={setCounterComment}
              />
            )}

            <OrderFormActions
              quantityError={quantityError}
              addressError={addressError}
              onClose={onClose}
            />
          </form>
        </DialogContent>
      </Dialog>

      {isMapOpen && (
        <div className="fixed inset-0 z-[100] bg-background">
          <MapModal
            isOpen={isMapOpen}
            onClose={() => setIsMapOpen(false)}
            coordinates={gpsCoordinates}
            onCoordinatesChange={handleCoordinatesChange}
            onAddressChange={handleAddressChange}
          />
        </div>
      )}

      {isPickupMapOpen && (
        <div className="fixed inset-0 z-[100] bg-background">
          <MapModal
            isOpen={isPickupMapOpen}
            onClose={() => setIsPickupMapOpen(false)}
            coordinates={pickupGpsCoordinates}
            onCoordinatesChange={setPickupGpsCoordinates}
            onAddressChange={handlePickupAddressFromMap}
          />
        </div>
      )}
    </>
  );
}