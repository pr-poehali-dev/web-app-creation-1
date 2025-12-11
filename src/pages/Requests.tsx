import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import AuctionSearchBlock from '@/components/auction/AuctionSearchBlock';
import OfferCardSkeleton from '@/components/OfferCardSkeleton';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import type { SearchFilters, Request } from '@/types/offer';
import { searchOffers } from '@/utils/searchUtils';
import { useDistrict } from '@/contexts/DistrictContext';
import { useOffers } from '@/contexts/OffersContext';
import { getSession } from '@/utils/auth';
import { requestsAPI } from '@/services/api';

interface RequestsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const ITEMS_PER_PAGE = 20;

export default function Requests({ isAuthenticated, onLogout }: RequestsProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const { selectedRegion, selectedDistricts, districts } = useDistrict();
  const { requests: contextRequests } = useOffers();
  const currentUser = getSession();
  const [isLoading, setIsLoading] = useState(true);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showOnlyMy, setShowOnlyMy] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const [requests, setRequests] = useState<Request[]>([]);

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    contentType: 'requests',
    category: '',
    subcategory: '',
    district: 'all',
  });

  useEffect(() => {
    const loadRequests = async () => {
      setIsLoading(true);
      try {
        const response = await requestsAPI.getRequests({ status: 'active' });
        const requestsWithDates = response.requests.map(req => ({
          ...req,
          createdAt: new Date(req.createdAt),
          updatedAt: req.updatedAt ? new Date(req.updatedAt) : undefined,
        }));
        setRequests(requestsWithDates);
      } catch (error) {
        console.error('Ошибка загрузки запросов:', error);
        setRequests(contextRequests);
      } finally {
        setIsLoading(false);
      }
    };

    loadRequests();
  }, [contextRequests]);

  const filteredRequests = useMemo(() => {
    let result = [...requests];

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
  }, [requests, filters, selectedDistricts, showOnlyMy, isAuthenticated, currentUser]);

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

      <main className="container mx-auto px-4 py-4 md:py-8 flex-1">
        <div className="flex items-center justify-between gap-2 mb-4">
          <BackButton />
          {isAuthenticated && (
            <Button onClick={() => navigate('/create-request')} className="flex items-center gap-2 whitespace-nowrap">
              <Icon name="Plus" className="h-4 w-4" />
              <span>Создать запрос</span>
            </Button>
          )}
        </div>
        
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-4">Запросы</h1>

        <AuctionSearchBlock
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSearch={handleSearch}
          placeholder="Поиск по запросам..."
          label="Поиск запросов"
        />

        {isLoading ? (
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
        ) : (
          <>
            <div className="mb-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <span className="text-muted-foreground">Найдено:</span>
                  <span className="font-semibold">{filteredRequests.length}</span>
                  {filters.query && filters.query.length >= 2 && (
                    <span className="text-muted-foreground">по "{filters.query}"</span>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-wrap text-xs">
                  {isAuthenticated && (
                    <div className="flex items-center gap-1.5">
                      <Switch
                        id="show-only-my-requests"
                        checked={showOnlyMy}
                        onCheckedChange={setShowOnlyMy}
                        className="scale-75"
                      />
                      <Label htmlFor="show-only-my-requests" className="cursor-pointer text-muted-foreground">
                        Только мои
                      </Label>
                    </div>
                  )}
                  
                  <span className="text-muted-foreground">
                    Сортировка: <span className="font-medium text-foreground">По новизне</span>
                  </span>
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
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 mb-6">
                  {currentRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-3 hover:shadow-lg transition-shadow">
                      <div onClick={() => navigate(`/request/${request.id}`)} className="cursor-pointer mb-2">
                        <h3 className="font-semibold text-sm mb-1 line-clamp-2">{request.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">{request.description}</p>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-primary">
                          {request.pricePerUnit ? request.pricePerUnit.toLocaleString() : '0'} ₽
                        </span>
                        <Button 
                          size="sm" 
                          onClick={() => navigate(`/request/${request.id}`)}
                          className="h-7 text-xs px-2"
                        >
                          Отклик
                        </Button>
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