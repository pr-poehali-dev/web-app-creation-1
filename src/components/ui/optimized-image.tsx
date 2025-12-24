interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  quality?: number;
}

export default function OptimizedImage({ 
  src, 
  alt, 
  className = '', 
  width,
  height,
  quality = 75 
}: OptimizedImageProps) {
  // Оптимизируем URL только для CDN
  const optimizedSrc = src.includes('cdn.poehali.dev') 
    ? `${src}?w=${width || 800}&q=${quality}` 
    : src;

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      width={width}
      height={height}
      onError={(e) => {
        // При ошибке загружаем оригинал
        const target = e.target as HTMLImageElement;
        if (target.src !== src) {
          target.src = src;
        }
      }}
    />
  );
}