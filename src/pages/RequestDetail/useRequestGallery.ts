import { useState } from 'react';
import type { Request } from './useRequestData';

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
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: request?.title,
          text: request?.description,
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
