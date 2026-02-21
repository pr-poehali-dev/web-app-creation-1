import { useState } from 'react';
import type { Request } from './useRequestData';
import { shareContent } from '@/utils/shareUtils';

export function useRequestGallery(request: Request | null, showVideo: boolean) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const handlePrevImage = () => {
    if (!request) return;
    const totalItems = (showVideo && request.video ? 1 : 0) + request.images.length;
    setCurrentImageIndex((prev) => prev === 0 ? totalItems - 1 : prev - 1);
  };

  const handleNextImage = () => {
    if (!request) return;
    const totalItems = (showVideo && request.video ? 1 : 0) + request.images.length;
    setCurrentImageIndex((prev) => prev === totalItems - 1 ? 0 : prev + 1);
  };

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setIsGalleryOpen(true);
  };

  const handleShare = async () => {
    if (!request) return;
    const price = request.pricePerUnit
      ? `${request.pricePerUnit.toLocaleString('ru-RU')} ₽/${request.unit}`
      : '';
    await shareContent({
      title: request.title,
      text: `📋 ${request.title}${price ? `\n\n💰 Бюджет: ${price}` : ''}${request.description ? `\n\n📝 ${request.description}` : ''}`,
      url: window.location.href,
      imageUrl: request.images?.[0]?.url,
      itemType: 'request',
      itemId: request.id,
    });
  };

  return {
    currentImageIndex,
    isVideoPlaying,
    setIsVideoPlaying,
    isMuted,
    setIsMuted,
    isGalleryOpen,
    setIsGalleryOpen,
    galleryIndex,
    handlePrevImage,
    handleNextImage,
    openGallery,
    handleShare,
  };
}