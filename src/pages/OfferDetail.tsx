import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OfferCard from '@/components/OfferCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import OfferMediaGallery from '@/components/offer/OfferMediaGallery';
import OfferInfoCard from '@/components/offer/OfferInfoCard';
import OfferSellerCard from '@/components/offer/OfferSellerCard';
import OfferOrderModal from '@/components/offer/OfferOrderModal';
import type { Offer } from '@/types/offer';
import { offersAPI, ordersAPI } from '@/services/api';
import { getSession } from '@/utils/auth';
import { useToast } from '@/hooks/use-toast';

interface OfferDetailProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function OfferDetail({ isAuthenticated, onLogout }: OfferDetailProps) {
  useScrollToTop();
  const { id } = useParams<{ id: string }>();
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

  useEffect(() => {
    const loadOffer = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const data = await offersAPI.getOfferById(id);
        
        const mappedOffer: Offer = {
          ...data,
          pricePerUnit: data.price_per_unit || data.pricePerUnit || 0,
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
    if (navigator.share) {
      try {
        await navigator.share({
          title: offer?.title,
          text: offer?.description,
          url: url,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Ссылка скопирована в буфер обмена');
    }
  };

  const handleOrderClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsOrderModalOpen(true);
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offer) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const currentUser = getSession();
    
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      const orderData = {
        offerId: offer.id,
        title: offer.title,
        quantity: parseInt(formData.get('order-quantity') as string),
        unit: offer.unit,
        pricePerUnit: offer.pricePerUnit,
        hasVAT: offer.hasVAT || false,
        vatRate: offer.vatRate,
        deliveryType: formData.get('order-delivery') as string,
        deliveryAddress: formData.get('order-address') as string,
        district: offer.district,
        buyerName: currentUser.firstName + ' ' + currentUser.lastName,
        buyerPhone: currentUser.phone || '',
        buyerEmail: currentUser.email,
        buyerComment: formData.get('order-comment') as string || '',
      };

      const result = await ordersAPI.createOrder(orderData);
      
      setIsOrderModalOpen(false);
      
      toast({
        title: 'Заказ оформлен!',
        description: `Номер заказа: ${result.orderNumber}`,
      });
      
      setTimeout(() => {
        navigate('/active-orders');
      }, 1500);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Ошибка при оформлении заказа. Попробуйте еще раз.');
    }
  };

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setIsGalleryOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="container mx-auto px-4 py-8 flex-1">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid gap-8 lg:grid-cols-3 mb-8">
            <div className="lg:col-span-2">
              <Skeleton className="aspect-video w-full rounded-lg mb-4" />
              <div className="grid grid-cols-4 gap-2 mb-6">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square" />
                ))}
              </div>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-6 w-1/2" />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="text-center py-20">
            <Icon name="AlertCircle" className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-3">Контент не найден</h2>
            <p className="text-muted-foreground mb-8">
              Предложение с таким ID не существует или было удалено
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/')} className="gap-2">
                <Icon name="Home" className="h-4 w-4" />
                На главную
              </Button>
              <Button onClick={() => navigate('/predlozheniya')} variant="outline" className="gap-2">
                <Icon name="Package" className="h-4 w-4" />
                К предложениям
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const remainingQuantity = offer.quantity - (offer.orderedQuantity || 0);
  const totalPrice = offer.pricePerUnit * offer.quantity;
  const similarOffers = MOCK_OFFERS
    .filter(o => o.id !== offer.id && o.category === offer.category)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <BackButton />
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 gap-2"
        >
          <Icon name="ArrowLeft" className="h-4 w-4" />
          Назад
        </Button>

        <div className="grid gap-8 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2">
            <OfferMediaGallery
              images={offer.images}
              video={offer.video}
              isPremium={offer.isPremium}
              showVideo={showVideo}
              currentImageIndex={currentImageIndex}
              isVideoPlaying={isVideoPlaying}
              isMuted={isMuted}
              onPrevImage={handlePrevImage}
              onNextImage={handleNextImage}
              onImageIndexChange={setCurrentImageIndex}
              onTogglePlayPause={() => setIsVideoPlaying(!isVideoPlaying)}
              onSkip={() => {}}
              onToggleMute={() => setIsMuted(!isMuted)}
              onOpenGallery={openGallery}
              onVideoPlay={() => setIsVideoPlaying(true)}
              onVideoPause={() => setIsVideoPlaying(false)}
            />

            <OfferInfoCard
              title={offer.title}
              category={offer.category}
              subcategory={offer.subcategory}
              quantity={offer.quantity}
              unit={offer.unit}
              pricePerUnit={offer.pricePerUnit}
              remainingQuantity={remainingQuantity}
              hasVAT={offer.hasVAT}
              vatRate={offer.vatRate}
              totalPrice={totalPrice}
              description={offer.description}
              location={offer.location}
              fullAddress={offer.fullAddress}
              district={offer.district}
              availableDistricts={offer.availableDistricts}
              availableDeliveryTypes={offer.availableDeliveryTypes}
              createdAt={offer.createdAt}
              expiryDate={offer.expiryDate}
            />
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button
                  onClick={handleOrderClick}
                  size="lg"
                  className="w-full gap-2"
                >
                  <Icon name="ShoppingCart" className="h-5 w-5" />
                  Заказать
                </Button>
                <Button
                  onClick={handleShare}
                  variant="outline"
                  size="lg"
                  className="w-full gap-2"
                >
                  <Icon name="Share2" className="h-5 w-5" />
                  Поделиться
                </Button>
              </CardContent>
            </Card>

            <OfferSellerCard seller={offer.seller} />
          </div>
        </div>

        {similarOffers.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Похожие предложения</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {similarOffers.map((similarOffer) => (
                <OfferCard
                  key={similarOffer.id}
                  offer={similarOffer}
                  onClick={() => navigate(`/offer/${similarOffer.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <OfferOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSubmit={handleOrderSubmit}
        remainingQuantity={remainingQuantity}
        unit={offer.unit}
        availableDeliveryTypes={offer.availableDeliveryTypes}
      />

      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative">
            {offer.images[galleryIndex] && (
              <img
                src={offer.images[galleryIndex].url}
                alt={offer.images[galleryIndex].alt}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}
            {offer.images.length > 1 && (
              <>
                <button
                  onClick={() => setGalleryIndex((prev) => prev === 0 ? offer.images.length - 1 : prev - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/90 hover:bg-background shadow-lg"
                >
                  <Icon name="ChevronLeft" className="h-6 w-6" />
                </button>
                <button
                  onClick={() => setGalleryIndex((prev) => prev === offer.images.length - 1 ? 0 : prev + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/90 hover:bg-background shadow-lg"
                >
                  <Icon name="ChevronRight" className="h-6 w-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-background/90 text-sm font-medium">
                  {galleryIndex + 1} / {offer.images.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}