import { useState, useMemo, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import SearchBlock from '@/components/SearchBlock';
import OfferCardSkeleton from '@/components/OfferCardSkeleton';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import type { SearchFilters } from '@/types/offer';
import { MOCK_OFFERS } from '@/data/mockOffers';
import { searchOffers } from '@/utils/searchUtils';
import { useDistrict } from '@/contexts/DistrictContext';
import { getSession } from '@/utils/auth';

interface RequestsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const ITEMS_PER_PAGE = 20;

export default function Requests({ isAuthenticated, onLogout }: RequestsProps) {
  const { selectedRegion, selectedDistricts, districts } = useDistrict();
  const currentUser = getSession();
  const [isLoading, setIsLoading] = useState(true);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showOnlyMy, setShowOnlyMy] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    contentType: 'requests',
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

  const filteredRequests = useMemo(() => {
    let result = [...MOCK_OFFERS];

    if (showOnlyMy && isAuthenticated && currentUser) {
      result = result.filter(offer => offer.userId === currentUser.id);
    }

    if (filters.query && filters.query.length >= 2) {
      result = searchOffers(result, filters.query);
    }

    if (filters.category) {
      result = result.filter((offer) => offer.category === filters.category);
    }

    if (filters.subcategory) {
      result = result.filter((offer) => offer.subcategory === filters.subcategory);
    }

    if (selectedRegion !== 'all') {
      const districtsInRegion = districts.map(d => d.id);
      
      if (selectedDistricts.length > 0) {
        result = result.filter(
          (offer) =>
            selectedDistricts.includes(offer.district) ||
            offer.availableDistricts.some(d => selectedDistricts.includes(d))
        );
      } else {
        result = result.filter(
          (offer) =>
            districtsInRegion.includes(offer.district) ||
            offer.availableDistricts.some(d => districtsInRegion.includes(d))
        );
      }
    }

    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return result;
  }, [filters, selectedDistricts, showOnlyMy, isAuthenticated, currentUser]);

  const currentRequests = filteredRequests.slice(0, displayedCount);
  const hasMore = displayedCount < filteredRequests.length;

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
          <h1 className="text-3xl font-bold text-foreground mb-2">Запросы</h1>
          <p className="text-muted-foreground">
            Просмотрите запросы на покупку товаров и услуг от покупателей
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
            <div className="mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Icon name="FileText" className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Найдено: <span className="font-semibold text-foreground">{filteredRequests.length}</span>{' '}
                      {filteredRequests.length === 1
                        ? 'запрос'
                        : filteredRequests.length < 5
                        ? 'запроса'
                        : 'запросов'}
                    </p>
                  </div>
                  
                  {filters.query && filters.query.length >= 2 && (
                    <div className="flex items-center gap-2">
                      <Icon name="Search" className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        по запросу: <span className="font-semibold text-foreground">"{filters.query}"</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  {isAuthenticated && (
                    <div className="flex items-center gap-2">
                      <Switch
                        id="show-only-my-requests"
                        checked={showOnlyMy}
                        onCheckedChange={setShowOnlyMy}
                      />
                      <Label htmlFor="show-only-my-requests" className="text-sm cursor-pointer">
                        Только мои запросы
                      </Label>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Icon name="ArrowDownUp" className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Сортировка: <span className="font-semibold text-foreground">По новизне</span>
                    </p>
                  </div>
                </div>
              </div>

              {(filters.category || selectedDistricts.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {filters.category && (
                    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                      <Icon name="Tag" className="h-3 w-3" />
                      {filters.category}
                    </span>
                  )}
                  {filters.subcategory && (
                    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                      {filters.subcategory}
                    </span>
                  )}
                  {selectedDistricts.length > 0 && (
                    <>
                      {selectedDistricts.slice(0, 3).map((districtId) => {
                        const district = districts.find(d => d.id === districtId);
                        return (
                          <span key={districtId} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                            <Icon name="MapPin" className="h-3 w-3" />
                            {district?.name}
                          </span>
                        );
                      })}
                      {selectedDistricts.length > 3 && (
                        <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-medium">
                          +{selectedDistricts.length - 3} еще
                        </span>
                      )}
                    </>
                  )}
                  {filters.district !== 'all' && (
                    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                      <Icon name="MapPin" className="h-3 w-3" />
                      {filters.district}
                    </span>
                  )}
                </div>
              )}
            </div>

            {currentRequests.length === 0 ? (
              <div className="text-center py-20">
                <Icon name="FileText" className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-2">Пока нет запросов</h3>
                <p className="text-muted-foreground mb-8">
                  Попробуйте изменить параметры поиска или выбрать другой район
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
                  {currentRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer">
                      <h3 className="font-semibold mb-2">{request.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{request.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">
                          {request.pricePerUnit.toLocaleString()} ₽
                        </span>
                        <Button size="sm">Отправить отклик</Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div ref={observerTarget} className="flex justify-center py-8">
                  {isLoadingMore && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icon name="Loader2" className="h-5 w-5 animate-spin" />
                      <span>Загрузка...</span>
                    </div>
                  )}
                  {!hasMore && currentRequests.length > ITEMS_PER_PAGE && (
                    <p className="text-muted-foreground">Больше нет запросов</p>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}