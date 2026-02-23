import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface OfferInfoHeaderProps {
  title: string;
  categoryName: string;
  sellerRating?: number;
}

export default function OfferInfoHeader({ title, categoryName, sellerRating }: OfferInfoHeaderProps) {
  return (
    <div>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h1 className="text-lg md:text-xl font-bold flex-1">{title}</h1>
        {categoryName ? (
          <Badge variant="secondary" className="text-xs flex-shrink-0">{categoryName}</Badge>
        ) : (
          <Badge variant="secondary" className="text-xs flex-shrink-0">Без категории</Badge>
        )}
      </div>
      {sellerRating !== undefined && (
        <button
          onClick={() => {
            const reviewsSection = document.getElementById('seller-reviews');
            if (reviewsSection) {
              reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          className="flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity cursor-pointer group"
        >
          <Icon name="Star" className="h-4 w-4 fill-yellow-400 text-yellow-400 group-hover:scale-110 transition-transform" />
          <span className="font-semibold group-hover:underline">{sellerRating.toFixed(1)}</span>
          <span className="text-muted-foreground group-hover:underline">— рейтинг продавца</span>
        </button>
      )}
    </div>
  );
}
