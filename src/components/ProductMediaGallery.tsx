import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface ProductMediaGalleryProps {
  images?: string[];
  videoUrl?: string;
  productName: string;
}

export default function ProductMediaGallery({ images = [], videoUrl, productName }: ProductMediaGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [showVideo, setShowVideo] = useState(false);

  if (!images.length && !videoUrl) {
    return (
      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
        <Icon name="ImageOff" className="h-12 w-12 text-muted-foreground" />
      </div>
    );
  }

  const mainMedia = images[0] || videoUrl;
  const hasMultipleImages = images.length > 1;

  return (
    <>
      <div className="space-y-2">
        <div className="relative group cursor-pointer" onClick={() => {
          if (images[0]) {
            setSelectedImageIndex(0);
          } else if (videoUrl) {
            setShowVideo(true);
          }
        }}>
          {images[0] ? (
            <img
              src={images[0]}
              alt={productName}
              className="w-full h-48 object-cover rounded-lg"
            />
          ) : videoUrl ? (
            <div className="relative w-full h-48 rounded-lg overflow-hidden">
              <video
                src={videoUrl}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Icon name="Play" className="h-12 w-12 text-white" />
              </div>
            </div>
          ) : null}
          
          {hasMultipleImages && (
            <Badge className="absolute top-2 right-2 bg-black/70">
              <Icon name="Images" className="h-3 w-3 mr-1" />
              {images.length}
            </Badge>
          )}
        </div>

        {hasMultipleImages && (
          <div className="grid grid-cols-4 gap-2">
            {images.slice(1, 5).map((image, index) => (
              <div
                key={index}
                className="relative cursor-pointer group"
                onClick={() => setSelectedImageIndex(index + 1)}
              >
                <img
                  src={image}
                  alt={`${productName} ${index + 2}`}
                  className="w-full h-16 object-cover rounded-md"
                />
                {index === 3 && images.length > 5 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-md">
                    <span className="text-white font-semibold">+{images.length - 5}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {videoUrl && images.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVideo(true)}
            className="w-full"
          >
            <Icon name="Video" className="h-4 w-4 mr-2" />
            Смотреть видео
          </Button>
        )}
      </div>

      {selectedImageIndex !== null && (
        <Dialog open={true} onOpenChange={() => setSelectedImageIndex(null)}>
          <DialogContent className="max-w-4xl">
            <div className="relative">
              <img
                src={images[selectedImageIndex]}
                alt={`${productName} ${selectedImageIndex + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              
              {images.length > 1 && (
                <div className="absolute top-1/2 -translate-y-1/2 left-2 right-2 flex justify-between">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                    disabled={selectedImageIndex === 0}
                  >
                    <Icon name="ChevronLeft" className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setSelectedImageIndex(Math.min(images.length - 1, selectedImageIndex + 1))}
                    disabled={selectedImageIndex === images.length - 1}
                  >
                    <Icon name="ChevronRight" className="h-6 w-6" />
                  </Button>
                </div>
              )}

              <div className="mt-4 text-center text-sm text-muted-foreground">
                {selectedImageIndex + 1} / {images.length}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showVideo && videoUrl && (
        <Dialog open={true} onOpenChange={() => setShowVideo(false)}>
          <DialogContent className="max-w-4xl">
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full h-auto max-h-[80vh]"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}