import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import AuctionSearchBlock from '@/components/auction/AuctionSearchBlock';
import OfferCard from '@/components/OfferCard';
import OfferCardSkeleton from '@/components/OfferCardSkeleton';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import type { SearchFilters, Offer } from '@/types/offer';
import { searchOffers } from '@/utils/searchUtils';
import { addToSearchHistory } from '@/utils/searchHistory';
import { useDistrict } from '@/contexts/DistrictContext';
import { getSession } from '@/utils/auth';
import { offersAPI, ordersAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface OffersProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const ITEMS_PER_PAGE = 20;

export default function Offers({ isAuthenticated, onLogout }: OffersProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const { selectedRegion, selectedDistricts, districts } = useDistrict();
  const currentUser = getSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showOnlyMy, setShowOnlyMy] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    contentType: 'offers',
    category: '',
    subcategory: '',
    district: 'all',
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [offersData, ordersResponse] = await Promise.all([
          offersAPI.getOffers({ status: 'active' }),
          ordersAPI.getAll('all')
        ]);
        setOffers(offersData.offers || []);
        setOrders(ordersResponse.orders || []);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredOffers = useMemo(() => {
    let result = [...offers];

    if (showOnlyMy && isAuthenticated && currentUser) {
      result = result.filter(offer => offer.userId === currentUser.id);
    }

    if (filters.query && filters.query.length >= 2) {
      result = searchOffers(result, filters.query);
    }

    if (filters.category) {
      if (filters.category === 'uncategorized') {
        result = result.filter((offer) => !offer.category || offer.category === '');
      } else {
        result = result.filter((offer) => offer.category === filters.category);
      }
    }

    if (filters.subcategory) {
      result = result.filter((offer) => offer.subcategory === filters.subcategory);
    }

    if (selectedRegion !== 'all') {
      const districtsInRegion = districts.map(d => d.id);
      
      if (selectedDistricts.length > 0) {
        result = result.filter((offer) => 
          selectedDistricts.includes(offer.district) || 
          (offer.availableDistricts || []).some(d => selectedDistricts.includes(d))
        );
      } else {
        result = result.filter((offer) => 
          districtsInRegion.includes(offer.district) || 
          (offer.availableDistricts || []).some(d => districtsInRegion.includes(d))
        );
      }
    }

    const premiumOffers = result.filter((offer) => offer.isPremium);
    const regularOffers = result.filter((offer) => !offer.isPremium);

    premiumOffers.sort((a, b) => {
      const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt) : a.createdAt;
      const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt;
      return dateB.getTime() - dateA.getTime();
    });
    regularOffers.sort((a, b) => {
      const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt) : a.createdAt;
      const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt;
      return dateB.getTime() - dateA.getTime();
    });

    return [...premiumOffers, ...regularOffers];
  }, [offers, filters, selectedDistricts, showOnlyMy, isAuthenticated, currentUser]);

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

  const handleDelete = async (id: string) => {
    try {
      await offersAPI.updateOffer(id, { status: 'archived' });
      setOffers(prev => prev.filter(o => o.id !== id));
      toast({
        title: 'Успешно',
        description: 'Объявление удалено',
      });
    } catch (error) {
      console.error('Ошибка удаления предложения:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить предложение',
        variant: 'destructive',
      });
    }
  };

  const getUnreadMessages = (offerId: string): number => {
    const relatedOrders = orders.filter(o => {
      const orderOfferId = o.offer_id || o.offerId;
      return orderOfferId === offerId;
    });
    return relatedOrders.length > 0 ? relatedOrders.length : 0;
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

  const premiumCount = filteredOffers.filter((offer) => offer.isPremium).length;
  const regularCount = filteredOffers.length - premiumCount;
  const currentDistrictName = districts.find(d => d.id === filters.district)?.name;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-4 md:py-8 flex-1">
        <div className="flex items-center justify-between gap-2 mb-4">
          <BackButton />
          {isAuthenticated && (
            <Button onClick={() => navigate('/create-offer')} className="flex items-center gap-2 whitespace-nowrap">
              <Icon name="Plus" className="h-4 w-4" />
              <span>Создать предложение</span>
            </Button>
          )}
        </div>
        
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-4">Предложения</h1>

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

        <AuctionSearchBlock
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSearch={handleSearch}
          placeholder="Поиск по предложениям..."
          label="Поиск предложений"
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
            <div className="mb-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <span className="text-muted-foreground">Найдено:</span>
                  <span className="font-semibold">{filteredOffers.length}</span>
                  {filters.query && filters.query.length >= 2 && (
                    <span className="text-muted-foreground">по "{filters.query}"</span>
                  )}
                  {premiumCount > 0 && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <Icon name="Star" className="h-3.5 w-3.5 text-primary inline" />
                      <span className="text-primary font-semibold">{premiumCount}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-wrap text-xs">
                  {isAuthenticated && (
                    <div className="flex items-center gap-1.5 px-3 py-2 border-2 border-primary rounded-lg bg-primary/5">
                      <Switch
                        id="show-only-my"
                        checked={showOnlyMy}
                        onCheckedChange={setShowOnlyMy}
                        className="scale-75"
                      />
                      <Label htmlFor="show-only-my" className="cursor-pointer text-foreground font-medium">
                        Только мои
                      </Label>
                    </div>
                  )}
                  
                  <span className="text-muted-foreground">
                    Сортировка: <span className="font-medium text-foreground">Премиум + Новизна</span>
                  </span>
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

            {filteredOffers.length === 0 ? (
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
                        onDelete={handleDelete}
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
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}