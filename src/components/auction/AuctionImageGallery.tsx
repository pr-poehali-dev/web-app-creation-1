import { useState } from 'react';
import Icon from '@/components/ui/icon';
import type { Auction } from '@/types/auction';

interface AuctionImageGalleryProps {
  images: Auction['images'];
}

export default function AuctionImageGallery({ images }: AuctionImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  return (
    <div className="space-y-2 md:space-y-3">
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
        {images.length > 0 ? (
          <img
            src={images[selectedImageIndex].url}
            alt={images[selectedImageIndex].alt}
            className="w-full h-full object-cover"
          />
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
  );
}