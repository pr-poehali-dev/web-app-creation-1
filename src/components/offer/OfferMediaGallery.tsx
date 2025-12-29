import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { OfferImage, OfferVideo } from '@/types/offer';

interface OfferMediaGalleryProps {
  images: OfferImage[];
  video?: OfferVideo;
  isPremium: boolean;
  showVideo: boolean;
  currentImageIndex: number;
  isVideoPlaying: boolean;
  isMuted: boolean;
  onPrevImage: () => void;
  onNextImage: () => void;
  onImageIndexChange: (index: number) => void;
  onTogglePlayPause: () => void;
  onSkip: (seconds: number) => void;
  onToggleMute: () => void;
  onOpenGallery: (index: number) => void;
  onVideoPlay: () => void;
  onVideoPause: () => void;
}

export default function OfferMediaGallery({
  images,
  video,
  isPremium,
  showVideo,
  currentImageIndex,
  isVideoPlaying,
  isMuted,
  onPrevImage,
  onNextImage,
  onImageIndexChange,
  onTogglePlayPause,
  onSkip,
  onToggleMute,
  onOpenGallery,
  onVideoPlay,
  onVideoPause,
}: OfferMediaGalleryProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Не запускаем видео автоматически - пользователь сам нажмёт Play
    if (videoRef.current && showVideo && video) {
      // Просто подготавливаем видео к воспроизведению
      videoRef.current.load();
    }
  }, [showVideo, video]);

  const handleTogglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isVideoPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    onTogglePlayPause();
  };

  const handleSkip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += seconds;
    onSkip(seconds);
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    onToggleMute();
  };

  const totalMediaItems = (showVideo && video ? 1 : 0) + images.length;
  const isShowingVideo = showVideo && video && currentImageIndex === 0;

  return (
    <>
      <Card className="overflow-hidden mb-6">
        <div className="relative aspect-video bg-muted">
          {isShowingVideo ? (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                src={video!.url}
                poster={video!.thumbnail}
                className="w-full h-full object-cover"
                controls
                onPlay={onVideoPlay}
                onPause={onVideoPause}
              />
            </div>
          ) : images.length > 0 ? (
            <>
              <img
                src={images[showVideo && video ? currentImageIndex - 1 : currentImageIndex].url}
                alt={images[showVideo && video ? currentImageIndex - 1 : currentImageIndex].alt}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => onOpenGallery(showVideo && video ? currentImageIndex - 1 : currentImageIndex)}
              />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary/10 to-primary/5">
              <img 
                src="/favicon.svg" 
                alt="Логотип площадки" 
                className="w-32 h-32 opacity-30"
              />
              <div className="flex items-center gap-2 px-4 py-2 bg-background/80 rounded-lg shadow-sm">
                <Icon name="ImageOff" className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-medium">Фото отсутствует</p>
              </div>
            </div>
          )}

          {totalMediaItems > 1 && (
            <>
              <button
                onClick={onPrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background shadow-lg transition-all"
              >
                <Icon name="ChevronLeft" className="h-6 w-6" />
              </button>
              <button
                onClick={onNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background shadow-lg transition-all"
              >
                <Icon name="ChevronRight" className="h-6 w-6" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {[...Array(totalMediaItems)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => onImageIndexChange(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex
                        ? 'bg-white w-6'
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {isPremium && (
            <Badge className="absolute top-4 right-4 gap-1 bg-primary">
              <Icon name="Star" className="h-3 w-3" />
              Премиум
            </Badge>
          )}
        </div>
      </Card>

      {(images.length > 0 || (showVideo && video)) && (
        <div className="grid grid-cols-5 gap-2 mb-6">
          {showVideo && video && (
            <button
              onClick={() => onImageIndexChange(0)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                currentImageIndex === 0
                  ? 'border-primary scale-95'
                  : 'border-transparent hover:border-muted-foreground/30'
              }`}
            >
              <img
                src={video.thumbnail || '/placeholder-video.jpg'}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Icon name="Play" className="h-6 w-6 text-white" />
              </div>
            </button>
          )}
          {images.slice(0, showVideo && video ? 9 : 10).map((image, index) => (
            <button
              key={image.id}
              onClick={() => onImageIndexChange((showVideo && video ? 1 : 0) + index)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                (showVideo && video ? index + 1 : index) === currentImageIndex
                  ? 'border-primary scale-95'
                  : 'border-transparent hover:border-muted-foreground/30'
              }`}
            >
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </>
  );
}