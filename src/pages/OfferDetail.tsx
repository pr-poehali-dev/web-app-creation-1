import { useParams } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useOfferDetail } from '@/hooks/useOfferDetail';
import OfferDetailSkeleton from '@/components/offer-detail/OfferDetailSkeleton';
import OfferDetailNotFound from '@/components/offer-detail/OfferDetailNotFound';
import OfferDetailContent from '@/components/offer-detail/OfferDetailContent';

interface OfferDetailProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function OfferDetail({ isAuthenticated, onLogout }: OfferDetailProps) {
  useScrollToTop();
  const { id } = useParams<{ id: string }>();
  
  const {
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
  } = useOfferDetail(id);

  if (isLoading) {
    return <OfferDetailSkeleton isAuthenticated={isAuthenticated} onLogout={onLogout} />;
  }

  if (!offer) {
    return <OfferDetailNotFound isAuthenticated={isAuthenticated} onLogout={onLogout} />;
  }

  return (
    <OfferDetailContent
      isAuthenticated={isAuthenticated}
      onLogout={onLogout}
      offer={offer}
      currentImageIndex={currentImageIndex}
      isVideoPlaying={isVideoPlaying}
      isMuted={isMuted}
      isOrderModalOpen={isOrderModalOpen}
      isGalleryOpen={isGalleryOpen}
      galleryIndex={galleryIndex}
      showVideo={showVideo}
      isChatOpen={isChatOpen}
      createdOrder={createdOrder}
      chatMessages={chatMessages}
      onImageIndexChange={setCurrentImageIndex}
      onVideoPlayingChange={setIsVideoPlaying}
      onMuteChange={setIsMuted}
      onOrderModalChange={setIsOrderModalOpen}
      onGalleryChange={setIsGalleryOpen}
      onChatChange={setIsChatOpen}
      onPrevImage={handlePrevImage}
      onNextImage={handleNextImage}
      onShare={handleShare}
      onOrderClick={() => handleOrderClick(isAuthenticated)}
      onOrderSubmit={handleOrderSubmit}
      onOpenGallery={openGallery}
      onSendMessage={handleSendMessage}
      navigate={navigate}
    />
  );
}
