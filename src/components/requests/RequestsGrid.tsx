import { useRef, useEffect } from 'react';
import RequestCard from '@/components/RequestCard';
import OfferCardSkeleton from '@/components/OfferCardSkeleton';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { Request, SearchFilters } from '@/types/offer';

const ITEMS_PER_PAGE = 20;

interface RequestsGridProps {
  isLoading: boolean;
  filteredRequests: Request[];
  displayedCount: number;
  isLoadingMore: boolean;
  hasMore: boolean;
  filters: SearchFilters;
  onDelete: (id: string) => void;
  getUnreadMessages: (requestId: string) => number;
  onFiltersChange: (filters: SearchFilters) => void;
  onLoadMore: () => void;
}

export default function RequestsGrid({
  isLoading,
  filteredRequests,
  displayedCount,
  isLoadingMore,
  hasMore,
  filters,
  onDelete,
  getUnreadMessages,
  onFiltersChange,
  onLoadMore,
}: RequestsGridProps) {
  const observerTarget = useRef<HTMLDivElement>(null);
  const currentRequests = filteredRequests.slice(0, displayedCount);

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
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoadingMore, displayedCount, onLoadMore]);

  if (isLoading) {
    return (
      <>
        <div className="mb-6">
          <div className="h-5 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <OfferCardSkeleton key={index} />
          ))}
        </div>
      </>
    );
  }

  if (filteredRequests.length === 0) {
    return (
      <div className="text-center py-20 px-4">
        <div className="max-w-md mx-auto">
          <Icon name="Search" className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
          <h3 className="text-2xl font-semibold mb-3">Запросов не найдено</h3>
          <p className="text-muted-foreground mb-8">
            По вашим фильтрам ничего не найдено. Попробуйте изменить параметры поиска.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() =>
                onFiltersChange({
                  query: '',
                  contentType: 'requests',
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
                  contentType: 'requests',
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
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {currentRequests.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            onDelete={onDelete}
            unreadMessages={getUnreadMessages(request.id)}
          />
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

      {!hasMore && filteredRequests.length > ITEMS_PER_PAGE && (
        <div className="mt-8 text-center py-6 border-t">
          <div className="flex flex-col items-center gap-2">
            <Icon name="CheckCircle2" className="h-6 w-6 text-green-500" />
            <p className="text-sm font-medium text-foreground">
              Показаны все запросы
            </p>
            <p className="text-xs text-muted-foreground">
              Всего найдено: {filteredRequests.length}{' '}
              {filteredRequests.length === 1 ? 'запрос' : filteredRequests.length < 5 ? 'запроса' : 'запросов'}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
