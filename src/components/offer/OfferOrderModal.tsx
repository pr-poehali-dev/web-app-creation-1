import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import SwipeableModal from '@/components/ui/SwipeableModal';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import MapModal from '@/components/auction/MapModal';
import QuantitySelector from './order-modal/QuantitySelector';
import PriceDisplay from './order-modal/PriceDisplay';
import DeliverySection from './order-modal/DeliverySection';
import CounterPriceSection from './order-modal/CounterPriceSection';

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
}: OfferOrderModalProps) {
  const currentUser = getSession();
  const { toast } = useToast();
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<'pickup' | 'delivery' | ''>('');
  const [quantity, setQuantity] = useState<string>(String(minOrderQuantity || 1));
  const [address, setAddress] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [quantityError, setQuantityError] = useState<string>('');
  const [counterPrice, setCounterPrice] = useState<string>('');
  const [counterComment, setCounterComment] = useState<string>('');
  const [showCounterPrice, setShowCounterPrice] = useState<boolean>(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [addressError, setAddressError] = useState<string>('');
  const [gpsCoordinates, setGpsCoordinates] = useState<string>('');
  const [addressSetFromMap, setAddressSetFromMap] = useState<boolean>(false);

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
    
    onSubmit({
      quantity: Number(quantity),
      deliveryType: selectedDeliveryType,
      address: selectedDeliveryType === 'delivery' ? address : undefined,
      comment,
      counterPrice: showCounterPrice && counterPrice ? parseFloat(counterPrice) : undefined,
      counterComment: showCounterPrice && counterComment ? counterComment : undefined,
    });
  };

  return (
    <>
    <SwipeableModal
      isOpen={isOpen && !isMapOpen}
      onClose={onClose}
      title={
        <div className="flex items-center justify-between gap-2 flex-1 pr-2">
          <span>Оформление заказа</span>
          <span className="text-sm font-bold text-foreground whitespace-nowrap">
            Доступно: {remainingQuantity} {unit}
          </span>
        </div>
      }
    >
      <div className="px-4 sm:px-6 py-4">
        <p className="text-sm text-muted-foreground mb-4">
          Заполните форму, и мы свяжемся с вами для подтверждения заказа
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <QuantitySelector
            quantity={quantity}
            unit={unit}
            minOrderQuantity={minOrderQuantity}
            remainingQuantity={remainingQuantity}
            quantityError={quantityError}
            onQuantityChange={handleQuantityChange}
            onIncrement={incrementQuantity}
            onDecrement={decrementQuantity}
            onErrorClear={() => setQuantityError('')}
          />

          <PriceDisplay
            pricePerUnit={pricePerUnit}
            quantity={quantity}
            unit={unit}
            quantityError={quantityError}
            showCounterPrice={showCounterPrice}
          />

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

          <CounterPriceSection
            showCounterPrice={showCounterPrice}
            pricePerUnit={pricePerUnit}
            counterPrice={counterPrice}
            counterComment={counterComment}
            quantity={quantity}
            onToggle={() => setShowCounterPrice(!showCounterPrice)}
            onCounterPriceChange={setCounterPrice}
            onCounterCommentChange={setCounterComment}
          />

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={!!quantityError || !!addressError}
            >
              Отправить заказ
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Отмена
            </Button>
          </div>
        </form>
      </div>
    </SwipeableModal>

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
    </>
  );
}