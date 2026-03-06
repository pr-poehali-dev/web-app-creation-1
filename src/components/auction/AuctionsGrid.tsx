import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import AuctionCard from '@/components/auction/AuctionCard';
import type { Auction } from '@/types/auction';

interface District {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface AuctionsGridProps {
  isLoading: boolean;
  currentAuctions: Auction[];
  filteredCount: number;
  premiumCount: number;
  isLoadingMore: boolean;
  hasMore: boolean;
  isHighlighted: boolean;
  districts: District[];
  isAuthenticated: boolean;
  showOnlyMy: boolean;
  onDelete: (id: string) => void;
  onLoadMore: () => void;
  onCreateClick: () => void;
}

export default function AuctionsGrid({
  isLoading,
  currentAuctions,
  filteredCount,
  premiumCount,
  isLoadingMore,
  hasMore,
  isHighlighted,
  districts,
  isAuthenticated,
  showOnlyMy,
  onDelete,
  onLoadMore,
  onCreateClick,
}: AuctionsGridProps) {
  const observerTarget = useRef<HTMLDivElement>(null);
  const firstAuctionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );
    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => { if (currentTarget) observer.unobserve(currentTarget); };
  }, [hasMore, isLoadingMore, onLoadMore]);

  if (isLoading) {
    return (
      <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-96 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (currentAuctions.length === 0) {
    return (
      <div className="text-center py-10 md:py-16">
        <Icon name="Gavel" className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-3 md:mb-4" />
        <h3 className="text-base md:text-lg font-semibold mb-2">
          {showOnlyMy ? 'У вас пока нет аукционов' : 'Аукционы не найдены'}
        </h3>
        <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
          {showOnlyMy
            ? 'Создайте свой первый аукцион, чтобы начать продавать'
            : 'Попробуйте изменить параметры фильтра или поиска'}
        </p>
        {isAuthenticated && showOnlyMy && (
          <Button onClick={onCreateClick}>Создать аукцион</Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="mb-2 md:mb-3 flex items-center justify-between">
        <p className="text-xs md:text-sm text-muted-foreground">
          Найдено: <span className="font-semibold text-foreground">{filteredCount}</span>{' '}
          {filteredCount === 1 ? 'аукцион' :
           filteredCount < 5 ? 'аукциона' : 'аукционов'}
          {premiumCount > 0 && (
            <span className="ml-2 text-primary">
              ({premiumCount} {premiumCount === 1 ? 'премиум' : 'премиум'})
            </span>
          )}
        </p>
      </div>

      <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {currentAuctions.map((auction, index) => (
          <div
            key={`${auction.id}-${auction.currentBid}-${auction.bidCount}`}
            ref={index === 0 ? firstAuctionRef : null}
          >
            <AuctionCard
              auction={auction}
              districts={districts}
              isAuthenticated={isAuthenticated}
              isHighlighted={isHighlighted}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>

      {hasMore && (
        <div ref={observerTarget} className="flex justify-center items-center py-4 md:py-6">
          {isLoadingMore ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>Загрузка...</span>
            </div>
          ) : (
            <Button onClick={onLoadMore} variant="outline" className="gap-2">
              <Icon name="ChevronDown" className="h-4 w-4" />
              Показать еще
            </Button>
          )}
        </div>
      )}
    </>
  );
}
