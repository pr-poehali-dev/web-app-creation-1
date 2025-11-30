import { useState, useMemo, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import SearchBlock from '@/components/SearchBlock';
import OfferCard from '@/components/OfferCard';
import OfferCardSkeleton from '@/components/OfferCardSkeleton';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { SearchFilters } from '@/types/offer';
import { MOCK_OFFERS } from '@/data/mockOffers';
import { searchOffers } from '@/utils/searchUtils';

interface HomeProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const ITEMS_PER_PAGE = 20;

export default function Home({ isAuthenticated, onLogout }: HomeProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    contentType: 'offers',
    category: '',
    subcategory: '',
    district: 'all',
  });

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const filteredOffers = useMemo(() => {
    let result = [...MOCK_OFFERS];

    if (filters.query && filters.query.length >= 2) {
      result = searchOffers(result, filters.query);
    }

    if (filters.category) {
      result = result.filter((offer) => offer.category === filters.category);
    }

    if (filters.subcategory) {
      result = result.filter((offer) => offer.subcategory === filters.subcategory);
    }

    if (filters.district !== 'all') {
      result = result.filter((offer) => offer.district === filters.district);
    }

    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return result;
  }, [filters]);

  const currentOffers = filteredOffers.slice(0, displayedCount);
  const hasMore = displayedCount < filteredOffers.length;

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
  }, [hasMore, isLoadingMore, displayedCount]);

  const loadMore = () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayedCount((prev) => prev + ITEMS_PER_PAGE);
      setIsLoadingMore(false);
    }, 500);
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setDisplayedCount(ITEMS_PER_PAGE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = () => {
    setDisplayedCount(ITEMS_PER_PAGE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {filters.contentType === 'offers' ? 'Предложения' : 'Запросы'}
          </h1>
          <p className="text-muted-foreground">
            {filters.contentType === 'offers'
              ? 'Найдите товары и услуги от проверенных поставщиков'
              : 'Просмотрите запросы на покупку от покупателей'}
          </p>
        </div>

        <SearchBlock
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSearch={handleSearch}
          allOffers={MOCK_OFFERS}
        />

        {isLoading ? (
          <>
            <div className="mb-6">
              <div className="h-5 w-48 bg-muted animate-pulse rounded" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <OfferCardSkeleton key={index} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Найдено: <span className="font-semibold text-foreground">{filteredOffers.length}</span>{' '}
                  {filteredOffers.length === 1
                    ? 'предложение'
                    : filteredOffers.length < 5
                    ? 'предложения'
                    : 'предложений'}
                </p>
                {filters.query && filters.query.length >= 2 && (
                  <p className="text-sm text-muted-foreground">
                    по запросу: <span className="font-semibold text-foreground">"{filters.query}"</span>
                  </p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Сортировка: <span className="font-semibold text-foreground">По новизне</span>
              </p>
            </div>

            {currentOffers.length === 0 ? (
              <div className="text-center py-16">
                <Icon name="Package" className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Пока нет предложений</h3>
                <p className="text-muted-foreground mb-6">
                  Попробуйте изменить параметры поиска или вернитесь позже
                </p>
                <Button
                  onClick={() =>
                    handleFiltersChange({
                      query: '',
                      contentType: 'offers',
                      category: '',
                      subcategory: '',
                      district: 'all',
                    })
                  }
                >
                  Сбросить фильтры
                </Button>
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {currentOffers.map((offer) => (
                    <OfferCard key={offer.id} offer={offer} />
                  ))}
                </div>

                {hasMore && (
                  <div ref={observerTarget} className="mt-8">
                    {isLoadingMore && (
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <OfferCardSkeleton key={`loading-${index}`} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!hasMore && filteredOffers.length > ITEMS_PER_PAGE && (
                  <div className="mt-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Показаны все предложения ({filteredOffers.length})
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}