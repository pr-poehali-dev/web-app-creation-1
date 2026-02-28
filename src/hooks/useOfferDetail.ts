import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Offer } from '@/types/offer';
import type { Order, ChatMessage } from '@/types/order';
import { offersAPI, reviewsAPI } from '@/services/api';
import { getSession } from '@/utils/auth';
import { useToast } from '@/hooks/use-toast';
import { notifyNewOrder, notifyNewMessage } from '@/utils/notifications';
import { dataSync, notifyOfferUpdated, notifyOrderUpdated } from '@/utils/dataSync';
import { shareContent } from '@/utils/shareUtils';

export function useOfferDetail(id: string | undefined) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const loadOffer = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const data = await offersAPI.getOfferById(id);
        
        console.log('Raw offer data from API:', data);
        
        const mappedOffer: Offer = {
          ...data,
          pricePerUnit: data.price_per_unit || data.pricePerUnit || 0,
          minOrderQuantity: data.min_order_quantity || data.minOrderQuantity,
          soldQuantity: data.sold_quantity || data.soldQuantity || 0,
          reservedQuantity: data.reserved_quantity || data.reservedQuantity || 0,
          vatRate: data.vat_rate || data.vatRate,
          hasVAT: data.has_vat !== undefined ? data.has_vat : data.hasVAT,
          isPremium: data.is_premium !== undefined ? data.is_premium : data.isPremium,
          availableDistricts: data.available_districts || data.availableDistricts || [],
          availableDeliveryTypes: data.available_delivery_types || data.availableDeliveryTypes || ['pickup'],
          userId: data.user_id || data.userId,
          fullAddress: data.full_address || data.fullAddress,
          video: data.videoUrl ? { url: data.videoUrl } : undefined,
          seller: {
            id: data.user_id || data.userId,
            name: data.seller_name || '',
            type: data.seller_type || '',
            phone: data.seller_phone || '',
            email: data.seller_email || '',
            rating: data.seller_rating || 0,
            reviewsCount: data.seller_reviews_count || 0,
            isVerified: data.seller_is_verified || false,
            statistics: {
              totalOffers: 0,
              activeOffers: 0,
              completedOrders: 0,
              registrationDate: new Date(),
            }
          },
          createdAt: new Date(data.createdAt || data.created_at),
          updatedAt: data.updatedAt || data.updated_at ? new Date(data.updatedAt || data.updated_at) : undefined,
        };
        
        console.log('Mapped offer:', { minOrderQuantity: mappedOffer.minOrderQuantity, unit: mappedOffer.unit });
        setOffer(mappedOffer);
        
        // Загружаем отзывы о продавце
        if (mappedOffer.seller?.id) {
          try {
            const reviewsData = await reviewsAPI.getReviewsBySeller(Number(mappedOffer.seller.id));
            setOffer(prev => prev ? {
              ...prev,
              seller: {
                ...prev.seller!,
                reviews: reviewsData.reviews.map((r: Record<string, unknown>) => ({
                  id: String(r.id),
                  reviewerId: String(r.reviewer_id),
                  reviewerName: 'Покупатель',
                  reviewedUserId: String(r.reviewed_user_id),
                  rating: r.rating,
                  comment: r.comment || '',
                  createdAt: r.created_at,
                  sellerResponse: r.seller_response,
                  sellerResponseDate: r.seller_response_date,
                })),
                rating: reviewsData.stats.average_rating,
                reviewsCount: reviewsData.stats.total_reviews,
              }
            } : prev);
          } catch (error) {
            console.error('Error loading reviews:', error);
          }
        }
        
        if (mappedOffer?.video) {
          setShowVideo(true);
        }
      } catch (error) {
        console.error('Error loading offer:', error);
        setOffer(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadOffer();
    
    // Подписываемся на обновления конкретного предложения
    const unsubscribe = dataSync.subscribe('offer_updated', () => {
      console.log('Offer updated, reloading...');
      loadOffer();
    });
    
    return () => {
      unsubscribe();
    };
  }, [id]);

  const handlePrevImage = () => {
    if (!offer) return;
    const totalItems = (showVideo && offer.video ? 1 : 0) + offer.images.length;
    setCurrentImageIndex((prev) => prev === 0 ? totalItems - 1 : prev - 1);
  };

  const handleNextImage = () => {
    if (!offer) return;
    const totalItems = (showVideo && offer.video ? 1 : 0) + offer.images.length;
    setCurrentImageIndex((prev) => prev === totalItems - 1 ? 0 : prev + 1);
  };

  const handleShare = async () => {
    if (!offer) return;
    await shareContent({
      title: offer.title,
      text: `📦 ${offer.title}\n\n💰 Цена: ${offer.pricePerUnit != null ? Number(offer.pricePerUnit).toLocaleString('ru-RU') : '—'} ₽/${offer.unit}${offer.description ? `\n\n📝 ${offer.description}` : ''}`,
      url: window.location.href,
      imageUrl: offer.images?.[0]?.url,

    });
  };

  const handleOrderClick = (isAuthenticated: boolean) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    const currentUser = getSession();
    if (currentUser && offer && currentUser.id?.toString() === offer.userId) {
      toast({
        title: 'Невозможно создать заказ',
        description: 'Нельзя заказать собственное предложение',
        variant: 'destructive',
      });
      return;
    }
    
    setIsOrderModalOpen(true);
  };

  const loadMessages = async (orderId: string) => {
    try {
      const currentUser = getSession();
      if (!currentUser) return;

      const response = await fetch(`https://functions.poehali.dev/ac0118fc-097c-4d35-a326-6afad0b5f8d4?id=${orderId}&messages=true`, {
        headers: {
          'X-User-Id': currentUser.id?.toString() || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const messages: ChatMessage[] = (data.messages || []).map((msg: Record<string, unknown>) => ({
          id: msg.id,
          orderId: msg.order_id,
          senderId: msg.sender_id?.toString() || '',
          senderName: msg.sender_name,
          message: msg.message,
          timestamp: new Date(msg.createdAt),
          isRead: msg.is_read || false,
        }));
        setChatMessages(messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleOrderSubmit = async (orderFormData: Record<string, unknown>) => {
    if (!offer) {
      toast({
        title: 'Ошибка',
        description: 'Предложение не найдено',
        variant: 'destructive',
      });
      return;
    }

    const currentUser = getSession();
    
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Показываем индикатор загрузки
    toast({
      title: 'Создаем заказ...',
      description: 'Пожалуйста, подождите',
    });

    try {
      const orderData = {
        offerId: offer.id,
        title: offer.title,
        quantity: orderFormData.quantity,
        unit: offer.unit,
        pricePerUnit: offer.category === 'transport'
          ? (offer.transportNegotiable ? 0 : Number(offer.transportPrice || offer.pricePerUnit || 0))
          : offer.pricePerUnit,
        deliveryType: orderFormData.deliveryType,
        deliveryAddress: orderFormData.address || '',
        district: offer.district,
        buyerName: `${currentUser.firstName} ${currentUser.lastName}`,
        buyerPhone: currentUser.phone || '',
        buyerEmail: currentUser.email,
        buyerCompany: currentUser.companyName || '',
        buyerInn: currentUser.inn || '',
        buyerComment: orderFormData.comment || '',
        hasVAT: offer.hasVAT || false,
        vatRate: offer.vatRate || 0,
        counterPrice: orderFormData.counterPrice || undefined,
        counterMessage: orderFormData.counterComment || undefined,
        passengerPickupAddress: orderFormData.passengerPickupAddress || undefined,
      };

      const response = await fetch('https://functions.poehali.dev/ac0118fc-097c-4d35-a326-6afad0b5f8d4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id?.toString() || '',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Не удалось создать заказ');
      }

      const result = await response.json();

      // Загружаем полный заказ с данными продавца из БД с retry-логикой
      let fullOrderData = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts && !fullOrderData) {
        if (attempts > 0) {
          await new Promise(resolve => setTimeout(resolve, 200 * attempts));
        }
        
        const orderResponse = await fetch(`https://functions.poehali.dev/ac0118fc-097c-4d35-a326-6afad0b5f8d4?id=${result.id}`, {
          headers: {
            'X-User-Id': currentUser.id?.toString() || '',
          },
        });

        if (orderResponse.ok) {
          fullOrderData = await orderResponse.json();
        } else {
          attempts++;
        }
      }

      if (!fullOrderData) {
        console.error('Failed to load full order data after retries');
        // Используем минимальные данные из первого ответа
        const minimalOrder: Order = {
          id: result.id,
          orderNumber: result.order_number || `ORD-${result.id}`,
          offerId: offer.id,
          offerTitle: offer.title,
          offerImage: offer.images[0]?.url,
          buyerId: currentUser.id?.toString() || '',
          buyerName: `${currentUser.firstName} ${currentUser.lastName}`,
          buyerEmail: currentUser.email,
          buyerPhone: currentUser.phone || '',
          sellerId: offer.userId,
          sellerName: offer.seller?.name || 'Продавец',
          sellerEmail: offer.seller?.email || '',
          sellerPhone: offer.seller?.phone || '',
          quantity: orderFormData.quantity,
          unit: offer.unit,
          pricePerUnit: offer.pricePerUnit,
          totalAmount: offer.pricePerUnit * orderFormData.quantity,
          counterPricePerUnit: orderFormData.counterPrice,
          counterTotalAmount: orderFormData.counterPrice ? (orderFormData.counterPrice * orderFormData.quantity) : undefined,
          counterOfferedBy: orderFormData.counterPrice ? 'buyer' : undefined,
          deliveryType: orderFormData.deliveryType,
          deliveryAddress: orderFormData.address || '',
          comment: orderFormData.comment,
          status: 'pending',
          createdAt: new Date(),
        };
        
        setIsOrderModalOpen(false);
        setCreatedOrder(minimalOrder);
        
        // Уведомляем всех пользователей об обновлении предложения и заказа
        notifyOfferUpdated(offer.id);
        notifyOrderUpdated(result.id);
        
        // Показываем уведомление с автоматическим скрытием через 2 секунды
        toast({
          title: '🎉 Ваш заказ оформлен!',
          description: 'Проверьте детали в разделе "Мои заказы"',
          duration: 2000,
        });
        
        // Перенаправляем на страницу "Мои заказы"
        setTimeout(() => {
          navigate('/my-orders');
        }, 300);
        
        return;
      }

      const newOrder: Order = {
        id: fullOrderData.id,
        orderNumber: fullOrderData.order_number,
        offerId: fullOrderData.offer_id,
        offerTitle: fullOrderData.title,
        offerImage: offer.images[0]?.url,
        buyerId: fullOrderData.buyer_id?.toString() || '',
        buyerName: fullOrderData.buyer_name,
        buyerEmail: fullOrderData.buyer_email,
        buyerPhone: fullOrderData.buyer_phone,
        sellerId: fullOrderData.seller_id?.toString() || '',
        sellerName: fullOrderData.seller_name || 'Продавец',
        sellerEmail: fullOrderData.seller_email || '',
        sellerPhone: fullOrderData.seller_phone || '',
        quantity: fullOrderData.quantity,
        unit: fullOrderData.unit,
        pricePerUnit: fullOrderData.price_per_unit,
        totalAmount: fullOrderData.total_amount,
        counterPricePerUnit: fullOrderData.counter_price_per_unit || orderFormData.counterPrice || undefined,
        counterTotalAmount: fullOrderData.counter_total_amount || (orderFormData.counterPrice ? (orderFormData.counterPrice * fullOrderData.quantity) : undefined),
        counterOfferedBy: fullOrderData.counter_offered_by || (orderFormData.counterPrice ? 'buyer' : undefined),
        deliveryType: fullOrderData.delivery_type,
        deliveryAddress: fullOrderData.delivery_address,
        comment: fullOrderData.buyer_comment,
        status: fullOrderData.status,
        createdAt: new Date(fullOrderData.createdAt || fullOrderData.created_at),
      };
      
      setIsOrderModalOpen(false);
      setCreatedOrder(newOrder);
      
      await loadMessages(result.id);
      
      // Уведомляем продавца о новом заказе
      notifyNewOrder(
        newOrder.sellerId,
        newOrder.offerTitle,
        newOrder.buyerName,
        newOrder.quantity,
        newOrder.unit,
        newOrder.id
      );
      
      // Уведомляем всех пользователей об обновлении предложения и заказа
      notifyOfferUpdated(offer.id);
      notifyOrderUpdated(result.id);
      
      // Показываем уведомление с автоматическим скрытием через 2 секунды
      toast({
        title: '🎉 Ваш заказ оформлен!',
        description: orderFormData.counterPrice ? 'Продавец получит ваше предложение цены' : 'Проверьте детали в разделе "Мои заказы"',
        duration: 2000,
      });

      // Перенаправляем на страницу "Мои заказы"
      setTimeout(() => {
        navigate('/my-orders');
      }, 300);
    } catch (error) {
      console.error('Error creating order:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Не удалось создать заказ';
      
      toast({
        title: 'Ошибка создания заказа',
        description: errorMessage + '. Попробуйте ещё раз.',
        variant: 'destructive',
      });
      
      // Не закрываем модальное окно, чтобы пользователь мог повторить попытку
    }
  };

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setIsGalleryOpen(true);
  };

  const handleSendMessage = async (message: string) => {
    if (!createdOrder) return;
    
    const currentUser = getSession();
    if (!currentUser) return;

    try {
      const response = await fetch('https://functions.poehali.dev/ac0118fc-097c-4d35-a326-6afad0b5f8d4?message=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id?.toString() || '',
        },
        body: JSON.stringify({
          orderId: createdOrder.id,
          senderId: currentUser.id,
          senderType: 'buyer',
          message: message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();

      const newMessage: ChatMessage = {
        id: result.id,
        orderId: createdOrder.id,
        senderId: currentUser.id?.toString() || '',
        senderName: `${currentUser.firstName} ${currentUser.lastName}`,
        message,
        timestamp: new Date(result.createdAt),
        isRead: false,
      };
      
      setChatMessages([...chatMessages, newMessage]);
      
      notifyNewMessage(
        createdOrder.sellerId,
        `${currentUser.firstName} ${currentUser.lastName}`,
        message,
        createdOrder.id
      );
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    }
  };

  return {
    offer,
    isLoading,
    currentImageIndex,
    isVideoPlaying,
    isMuted,
    isOrderModalOpen,
    isGalleryOpen,
    galleryIndex,
    showVideo,
    isChatOpen,
    createdOrder,
    chatMessages,
    setCurrentImageIndex,
    setIsVideoPlaying,
    setIsMuted,
    setIsOrderModalOpen,
    setIsGalleryOpen,
    setIsChatOpen,
    handlePrevImage,
    handleNextImage,
    handleShare,
    handleOrderClick,
    handleOrderSubmit,
    openGallery,
    setGalleryIndex,
    handleSendMessage,
    navigate,
  };
}