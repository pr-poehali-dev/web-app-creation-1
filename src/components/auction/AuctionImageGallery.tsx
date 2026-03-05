import { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '@/components/ui/icon';
import type { Auction } from '@/types/auction';

interface AuctionImageGalleryProps {
  images: Auction['images'];
}

export default function AuctionImageGallery({ images }: AuctionImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const lastTouchDist = useRef<number | null>(null);
  const lastOffset = useRef({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  const resetZoom = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const prev = useCallback(() => {
    resetZoom();
    setSelectedImageIndex(i => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    resetZoom();
    setSelectedImageIndex(i => (i + 1) % images.length);
  }, [images.length]);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    resetZoom();
  }, []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft' && scale === 1) prev();
      if (e.key === 'ArrowRight' && scale === 1) next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, prev, next, closeLightbox, scale]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.hypot(dx, dy);
    } else if (e.touches.length === 1 && scale > 1) {
      dragStart.current = { x: e.touches[0].clientX - lastOffset.current.x, y: e.touches[0].clientY - lastOffset.current.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const delta = dist / lastTouchDist.current;
      setScale(s => Math.min(Math.max(s * delta, 1), 5));
      lastTouchDist.current = dist;
    } else if (e.touches.length === 1 && scale > 1 && dragStart.current) {
      const nx = e.touches[0].clientX - dragStart.current.x;
      const ny = e.touches[0].clientY - dragStart.current.y;
      lastOffset.current = { x: nx, y: ny };
      setOffset({ x: nx, y: ny });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) lastTouchDist.current = null;
    if (e.touches.length === 0) dragStart.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(s => {
      const ns = Math.min(Math.max(s * delta, 1), 5);
      if (ns === 1) { setOffset({ x: 0, y: 0 }); lastOffset.current = { x: 0, y: 0 }; }
      return ns;
    });
  };

  const handleDoubleClick = () => {
    if (scale > 1) { resetZoom(); lastOffset.current = { x: 0, y: 0 }; }
    else { setScale(2.5); }
  };

  return (
    <>
      <div className="space-y-2 md:space-y-3">
        <div
          className="relative aspect-video bg-muted rounded-lg overflow-hidden cursor-zoom-in group"
          onClick={() => images.length > 0 && setLightboxOpen(true)}
        >
          {images.length > 0 ? (
            <>
              <img
                src={images[selectedImageIndex].url}
                alt={images[selectedImageIndex].alt}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Icon name="ZoomIn" className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
              {images.length > 1 && (
                <>
                  <button
                    onClick={e => { e.stopPropagation(); prev(); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icon name="ChevronLeft" className="h-4 w-4" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); next(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icon name="ChevronRight" className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                    {selectedImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="flex items-center space-x-2 opacity-30">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary">
                  <Icon name="Building2" className="h-10 w-10 text-white" />
                </div>
                <span className="text-4xl font-bold text-primary">ЕРТТП</span>
              </div>
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-1.5 md:gap-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`aspect-video rounded overflow-hidden border-2 ${
                  selectedImageIndex === index ? 'border-primary' : 'border-transparent'
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
      </div>

      {lightboxOpen && images.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => scale === 1 && closeLightbox()}
        >
          <button
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 z-10"
            onClick={closeLightbox}
          >
            <Icon name="X" className="h-5 w-5" />
          </button>

          {scale > 1 && (
            <button
              className="absolute top-4 left-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 z-10 text-xs px-3"
              onClick={e => { e.stopPropagation(); resetZoom(); lastOffset.current = { x: 0, y: 0 }; }}
            >
              Сбросить
            </button>
          )}

          {images.length > 1 && scale === 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full p-3 z-10"
                onClick={e => { e.stopPropagation(); prev(); }}
              >
                <Icon name="ChevronLeft" className="h-6 w-6" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full p-3 z-10"
                onClick={e => { e.stopPropagation(); next(); }}
              >
                <Icon name="ChevronRight" className="h-6 w-6" />
              </button>
            </>
          )}

          <div
            ref={imgRef}
            className="max-h-[90vh] max-w-[90vw] overflow-hidden"
            style={{ touchAction: 'none' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            onDoubleClick={handleDoubleClick}
            onClick={e => e.stopPropagation()}
          >
            <img
              src={images[selectedImageIndex].url}
              alt={images[selectedImageIndex].alt}
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg select-none"
              style={{
                transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
                transition: lastTouchDist.current ? 'none' : 'transform 0.15s ease',
                cursor: scale > 1 ? 'grab' : 'zoom-in',
              }}
              draggable={false}
            />
          </div>

          {images.length > 1 && scale === 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={e => { e.stopPropagation(); setSelectedImageIndex(index); resetZoom(); }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === selectedImageIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}

          {scale === 1 && (
            <div className="absolute bottom-4 right-4 text-white/50 text-xs">
              Двойной клик или щипок для увеличения
            </div>
          )}
        </div>
      )}
    </>
  );
}
