import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import SearchBlock from '@/components/SearchBlock';
import OfferCard from '@/components/OfferCard';
import OfferCardSkeleton from '@/components/OfferCardSkeleton';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import type { SearchFilters } from '@/types/offer';
import { MOCK_OFFERS } from '@/data/mockOffers';
import { searchOffers } from '@/utils/searchUtils';
import { addToSearchHistory } from '@/utils/searchHistory';
import { useDistrict } from '@/contexts/DistrictContext';
import { getSession } from '@/utils/auth';

interface OffersProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const ITEMS_PER_PAGE = 20;

export default function Offers({ isAuthenticated, onLogout }: OffersProps) {
  const navigate = useNavigate();
  const { selectedRegion, selectedDistricts, districts } = useDistrict();
  const currentUser = getSession();
  const [isLoading, setIsLoading] = useState(true);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showOnlyMy, setShowOnlyMy] = useState(false);
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
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const filteredOffers = useMemo(() => {
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
        result = result.filter((offer) => 
          selectedDistricts.includes(offer.district) || 
          offer.availableDistricts.some(d => selectedDistricts.includes(d))
        );
      } else {
        result = result.filter((offer) => 
          districtsInRegion.includes(offer.district) || 
          offer.availableDistricts.some(d => districtsInRegion.includes(d))
        );
      }
    }

    const premiumOffers = result.filter((offer) => offer.isPremium);
    const regularOffers = result.filter((offer) => !offer.isPremium);

    premiumOffers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    regularOffers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return [...premiumOffers, ...regularOffers];
  }, [filters, selectedDistricts, showOnlyMy, isAuthenticated, currentUser]);

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
    }, 400);
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setDisplayedCount(ITEMS_PER_PAGE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = () => {
    if (filters.query && filters.query.length >= 2) {
      addToSearchHistory(filters.query, {
        category: filters.category,
        subcategory: filters.subcategory,
        district: filters.district,
        contentType: filters.contentType
      });
    }
    setDisplayedCount(ITEMS_PER_PAGE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const premiumCount = currentOffers.filter((offer) => offer.isPremium).length;
  const regularCount = currentOffers.length - premiumCount;
  const currentDistrictName = districts.find(d => d.id === filters.district)?.name;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Предложения</h1>
            <p className="text-muted-foreground">
              Активные предложения от проверенных поставщиков в вашем районе
            </p>
          </div>
          {isAuthenticated && (
            <Button onClick={() => navigate('/create-offer')} className="flex items-center gap-2 whitespace-nowrap">
              <Icon name="Plus" className="h-4 w-4" />
              Создать предложение
            </Button>
          )}
        </div>

        {filters.district !== 'all' && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Icon name="MapPin" className="h-5 w-5 text-primary" />
                <p className="text-sm">
                  Район: <span className="font-semibold">{currentDistrictName}</span>
                </p>
                <span className="text-xs text-muted-foreground ml-auto">
                  Показаны предложения, доступные в этом районе
                </span>
              </div>
            </CardContent>
          </Card>
        )}

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
                    <Icon name="Package" className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Найдено: <span className="font-semibold text-foreground">{filteredOffers.length}</span>{' '}
                      {filteredOffers.length === 1
                        ? 'предложение'
                        : filteredOffers.length < 5
                        ? 'предложения'
                        : 'предложений'}
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

                  {premiumCount > 0 && (
                    <div className="flex items-center gap-2">
                      <Icon name="Star" className="h-4 w-4 text-primary" />
                      <p className="text-sm text-muted-foreground">
                        Премиум: <span className="font-semibold text-primary">{premiumCount}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  {isAuthenticated && (
                    <div className="flex items-center gap-2">
                      <Switch
                        id="show-only-my"
                        checked={showOnlyMy}
                        onCheckedChange={setShowOnlyMy}
                      />
                      <Label htmlFor="show-only-my" className="text-sm cursor-pointer">
                        Только мои предложения
                      </Label>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Icon name="ArrowDownUp" className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Сортировка: <span className="font-semibold text-foreground">Премиум + По новизне</span>
                    </p>
                  </div>
                </div>
              </div>

              {filters.category && (
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
                </div>
              )}
            </div>

            {currentOffers.length === 0 ? (
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
                        handleFiltersChange({
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
                        handleFiltersChange({
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
            ) : (
              <>
                {premiumCount > 0 && regularCount > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <Icon name="Star" className="h-4 w-4" />
                      <span>Оплаченные объявления ({premiumCount})</span>
                    </div>
                  </div>
                )}

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {currentOffers.map((offer, index) => (
                    <div key={offer.id}>
                      {index === premiumCount && premiumCount > 0 && (
                        <div className="col-span-full mb-4 mt-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Icon name="Package" className="h-4 w-4" />
                            <span>Обычные объявления ({regularCount})</span>
                          </div>
                        </div>
                      )}
                      <OfferCard offer={offer} />
                    </div>
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
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}