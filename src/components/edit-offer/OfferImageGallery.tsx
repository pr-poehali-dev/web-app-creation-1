import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { OfferImage } from '@/types/offer';

interface OfferImageGalleryProps {
  images: OfferImage[];
  currentImageIndex: number;
  isEditing: boolean;
  isUploadingImage: boolean;
  isSaving: boolean;
  onPrev: () => void;
  onNext: () => void;
  onDelete: (imageId: string) => void;
  onSetMain: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function OfferImageGallery({
  images,
  currentImageIndex,
  isEditing,
  isUploadingImage,
  isSaving,
  onPrev,
  onNext,
  onDelete,
  onSetMain,
  onUpload,
}: OfferImageGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {images && images.length > 0 && (
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
          <img
            src={images[currentImageIndex].url}
            alt={images[currentImageIndex].alt}
            className="w-full h-full object-cover"
          />
          {images.length > 1 && (
            <>
              <button
                onClick={onPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              >
                <Icon name="ChevronLeft" className="h-5 w-5" />
              </button>
              <button
                onClick={onNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              >
                <Icon name="ChevronRight" className="h-5 w-5" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all ${
                      index === currentImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
          {isEditing && (
            <div className="absolute top-2 right-2 flex gap-2">
              {currentImageIndex !== 0 && images.length > 1 && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onSetMain}
                  className="text-xs px-2 h-8 gap-1"
                >
                  <Icon name="Star" className="h-3 w-3" />
                  Сделать главной
                </Button>
              )}
              {currentImageIndex === 0 && images.length > 1 && (
                <span className="flex items-center gap-1 bg-primary text-primary-foreground text-xs px-2 h-8 rounded-md font-medium">
                  <Icon name="Star" className="h-3 w-3" />
                  Главное
                </span>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(images[currentImageIndex].id)}
                disabled={images.length <= 1}
              >
                <Icon name="Trash2" className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {isEditing && (
        <div className="flex items-center justify-center aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
          <div className="text-center space-y-3">
            <Icon name="Upload" className="h-8 w-8 mx-auto text-muted-foreground" />
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onUpload}
                className="hidden"
                id="image-upload"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage || isSaving}
              >
                <Icon name="Plus" className="h-4 w-4 mr-2" />
                Добавить фото
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">JPG, PNG до 5 МБ</p>
          </div>
        </div>
      )}
    </>
  );
}
