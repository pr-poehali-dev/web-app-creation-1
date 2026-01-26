export const getOptimizedImageUrl = (url: string, width?: number): string => {
  if (!url) return '';
  
  if (url.includes('cdn.poehali.dev')) {
    const baseUrl = url.split('?')[0];
    const params = new URLSearchParams();
    
    if (width) {
      params.set('w', width.toString());
      params.set('q', '85');
      params.set('fm', 'webp');
    }
    
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  }
  
  return url;
};

export const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
};

export const lazyLoadImage = (
  imgElement: HTMLImageElement,
  src: string,
  placeholder?: string
) => {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          imgElement.src = src;
          observer.unobserve(imgElement);
        }
      });
    }, {
      rootMargin: '50px',
    });

    if (placeholder) {
      imgElement.src = placeholder;
    }
    
    observer.observe(imgElement);
  } else {
    imgElement.src = src;
  }
};
