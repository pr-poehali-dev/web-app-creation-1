import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import MapModal from '@/components/auction/MapModal';
import Icon from '@/components/ui/icon';
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
}: OfferOrderModalProps) {
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {offerCategory === 'transport' && offerTransportDateTime && (
            <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
              <Icon name="Calendar" className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <span className="text-muted-foreground">Дата и время выезда: </span>
                <span className="font-semibold">
                  {(() => {
                    try {
                      const d = new Date(offerTransportDateTime);
                      return isNaN(d.getTime()) ? offerTransportDateTime : d.toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                    } catch { return offerTransportDateTime; }
                  })()}
                </span>
              </div>
            </div>
          )}
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
            pricePerUnit={
              offerCategory === 'transport' && selectedWaypoint && selectedWaypoint !== '__custom__'
                ? (offerTransportWaypoints.find(w => w.address === selectedWaypoint)?.price ?? pricePerUnit)
                : pricePerUnit
            }
            quantity={quantity}
            unit={unit}
            quantityError={quantityError}
            showCounterPrice={showCounterPrice}
            priceType={offerTransportPriceType}
            isNegotiable={offerTransportNegotiable}
            isTransport={offerCategory === 'transport'}
          />

          {offerCategory === 'transport' && (
            <div className="space-y-3">
              {passengerRoute && passengerRoute !== offerTransportRoute && (
                <div className="rounded-md bg-green-50 dark:bg-green-950/30 border-2 border-green-500 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Ваш маршрут</p>
                  <p className="text-base font-bold text-foreground">{passengerRoute}</p>
                </div>
              )}
              {offerTransportWaypoints.filter(w => w.isActive).length > 0 && (
                <div className="space-y-2">
                  <Label>Пункт посадки</Label>
                  <div className="space-y-1.5">
                    <label className={`flex items-center gap-2 cursor-pointer rounded-md border p-2.5 transition-colors ${selectedWaypoint === '' ? 'border-2 border-green-500 bg-green-50 dark:bg-green-950/20' : 'hover:bg-muted/40 opacity-60'}`}>
                      <input
                        type="radio"
                        name="waypoint"
                        value=""
                        checked={selectedWaypoint === ''}
                        onChange={() => {
                          setSelectedWaypoint('');
                          if (offerTransportRoute) setPassengerRoute(offerTransportRoute);
                        }}
                        className="h-4 w-4"
                      />
                      <div className="flex-1">
                        <span className="text-xs text-muted-foreground block">Основной маршрут</span>
                        <span className={`text-sm font-bold ${selectedWaypoint !== '' ? 'text-muted-foreground' : 'text-foreground'}`}>{offerTransportRoute}</span>
                      </div>
                    </label>
                    {offerTransportWaypoints.filter(w => w.isActive).map(wp => (
                      <label key={wp.id} className={`flex items-center gap-2 cursor-pointer rounded-md border p-2.5 transition-colors ${selectedWaypoint === wp.address ? 'border-2 border-green-500 bg-green-50 dark:bg-green-950/20' : 'hover:bg-muted/40'}`}>
                        <input
                          type="radio"
                          name="waypoint"
                          value={wp.address}
                          checked={selectedWaypoint === wp.address}
                          onChange={() => {
                            setSelectedWaypoint(wp.address);
                            const routeStart = offerTransportRoute?.split(/\s*[-–—]\s*/)[0]?.trim() || '';
                            setPassengerRoute(routeStart ? `${routeStart} — ${wp.address}` : wp.address);
                          }}
                          className="h-4 w-4"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-bold text-foreground">
                            {offerTransportRoute
                              ? `${offerTransportRoute.split(/\s*[-–—]\s*/)[0].trim()} — ${wp.address}`
                              : wp.address}
                          </span>
                          {wp.price && (
                            <span className="ml-2 text-xs text-primary font-semibold">{wp.price.toLocaleString('ru-RU')} ₽</span>
                          )}
                        </div>
                      </label>
                    ))}

                  </div>
                </div>
              )}
              {offerTransportWaypoints.filter(w => w.isActive).length === 0 && (
                <div className="space-y-2">
                  <Label htmlFor="passenger-pickup">Адрес посадки</Label>
                  <div className="flex gap-2">
                    <Input
                      id="passenger-pickup"
                      value={customPickupAddress}
                      placeholder="Выберите на карте"
                      className="flex-1 cursor-pointer"
                      readOnly
                      onClick={() => setIsPickupMapOpen(true)}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={() => setIsPickupMapOpen(true)} title="Выбрать на карте">
                      <Icon name="Map" size={16} />
                    </Button>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="passenger-route">Ваш маршрут <span className="text-muted-foreground font-normal">(если отличается)</span></Label>
                <Input
                  id="passenger-route"
                  value={passengerRoute}
                  onChange={(e) => setPassengerRoute(e.target.value)}
                  placeholder={offerTransportRoute || 'Например: Нюрба - Якутск'}
                  className={passengerRoute && passengerRoute !== offerTransportRoute
                    ? 'border-2 border-green-500 bg-green-50 dark:bg-green-950/20 font-medium'
                    : ''}
                />

              </div>
            </div>
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