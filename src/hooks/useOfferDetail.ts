import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Offer } from '@/types/offer';
import type { Order, ChatMessage } from '@/types/order';
import { offersAPI } from '@/services/api';
import { getSession } from '@/utils/auth';
import { useToast } from '@/hooks/use-toast';
import { notifyNewOrder, notifyNewMessage } from '@/utils/notifications';

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
        
        const mappedOffer: Offer = {
          ...data,
          pricePerUnit: data.price_per_unit || data.pricePerUnit || 0,
          minOrderQuantity: data.min_order_quantity || data.minOrderQuantity,
          vatRate: data.vat_rate || data.vatRate,
          hasVAT: data.has_vat !== undefined ? data.has_vat : data.hasVAT,
          isPremium: data.is_premium !== undefined ? data.is_premium : data.isPremium,
          availableDistricts: data.available_districts || data.availableDistricts || [],
          availableDeliveryTypes: data.available_delivery_types || data.availableDeliveryTypes || ['pickup'],
          userId: data.user_id || data.userId,
          fullAddress: data.full_address || data.fullAddress,
          seller: data.seller_name ? {
            id: data.user_id || data.userId,
            name: data.seller_name,
            type: data.seller_type,
            phone: data.seller_phone,
            email: data.seller_email,
            rating: data.seller_rating || 0,
            reviewsCount: data.seller_reviews_count || 0,
            isVerified: data.seller_is_verified || false,
            statistics: {
              totalOffers: 0,
              activeOffers: 0,
              completedOrders: 0,
              registrationDate: new Date(),
            }
          } : undefined,
          createdAt: new Date(data.createdAt || data.created_at),
          updatedAt: data.updatedAt || data.updated_at ? new Date(data.updatedAt || data.updated_at) : undefined,
        };
        
        setOffer(mappedOffer);
        
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
    const url = window.location.href;
    
    if (navigator.share && navigator.canShare && navigator.canShare({ url })) {
      try {
        await navigator.share({
          title: offer?.title || 'Предложение',
          text: offer?.description || '',
          url: url,
        });
        toast({
          title: 'Успешно!',
          description: 'Ссылка отправлена',
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.log('Error sharing:', error);
          copyToClipboard(url);
        }
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Ссылка скопирована!',
        description: 'Теперь можно поделиться с друзьями',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось скопировать ссылку',
        variant: 'destructive',
      });
    }
  };

  const handleOrderClick = (isAuthenticated: boolean) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsOrderModalOpen(true);
  };

  const handleOrderSubmit = async (orderFormData: any) => {
    if (!offer) return;

    const currentUser = getSession();
    
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const storedUsers = localStorage.getItem('users');
    const users = storedUsers ? JSON.parse(storedUsers) : [];
    const seller = users.find((u: any) => u.id?.toString() === offer.userId);

    const newOrder: Order = {
      id: Date.now().toString(),
      offerId: offer.id,
      offerTitle: offer.title,
      offerImage: offer.images[0]?.url,
      buyerId: currentUser.id?.toString() || '',
      buyerName: `${currentUser.firstName} ${currentUser.lastName}`,
      buyerEmail: currentUser.email,
      buyerPhone: currentUser.phone || '',
      sellerId: offer.userId,
      sellerName: offer.seller?.name || seller?.organizationName || seller?.companyName || `${seller?.firstName || ''} ${seller?.lastName || ''}`.trim() || 'Продавец',
      sellerEmail: offer.seller?.email || seller?.email || '',
      sellerPhone: offer.seller?.phone || seller?.phone || '',
      quantity: orderFormData.quantity,
      unit: offer.unit,
      pricePerUnit: offer.pricePerUnit,
      totalPrice: orderFormData.quantity * offer.pricePerUnit,
      deliveryType: orderFormData.deliveryType,
      deliveryAddress: orderFormData.address,
      comment: orderFormData.comment,
      status: 'pending',
      createdAt: new Date(),
    };

    const storedOrders = localStorage.getItem('orders');
    const orders = storedOrders ? JSON.parse(storedOrders) : [];
    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    notifyNewOrder(
      offer.userId,
      offer.title,
      `${currentUser.firstName} ${currentUser.lastName}`,
      orderFormData.quantity,
      offer.unit,
      newOrder.id
    );
    
    setIsOrderModalOpen(false);
    setCreatedOrder(newOrder);
    setChatMessages([]);
    
    toast({
      title: 'Заказ оформлен!',
      description: 'Теперь вы можете общаться с продавцом',
    });

    setTimeout(() => {
      setIsChatOpen(true);
    }, 500);
  };

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setIsGalleryOpen(true);
  };

  const handleSendMessage = (message: string) => {
    if (!createdOrder) return;
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      orderId: createdOrder.id,
      senderId: getSession()?.id?.toString() || '',
      senderName: `${getSession()?.firstName} ${getSession()?.lastName}`,
      message,
      timestamp: new Date(),
      isRead: false,
    };
    
    const updatedMessages = [...chatMessages, newMessage];
    setChatMessages(updatedMessages);
    localStorage.setItem(`order_messages_${createdOrder.id}`, JSON.stringify(updatedMessages));
    
    const recipientId = createdOrder.sellerId;
    notifyNewMessage(
      recipientId,
      `${getSession()?.firstName} ${getSession()?.lastName}`,
      message,
      createdOrder.id
    );
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
    handleSendMessage,
    navigate,
  };
}
