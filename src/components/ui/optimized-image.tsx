import { useState } from 'react';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const optimizedSrc = src.includes('cdn.poehali.dev') 
    ? `${src}?w=${width || 800}&q=${quality}` 
    : src;

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5`}>
        <div className="flex items-center space-x-2 opacity-30">
          <svg className="h-10 w-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className={`${className} flex items-center justify-center bg-muted animate-pulse`}>
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <img
        src={optimizedSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`${className} ${isLoading ? 'hidden' : ''}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setError(true);
        }}
        width={width}
        height={height}
      />
    </>
  );
}
