import { useState, useEffect, useRef } from 'react';
import { getSession } from '@/utils/auth';

interface TransportWaypoint {
  id: string;
  address: string;
  price?: number;
  isActive: boolean;
}

interface InlineChatMessage {
  id: string;
  text: string;
  isOwn: boolean;
  senderName: string;
  timestamp: Date;
}

interface UseOrderFormProps {
  remainingQuantity: number;
  minOrderQuantity?: number;
  unit: string;
  pricePerUnit: number;
  availableDeliveryTypes: ('pickup' | 'delivery')[];
  offerCategory?: string;
  offerTransportRoute?: string;
  offerTransportWaypoints?: TransportWaypoint[];
  offerTransportCapacity?: string;
  offerTransportServiceType?: string;
  createdOrderId?: string | null;
  onSubmit: (orderData: unknown) => void;
  onSendChatMessage?: (orderId: string, text: string) => Promise<void>;
}

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

function extractShortAddress(fullAddress: string): string {
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
}

export function useOrderForm({
  remainingQuantity,
  minOrderQuantity,
  unit,
  pricePerUnit,
  availableDeliveryTypes,
  offerCategory,
  offerTransportRoute,
  offerTransportWaypoints = [],
  offerTransportCapacity,
  offerTransportServiceType,
  createdOrderId,
  onSubmit,
  onSendChatMessage,
}: UseOrderFormProps) {
  const currentUser = getSession();

  const isFreight = offerTransportServiceType?.toLowerCase().includes('груз');

  const capacityUnit = (() => {
    if (!offerTransportCapacity) return unit || 'мест';
    const match = offerTransportCapacity.trim().match(/^[\d.,]+\s*(.+)$/);
    return match ? match[1].trim() : (unit || 'мест');
  })();

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
  const [chatMessages, setChatMessages] = useState<InlineChatMessage[]>([]);
  const [chatText, setChatText] = useState<string>('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (createdOrderId && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, createdOrderId]);

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

    if (offerCategory === 'utilities') {
      setQuantityError('');
      return;
    }

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

    if (offerCategory !== 'utilities') {
      if (minOrderQuantity && Number(quantity) < minOrderQuantity) {
        setQuantityError(`Минимальное количество для заказа: ${minOrderQuantity} ${unit}`);
        return;
      }
      if (Number(quantity) > remainingQuantity) {
        setQuantityError(`Доступно только ${remainingQuantity} ${unit}`);
        return;
      }
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

  const handleSendChatMessage = async () => {
    if (!chatText.trim() || !createdOrderId || !onSendChatMessage) return;
    const text = chatText.trim();
    setChatText('');
    setIsSendingMessage(true);
    const tempMsg: InlineChatMessage = {
      id: `temp-${Date.now()}`,
      text,
      isOwn: true,
      senderName: 'Вы',
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, tempMsg]);
    try {
      await onSendChatMessage(createdOrderId, text);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const effectivePricePerUnit =
    offerCategory === 'transport' && selectedWaypoint && selectedWaypoint !== '__custom__'
      ? (offerTransportWaypoints.find(w => w.address === selectedWaypoint)?.price ?? pricePerUnit)
      : pricePerUnit;

  return {
    isFreight,
    capacityUnit,
    selectedDeliveryType,
    setSelectedDeliveryType,
    quantity,
    address,
    setAddress,
    comment,
    setComment,
    passengerRoute,
    setPassengerRoute,
    selectedWaypoint,
    customPickupAddress,
    quantityError,
    setQuantityError,
    counterPrice,
    setCounterPrice,
    counterComment,
    setCounterComment,
    showCounterPrice,
    setShowCounterPrice,
    isMapOpen,
    setIsMapOpen,
    isPickupMapOpen,
    setIsPickupMapOpen,
    selectedLocation,
    addressError,
    setAddressError,
    gpsCoordinates,
    pickupGpsCoordinates,
    setPickupGpsCoordinates,
    chatMessages,
    chatText,
    setChatText,
    isSendingMessage,
    chatScrollRef,
    handleQuantityChange,
    incrementQuantity,
    decrementQuantity,
    handleCoordinatesChange,
    handlePickupAddressFromMap,
    handleAddressChange,
    validateAddress,
    handleSubmit,
    handleWaypointChange,
    handleSendChatMessage,
    effectivePricePerUnit,
  };
}

export type { InlineChatMessage, TransportWaypoint };
