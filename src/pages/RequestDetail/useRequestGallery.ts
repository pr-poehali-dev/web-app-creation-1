import { useState } from 'react';
import { toast } from 'sonner';
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
    const price = request?.pricePerUnit
      ? `${request.pricePerUnit.toLocaleString('ru-RU')} ₽/${request.unit}`
      : '';
    const shareText = request
      ? `📋 ${request.title}\n${price ? `\n💰 Бюджет: ${price}` : ''}${request.description ? `\n\n📝 ${request.description.slice(0, 150)}` : ''}\n\n🔗 `
      : '';

    if (navigator.share) {
      try {
        await navigator.share({
          title: request?.title,
          text: `${shareText}${url}`,
          url,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          await copyFull(shareText, url);
        }
      }
    } else {
      await copyFull(shareText, url);
    }
  };

  const copyFull = async (shareText: string, url: string) => {
    try {
      await navigator.clipboard.writeText(`${shareText}${url}`);
      toast.success('Описание скопировано!', { description: 'Вставьте в мессенджер — получатель увидит полную информацию' });
    } catch {
      await navigator.clipboard.writeText(url);
      toast.success('Ссылка скопирована');
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