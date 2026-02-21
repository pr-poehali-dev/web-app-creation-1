import { useParams, useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useOfferDetail } from '@/hooks/useOfferDetail';
import { getSession, clearSession } from '@/utils/auth';
import OfferDetailSkeleton from '@/components/offer-detail/OfferDetailSkeleton';
import OfferDetailNotFound from '@/components/offer-detail/OfferDetailNotFound';
import OfferDetailContent from '@/components/offer-detail/OfferDetailContent';
import SEO from '@/components/SEO';

export default function OfferDetail() {
  useScrollToTop();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = getSession();
  const isAuthenticated = !!currentUser;
  
  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };
  
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
    setGalleryIndex,
    handleSendMessage,
  } = useOfferDetail(id);

  if (isLoading) {
    return <OfferDetailSkeleton isAuthenticated={isAuthenticated} onLogout={handleLogout} />;
  }

  if (!offer) {
    return <OfferDetailNotFound isAuthenticated={isAuthenticated} onLogout={handleLogout} />;
  }

  return (
    <>
      <SEO
        title={offer.title}
        description={`${offer.description ? offer.description.slice(0, 150) : ''} — ${offer.pricePerUnit.toLocaleString('ru-RU')} ₽/${offer.unit}. ${offer.category}, ${offer.district}.`}
        keywords={`${offer.title}, ${offer.category}, купить ${offer.district}, ЕРТТП`}
        canonical={`/offer/${offer.id}`}
      />
      <OfferDetailContent
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
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
        onGalleryIndexChange={setGalleryIndex}
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
    </>
  );
}