import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import BackButton from '@/components/BackButton';
import Header from '@/components/Header';
import OfferCard from '@/components/OfferCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import OfferMediaGallery from '@/components/offer/OfferMediaGallery';
import OfferInfoCard from '@/components/offer/OfferInfoCard';
import OfferOrderModal from '@/components/offer/OfferOrderModal';
import OfferReviews from '@/components/offer/OfferReviews';
import type { Offer } from '@/types/offer';
import type { Order } from '@/types/order';
import { getSession } from '@/utils/auth';


interface OfferDetailContentProps {
  isAuthenticated: boolean;
  onLogout: () => void;
  offer: Offer;
  currentImageIndex: number;
  isVideoPlaying: boolean;
  isMuted: boolean;
  isOrderModalOpen: boolean;
  isGalleryOpen: boolean;
  galleryIndex: number;
  showVideo: boolean;
  createdOrder: Order | null;
  onImageIndexChange: (index: number) => void;
  onVideoPlayingChange: (playing: boolean) => void;
  onMuteChange: (muted: boolean) => void;
  onOrderModalChange: (open: boolean) => void;
  onGalleryChange: (open: boolean) => void;
  onGalleryIndexChange: (index: number) => void;
  onPrevImage: () => void;
  onNextImage: () => void;
  onShare: () => void;
  onOrderClick: () => void;
  onOrderSubmit: (data: any) => void;
  onOpenGallery: (index: number) => void;
  navigate: ReturnType<typeof useNavigate>;
}

export default function OfferDetailContent({
  isAuthenticated,
  onLogout,
  offer,
  currentImageIndex,
  isVideoPlaying,
  isMuted,
  isOrderModalOpen,
  isGalleryOpen,
  galleryIndex,
  showVideo,
  createdOrder,
  onImageIndexChange,
  onVideoPlayingChange,
  onMuteChange,
  onOrderModalChange,
  onGalleryChange,
  onGalleryIndexChange,
  onPrevImage,
  onNextImage,
  onShare,
  onOrderClick,
  onOrderSubmit,
  onOpenGallery,
  navigate,
}: OfferDetailContentProps) {
  const remainingQuantity = offer.quantity - (offer.soldQuantity || 0) - (offer.reservedQuantity || 0);
  const totalPrice = offer.pricePerUnit * remainingQuantity;
  const similarOffers: Offer[] = [];
  
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchOffset, setTouchOffset] = useState({ x: 0, y: 0 });
  const galleryRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const deltaX = e.touches[0].clientX - touchStart.x;
    const deltaY = e.touches[0].clientY - touchStart.y;
    setTouchOffset({ x: deltaX, y: deltaY });
  };

  const handleTouchEnd = () => {
    if (!touchStart) return;
    
    const absX = Math.abs(touchOffset.x);
    const absY = Math.abs(touchOffset.y);
    
    if (absX > 50 && absX > absY) {
      // Горизонтальный свайп — переключаем фото
      if (touchOffset.x < 0) {
        handleGalleryNext();
      } else {
        handleGalleryPrev();
      }
    } else if (absY > 100 && absY > absX) {
      // Вертикальный свайп вниз — закрываем
      onVideoPlayingChange(false);
      onGalleryChange(false);
    }
    
    setTouchStart(null);
    setTouchOffset({ x: 0, y: 0 });
  };

  const totalGalleryItems = offer.images.length + (offer.video ? 1 : 0);

  const handleGalleryPrev = () => {
    const newIndex = galleryIndex === 0 ? totalGalleryItems - 1 : galleryIndex - 1;
    onGalleryIndexChange(newIndex);
  };

  const handleGalleryNext = () => {
    const newIndex = galleryIndex === totalGalleryItems - 1 ? 0 : galleryIndex + 1;
    onGalleryIndexChange(newIndex);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-3 flex-1">
        <BackButton />

        <div className="grid gap-3 lg:grid-cols-3 mb-3 mt-1">
          <div className="lg:col-span-2">
            <OfferMediaGallery
              images={offer.images}
              video={offer.video}
              isPremium={offer.isPremium}
              showVideo={showVideo}
              currentImageIndex={currentImageIndex}
              isVideoPlaying={isVideoPlaying}
              isMuted={isMuted}
              onPrevImage={onPrevImage}
              onNextImage={onNextImage}
              onImageIndexChange={onImageIndexChange}
              onTogglePlayPause={() => onVideoPlayingChange(!isVideoPlaying)}
              onSkip={() => {}}
              onToggleMute={() => onMuteChange(!isMuted)}
              onOpenGallery={onOpenGallery}
              onVideoPlay={() => onVideoPlayingChange(true)}
              onVideoPause={() => onVideoPlayingChange(false)}
            />

            {/* На мобильных показываем информацию сразу после медиа */}
            <div className="lg:hidden">
              <OfferInfoCard
                title={offer.title}
                category={offer.category}
                subcategory={offer.subcategory}
                quantity={offer.quantity}
                minOrderQuantity={offer.minOrderQuantity}
                unit={offer.unit}
                pricePerUnit={offer.pricePerUnit}
                remainingQuantity={remainingQuantity}
                hasVAT={offer.hasVAT}
                vatRate={offer.vatRate}
                totalAmount={totalPrice}
                description={offer.description}
                location={offer.location}
                fullAddress={offer.fullAddress}
                district={offer.district}
                availableDistricts={offer.availableDistricts}
                availableDeliveryTypes={offer.availableDeliveryTypes}
                createdAt={offer.createdAt}
                expiryDate={offer.expiryDate}
                sellerRating={offer.seller?.rating}
                noNegotiation={offer.noNegotiation}
                deliveryTime={offer.deliveryTime}
                deliveryPeriodStart={offer.deliveryPeriodStart}
                deliveryPeriodEnd={offer.deliveryPeriodEnd}
                deadlineStart={offer.deadlineStart}
                deadlineEnd={offer.deadlineEnd}
                negotiableDeadline={offer.negotiableDeadline}
                budget={offer.budget}
                negotiableBudget={offer.negotiableBudget}
                transportServiceType={offer.transportServiceType}
                transportRoute={offer.transportRoute}
                transportType={offer.transportType}
                transportCapacity={offer.transportCapacity}
                transportDateTime={offer.transportDateTime}
                transportPrice={offer.transportPrice}
                transportPriceType={offer.transportPriceType}
                transportNegotiable={offer.transportNegotiable}
                transportComment={offer.transportComment}
                transportWaypoints={offer.transportWaypoints}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Card>
              <CardContent className="pt-6 space-y-2.5">
                {(() => {
                  const currentUser = getSession();
                  const isOwner = currentUser && currentUser.id?.toString() === offer.userId?.toString();
                  
                  console.log('🔍 Проверка владельца:', {
                    currentUserId: currentUser?.id,
                    offerUserId: offer.userId,
                    isOwner
                  });
                  
                  return isOwner ? (
                    <Button
                      onClick={() => navigate(`/edit-offer/${offer.id}?tab=info&edit=true`)}
                      size="lg"
                      className="w-full gap-2"
                    >
                      <Icon name="Edit" className="h-5 w-5" />
                      Редактировать предложение
                    </Button>
                  ) : (
                    <Button
                      onClick={onOrderClick}
                      size="lg"
                      className="w-full gap-2"
                    >
                      <Icon name="ShoppingCart" className="h-5 w-5" />
                      Заказать
                    </Button>
                  );
                })()}
                <Button
                  onClick={onShare}
                  variant="outline"
                  size="lg"
                  className="w-full gap-2"
                >
                  <Icon name="Share2" className="h-5 w-5" />
                  Поделиться
                </Button>
              </CardContent>
            </Card>

            {/* На десктопе показываем информацию под кнопками */}
            <div className="hidden lg:block">
              <OfferInfoCard
                title={offer.title}
                category={offer.category}
                subcategory={offer.subcategory}
                quantity={offer.quantity}
                minOrderQuantity={offer.minOrderQuantity}
                unit={offer.unit}
                pricePerUnit={offer.pricePerUnit}
                remainingQuantity={remainingQuantity}
                hasVAT={offer.hasVAT}
                vatRate={offer.vatRate}
                totalAmount={totalPrice}
                description={offer.description}
                location={offer.location}
                fullAddress={offer.fullAddress}
                district={offer.district}
                availableDistricts={offer.availableDistricts}
                availableDeliveryTypes={offer.availableDeliveryTypes}
                createdAt={offer.createdAt}
                expiryDate={offer.expiryDate}
                sellerRating={offer.seller?.rating}
                noNegotiation={offer.noNegotiation}
                deliveryTime={offer.deliveryTime}
                deliveryPeriodStart={offer.deliveryPeriodStart}
                deliveryPeriodEnd={offer.deliveryPeriodEnd}
                deadlineStart={offer.deadlineStart}
                deadlineEnd={offer.deadlineEnd}
                negotiableDeadline={offer.negotiableDeadline}
                budget={offer.budget}
                negotiableBudget={offer.negotiableBudget}
                transportServiceType={offer.transportServiceType}
                transportRoute={offer.transportRoute}
                transportType={offer.transportType}
                transportCapacity={offer.transportCapacity}
                transportDateTime={offer.transportDateTime}
                transportPrice={offer.transportPrice}
                transportPriceType={offer.transportPriceType}
                transportNegotiable={offer.transportNegotiable}
                transportComment={offer.transportComment}
                transportWaypoints={offer.transportWaypoints}
              />
            </div>
          </div>
        </div>

        {offer.seller && (
          <div className="mb-6">
            <OfferReviews
              reviews={offer.seller.reviews || []}
              averageRating={offer.seller.rating || 0}
              totalReviews={offer.seller.reviewsCount || 0}
            />
          </div>
        )}

        {similarOffers.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Похожие предложения</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {similarOffers.map((similarOffer) => (
                <OfferCard
                  key={similarOffer.id}
                  offer={similarOffer}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <OfferOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => onOrderModalChange(false)}
        onSubmit={onOrderSubmit}
        remainingQuantity={remainingQuantity}
        minOrderQuantity={offer.minOrderQuantity}
        unit={offer.unit}
        pricePerUnit={offer.category === 'transport' ? Number(offer.transportPrice || 0) : offer.pricePerUnit}
        availableDeliveryTypes={offer.availableDeliveryTypes}
        availableDistricts={offer.availableDistricts}
        offerDistrict={offer.district}
        offerCategory={offer.category}
        offerTransportRoute={offer.transportRoute}
        offerTransportWaypoints={offer.transportWaypoints}
        offerTransportPriceType={offer.transportPriceType}
        offerTransportNegotiable={offer.transportNegotiable}
      />

      <Dialog open={isGalleryOpen} onOpenChange={onGalleryChange}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0">
          <div 
            ref={galleryRef}
            className="relative w-full h-full flex items-center justify-center bg-black"
          >
            <button
              onClick={handleGalleryPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors"
            >
              <Icon name="ChevronLeft" className="h-6 w-6" />
            </button>

            <div
              className="w-full h-full flex items-center justify-center"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                transform: `translate(${touchOffset.x}px, ${touchOffset.y}px)`,
                transition: touchStart ? 'none' : 'transform 0.3s ease-out',
              }}
            >
              {galleryIndex < offer.images.length ? (
                <img
                  src={offer.images[galleryIndex]?.url}
                  alt={offer.images[galleryIndex]?.alt}
                  className="max-w-full max-h-full object-contain"
                />
              ) : offer.video ? (
                <video
                  src={offer.video.url}
                  className="max-w-full max-h-full object-contain"
                  controls
                  autoPlay={isVideoPlaying}
                  muted={isMuted}
                  onPlay={() => onVideoPlayingChange(true)}
                  onPause={() => onVideoPlayingChange(false)}
                />
              ) : null}
            </div>

            <button
              onClick={handleGalleryNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors"
            >
              <Icon name="ChevronRight" className="h-6 w-6" />
            </button>

            <button
              onClick={() => onGalleryChange(false)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            >
              <Icon name="X" className="h-5 w-5" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {[...offer.images, ...(offer.video ? [{ isVideo: true }] : [])].map((_, index) => (
                <button
                  key={index}
                  onClick={() => onGalleryIndexChange(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === galleryIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}