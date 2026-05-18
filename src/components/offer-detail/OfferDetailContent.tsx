import { useNavigate } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import Header from '@/components/Header';
import OfferCard from '@/components/OfferCard';
import OfferMediaGallery from '@/components/offer/OfferMediaGallery';
import OfferOrderModal from '@/components/offer/OfferOrderModal';
import OfferReviews from '@/components/offer/OfferReviews';
import OfferDetailInfoCard from './OfferDetailInfoCard';
import OfferDetailSidebar from './OfferDetailSidebar';
import OfferDetailGalleryModal from './OfferDetailGalleryModal';
import OrderNegotiationModal from '@/components/order/OrderNegotiationModal';
import type { Offer } from '@/types/offer';
import type { Order } from '@/types/order';


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
  chatMessages: unknown[];
  isChatOpen: boolean;
  onImageIndexChange: (index: number) => void;
  onVideoPlayingChange: (playing: boolean) => void;
  onMuteChange: (muted: boolean) => void;
  onOrderModalChange: (open: boolean) => void;
  onGalleryChange: (open: boolean) => void;
  onGalleryIndexChange: (index: number) => void;
  onChatChange: (open: boolean) => void;
  onPrevImage: () => void;
  onNextImage: () => void;
  onShare: () => void;
  onOrderClick: () => void;
  onOrderSubmit: (data: unknown) => void;
  onOpenGallery: (index: number) => void;
  onSendMessage: (message: string) => void;
  navigate: ReturnType<typeof useNavigate>;
  createdOrderId?: string | null;
  onCreatedOrderIdReset?: () => void;
  onSendChatMessage?: (orderId: string, text: string) => Promise<void>;
  currentUserId?: string;
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
  createdOrderId,
  onCreatedOrderIdReset,
  onSendChatMessage,
  currentUserId,
}: OfferDetailContentProps) {
  const remainingQuantity = offer.quantity - (offer.soldQuantity || 0) - (offer.reservedQuantity || 0);
  const totalPrice = offer.pricePerUnit * remainingQuantity;
  const similarOffers: Offer[] = [];

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

            <div className="lg:hidden">
              <OfferDetailInfoCard
                offer={offer}
                remainingQuantity={remainingQuantity}
                totalPrice={totalPrice}
              />
            </div>
          </div>

          <OfferDetailSidebar
            offer={offer}
            remainingQuantity={remainingQuantity}
            totalPrice={totalPrice}
            onOrderClick={onOrderClick}
            onShare={onShare}
            navigate={navigate}
          />
        </div>

        {offer.seller && (
          <div className="mb-6">
            <OfferReviews
              reviews={offer.seller.reviews || []}
              averageRating={offer.seller.rating || 0}
              totalReviews={offer.seller.reviewsCount || 0}
              sellerId={offer.seller.id}
              completedOrders={offer.seller.statistics?.completedOrders}
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

      {createdOrder ? (
        <OrderNegotiationModal
          isOpen={!!createdOrderId || isOrderModalOpen}
          onClose={() => { onOrderModalChange(false); onCreatedOrderIdReset?.(); }}
          order={createdOrder}
          isNew
        />
      ) : (
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
          offerTransportDateTime={offer.transportDateTime}
          offerTransportServiceType={offer.transportServiceType}
          offerTransportCapacity={offer.transportCapacity}
          noNegotiation={offer.noNegotiation}
          createdOrderId={createdOrderId}
          currentUserId={currentUserId}
          onSendChatMessage={onSendChatMessage}
        />
      )}

      <OfferDetailGalleryModal
        offer={offer}
        isGalleryOpen={isGalleryOpen}
        galleryIndex={galleryIndex}
        isVideoPlaying={isVideoPlaying}
        isMuted={isMuted}
        onGalleryChange={onGalleryChange}
        onGalleryIndexChange={onGalleryIndexChange}
        onVideoPlayingChange={onVideoPlayingChange}
      />
    </div>
  );
}