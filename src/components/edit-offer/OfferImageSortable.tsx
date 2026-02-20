import type { OfferImage } from '@/types/offer';

interface OfferImageSortableProps {
  images: OfferImage[];
  currentImageIndex: number;
  onSelect: (index: number) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: () => void;
}

export default function OfferImageSortable({
  images,
  currentImageIndex,
  onSelect,
  onDragStart,
  onDragOver,
  onDrop,
}: OfferImageSortableProps) {
  if (images.length <= 1) return null;

  return (
    <div className="col-span-full">
      <p className="text-xs text-muted-foreground mb-2">
        Перетащите фото для изменения порядка. Первое фото — главное на карточке.
      </p>
      <div className="flex gap-2 flex-wrap">
        {images.map((img, index) => (
          <div
            key={img.id}
            draggable
            onDragStart={() => onDragStart(index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDrop={onDrop}
            onClick={() => onSelect(index)}
            className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all ${
              index === currentImageIndex
                ? 'border-primary scale-95'
                : 'border-transparent hover:border-muted-foreground/40'
            }`}
          >
            <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
            {index === 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[9px] text-center font-medium py-0.5">
                Главное
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
