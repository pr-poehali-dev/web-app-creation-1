import { useRef, useEffect } from 'react';
import OfferCard from '@/components/OfferCard';
import OfferCardSkeleton from '@/components/OfferCardSkeleton';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { Offer, SearchFilters } from '@/types/offer';

interface OffersListProps {
  isLoading: boolean;
  filteredOffers: Offer[];
  currentOffers: Offer[];
  premiumCount: number;
  regularCount: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  filters: SearchFilters;
  currentDistrictName?: string;
  onFiltersChange: (filters: SearchFilters) => void;
  onDelete: (id: string) => Promise<void>;
  getUnreadMessages: (offerId: string) => number;
  loadMore: () => Promise<void>;
}

const ITEMS_PER_PAGE = 20;

function OffersList({
  isLoading,
  filteredOffers,
  currentOffers,
  premiumCount,
  regularCount,
  hasMore,
  isLoadingMore,
  filters,
  currentDistrictName,
  onFiltersChange,
  onDelete,
  getUnreadMessages,
  loadMore,
}: OffersListProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoadingMore, loadMore]);

  if (isLoading) {
    return (
      <>
        <div className="mb-6">
          <div className="h-5 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <OfferCardSkeleton key={index} />
          ))}
        </div>
      </>
    );
  }

  if (filteredOffers.length === 0) {
    return (
      <div className="text-center py-20 px-4">
        <div className="max-w-md mx-auto">
          <Icon name="Package" className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
          <h3 className="text-2xl font-semibold mb-3">Пока нет предложений</h3>
          <p className="text-muted-foreground mb-8">
            {filters.district !== 'all' 
              ? `В районе "${currentDistrictName}" пока нет доступных предложений`
              : 'По вашим фильтрам ничего не найдено'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() =>
                onFiltersChange({
                  query: '',
                  contentType: 'offers',
                  category: '',
                  subcategory: '',
                  district: filters.district,
                })
              }
              variant="outline"
              className="gap-2"
            >
              <Icon name="RotateCcw" className="h-4 w-4" />
              Сбросить фильтры
            </Button>
            <Button
              onClick={() =>
                onFiltersChange({
                  query: '',
                  contentType: 'offers',
                  category: '',
                  subcategory: '',
                  district: 'all',
                })
              }
              className="gap-2"
            >
              <Icon name="Globe" className="h-4 w-4" />
              Все районы
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {premiumCount > 0 && regularCount > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <Icon name="Star" className="h-3.5 w-3.5" />
            <span>Оплаченные ({premiumCount})</span>
          </div>
        </div>
      )}

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {currentOffers.map((offer, index) => (
          <div key={offer.id}>
            {index === premiumCount && premiumCount > 0 && (
              <div className="col-span-full mb-2 mt-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Icon name="Package" className="h-3.5 w-3.5" />
                  <span>Обычные ({regularCount})</span>
                </div>
              </div>
            )}
            <OfferCard 
              offer={offer} 
              onDelete={onDelete}
              unreadMessages={getUnreadMessages(offer.id)}
            />
          </div>
        ))}
      </div>

      {hasMore && (
        <div ref={observerTarget} className="mt-8">
          {isLoadingMore && (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <OfferCardSkeleton key={`loading-${index}`} />
              ))}
            </div>
          )}
        </div>
      )}

      {!hasMore && filteredOffers.length > ITEMS_PER_PAGE && (
        <div className="mt-8 text-center py-6 border-t">
          <div className="flex flex-col items-center gap-2">
            <Icon name="CheckCircle2" className="h-6 w-6 text-green-500" />
            <p className="text-sm font-medium text-foreground">
              Показаны все предложения
            </p>
            <p className="text-xs text-muted-foreground">
              Всего найдено: {filteredOffers.length} {filteredOffers.length === 1 ? 'предложение' : filteredOffers.length < 5 ? 'предложения' : 'предложений'}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default OffersList;
