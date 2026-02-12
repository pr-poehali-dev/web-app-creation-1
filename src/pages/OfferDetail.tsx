import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useOfferDetail } from '@/hooks/useOfferDetail';
import { getSession, clearSession } from '@/utils/auth';
import OfferDetailSkeleton from '@/components/offer-detail/OfferDetailSkeleton';
import OfferDetailNotFound from '@/components/offer-detail/OfferDetailNotFound';
import OfferDetailContent from '@/components/offer-detail/OfferDetailContent';

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
    handleSendMessage,
  } = useOfferDetail(id);

  // Обновляем метатеги для красивого превью при шаринге
  useEffect(() => {
    if (!offer) return;

    const title = offer.title;
    const description = offer.description || `${offer.pricePerUnit.toLocaleString('ru-RU')} ₽/${offer.unit}`;
    const imageUrl = offer.images[0]?.url || 'https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/files/og-image-1769423236981.png';

    // Обновляем title
    document.title = `${title} — ЕРТТП`;

    // Обновляем og:title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', title);
    }

    // Обновляем og:description
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', description);
    }

    // Обновляем og:image
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
      ogImage.setAttribute('content', imageUrl);
    }

    // Обновляем twitter:image
    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage) {
      twitterImage.setAttribute('content', imageUrl);
    }

    // Cleanup: возвращаем дефолтные значения при размонтировании
    return () => {
      document.title = 'Единая Региональная Товарно-Торговая Площадка';
      if (ogTitle) ogTitle.setAttribute('content', 'Единая Региональная Товарно-Торговая Площадка');
      if (ogDescription) ogDescription.setAttribute('content', 'Единая Региональная Товарно-Торговая Площадка — (B2B)-(СС)-(СВ)-(ВС) -платформа для бизнеса');
      if (ogImage) ogImage.setAttribute('content', 'https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/files/og-image-1769423236981.png');
      if (twitterImage) twitterImage.setAttribute('content', 'https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/files/og-image-1769423236981.png');
    };
  }, [offer]);

  if (isLoading) {
    return <OfferDetailSkeleton isAuthenticated={isAuthenticated} onLogout={handleLogout} />;
  }

  if (!offer) {
    return <OfferDetailNotFound isAuthenticated={isAuthenticated} onLogout={handleLogout} />;
  }

  return (
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