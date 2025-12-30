import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
  aspectRatio?: 'video' | 'square' | 'wide' | 'auto';
  onLoad?: () => void;
}

export default function OptimizedImage({ 
  src, 
  alt, 
  className = '', 
  width,
  height,
  quality = 75,
  priority = false,
  aspectRatio = 'auto',
  onLoad,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const optimizedSrc = src.includes('cdn.poehali.dev') 
    ? `${src}?w=${width || 800}&q=${quality}` 
    : src;

  const getWebPUrl = (url: string): string => {
    if (!url || url.includes('cdn.poehali.dev')) return url;
    if (url.match(/\.(jpg|jpeg|png)$/i)) {
      return url.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    return url;
  };

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== src) {
      target.src = src;
    } else {
      setHasError(true);
    }
  };

  const aspectRatioClass = {
    video: 'aspect-video',
    square: 'aspect-square',
    wide: 'aspect-[21/9]',
    auto: '',
  }[aspectRatio];

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden',
        aspectRatioClass,
        !isLoaded && 'bg-muted',
        className
      )}
    >
      {!isInView && !priority && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 animate-pulse" />
      )}

      {isInView && !hasError && (
        <>
          {!isLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 animate-pulse" />
          )}
          <picture>
            <source srcSet={getWebPUrl(optimizedSrc)} type="image/webp" />
            <img
              src={optimizedSrc}
              alt={alt}
              width={width}
              height={height}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              onLoad={handleLoad}
              onError={handleError}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-300',
                isLoaded ? 'opacity-100' : 'opacity-0'
              )}
            />
          </picture>
        </>
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div className="text-center text-muted-foreground text-xs">
            <svg className="mx-auto h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>Нет фото</p>
          </div>
        </div>
      )}
    </div>
  );
}