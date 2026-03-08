import { useState, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import type { Offer } from '@/types/offer';

interface OfferDetailGalleryModalProps {
  offer: Offer;
  isGalleryOpen: boolean;
  galleryIndex: number;
  isVideoPlaying: boolean;
  isMuted: boolean;
  onGalleryChange: (open: boolean) => void;
  onGalleryIndexChange: (index: number) => void;
  onVideoPlayingChange: (playing: boolean) => void;
}

export default function OfferDetailGalleryModal({
  offer,
  isGalleryOpen,
  galleryIndex,
  isVideoPlaying,
  isMuted,
  onGalleryChange,
  onGalleryIndexChange,
  onVideoPlayingChange,
}: OfferDetailGalleryModalProps) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchOffset, setTouchOffset] = useState({ x: 0, y: 0 });
  const galleryRef = useRef<HTMLDivElement>(null);

  const [zoomScale, setZoomScale] = useState(1);
  const [zoomOffset, setZoomOffset] = useState({ x: 0, y: 0 });
  const lastPinchDist = useRef<number | null>(null);
  const lastZoomOffset = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const totalGalleryItems = offer.images.length + (offer.video ? 1 : 0);

  const resetZoom = () => {
    setZoomScale(1);
    setZoomOffset({ x: 0, y: 0 });
    lastZoomOffset.current = { x: 0, y: 0 };
  };

  const handleGalleryPrev = () => {
    resetZoom();
    const newIndex = galleryIndex === 0 ? totalGalleryItems - 1 : galleryIndex - 1;
    onGalleryIndexChange(newIndex);
  };

  const handleGalleryNext = () => {
    resetZoom();
    const newIndex = galleryIndex === totalGalleryItems - 1 ? 0 : galleryIndex + 1;
    onGalleryIndexChange(newIndex);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.hypot(dx, dy);
    } else if (e.touches.length === 1) {
      if (zoomScale > 1) {
        dragStartRef.current = { x: e.touches[0].clientX - lastZoomOffset.current.x, y: e.touches[0].clientY - lastZoomOffset.current.y };
      } else {
        setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDist.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const delta = dist / lastPinchDist.current;
      setZoomScale(s => Math.min(Math.max(s * delta, 1), 5));
      lastPinchDist.current = dist;
    } else if (e.touches.length === 1 && zoomScale > 1 && dragStartRef.current) {
      const nx = e.touches[0].clientX - dragStartRef.current.x;
      const ny = e.touches[0].clientY - dragStartRef.current.y;
      lastZoomOffset.current = { x: nx, y: ny };
      setZoomOffset({ x: nx, y: ny });
    } else if (e.touches.length === 1 && touchStart) {
      const deltaX = e.touches[0].clientX - touchStart.x;
      const deltaY = e.touches[0].clientY - touchStart.y;
      setTouchOffset({ x: deltaX, y: deltaY });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) lastPinchDist.current = null;
    if (e.touches.length === 0) dragStartRef.current = null;

    if (zoomScale > 1) {
      setTouchStart(null);
      return;
    }

    if (!touchStart) return;

    const absX = Math.abs(touchOffset.x);
    const absY = Math.abs(touchOffset.y);

    if (absX > 50 && absX > absY) {
      if (touchOffset.x < 0) {
        handleGalleryNext();
      } else {
        handleGalleryPrev();
      }
    } else if (absY > 100 && absY > absX) {
      onVideoPlayingChange(false);
      onGalleryChange(false);
    }

    setTouchStart(null);
    setTouchOffset({ x: 0, y: 0 });
  };

  const handleGalleryWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoomScale(s => {
      const ns = Math.min(Math.max(s * delta, 1), 5);
      if (ns === 1) { setZoomOffset({ x: 0, y: 0 }); lastZoomOffset.current = { x: 0, y: 0 }; }
      return ns;
    });
  };

  const handleGalleryDoubleClick = () => {
    if (zoomScale > 1) { resetZoom(); }
    else { setZoomScale(2.5); }
  };

  return (
    <Dialog open={isGalleryOpen} onOpenChange={onGalleryChange}>
      <DialogContent className="max-w-7xl w-full h-[90vh] p-0">
        <div
          ref={galleryRef}
          className="relative w-full h-full flex items-center justify-center bg-black"
        >
          {zoomScale > 1 && (
            <button
              onClick={resetZoom}
              className="absolute top-4 left-4 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full px-3 py-1.5 text-xs transition-colors"
            >
              Сбросить
            </button>
          )}

          {zoomScale === 1 && (
            <button
              onClick={handleGalleryPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors"
            >
              <Icon name="ChevronLeft" className="h-6 w-6" />
            </button>
          )}

          <div
            className="w-full h-full flex items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleGalleryWheel}
            onDoubleClick={handleGalleryDoubleClick}
            style={{
              transform: zoomScale === 1 ? `translate(${touchOffset.x}px, ${touchOffset.y}px)` : 'none',
              transition: touchStart ? 'none' : 'transform 0.3s ease-out',
              touchAction: 'none',
            }}
          >
            {galleryIndex < offer.images.length ? (
              <img
                src={offer.images[galleryIndex]?.url}
                alt={offer.images[galleryIndex]?.alt}
                className="max-w-full max-h-full object-contain select-none"
                draggable={false}
                style={{
                  transform: `scale(${zoomScale}) translate(${zoomOffset.x / zoomScale}px, ${zoomOffset.y / zoomScale}px)`,
                  transition: lastPinchDist.current ? 'none' : 'transform 0.15s ease',
                  cursor: zoomScale > 1 ? 'grab' : 'zoom-in',
                }}
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

          {zoomScale === 1 && (
            <button
              onClick={handleGalleryNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors"
            >
              <Icon name="ChevronRight" className="h-6 w-6" />
            </button>
          )}

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
  );
}
