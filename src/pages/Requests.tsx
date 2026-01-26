import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import DataSyncIndicator from '@/components/DataSyncIndicator';
import AuctionSearchBlock from '@/components/auction/AuctionSearchBlock';
import RequestCard from '@/components/RequestCard';
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
import { requestsAPI, ordersAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { safeGetTime } from '@/utils/dateUtils';
import { SmartCache, checkForUpdates } from '@/utils/smartCache';

interface RequestsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const ITEMS_PER_PAGE = 20;

export default function Requests({ isAuthenticated, onLogout }: RequestsProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const { selectedRegion, selectedDistricts, districts } = useDistrict();
  const { deleteRequest } = useOffers();
  const currentUser = getSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showOnlyMy, setShowOnlyMy] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    contentType: 'requests',
    category: '',
    subcategory: '',
    district: 'all',
  });

  useEffect(() => {
    const loadRequests = async () => {
      const hasUpdates = checkForUpdates('requests');
      
      // Пробуем загрузить из кэша если нет обновлений
      if (!hasUpdates) {
        const cached = SmartCache.get<Request[]>('requests_list');
        if (cached && cached.length > 0) {
          setRequests(cached);
          setIsLoading(false);
          
          // В фоне проверяем нужно ли обновить
          if (SmartCache.shouldRefresh('requests_list')) {
            loadFreshRequests(false);
          }
          return;
        }
      }
      
      await loadFreshRequests(true);
    };

    const loadFreshRequests = async (showLoading = true) => {
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsSyncing(true);
      }
      
      try {
        const [requestsData, ordersResponse] = await Promise.all([
          requestsAPI.getAll(),
          ordersAPI.getAll('all')
        ]);
        
        setRequests(requestsData.requests || []);
        setOrders(ordersResponse.orders || []);
        
        // Сохраняем в умный кэш
        SmartCache.set('requests_list', requestsData.requests || []);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        if (showLoading) {
          setIsLoading(false);
        } else {
          setIsSyncing(false);
        }
      }
    };

    loadRequests();

    // Проверяем новые отклики только если у пользователя есть активные запросы
    let checkResponsesInterval: NodeJS.Timeout | null = null;
    
    if (isAuthenticated && currentUser && requests.length > 0) {
      const hasMyRequests = requests.some(r => String(r.userId) === String(currentUser.id));
      
      if (hasMyRequests) {
        checkResponsesInterval = setInterval(() => {
          if (!document.hidden) {
            ordersAPI.getAll('all').then(ordersResponse => {
              const newOrders = ordersResponse.orders || [];
              const currentUserId = currentUser.id?.toString();
              
              // Проверяем новые отклики на запросы
              newOrders.forEach((newOrder: any) => {
                const buyerId = newOrder.buyer_id || newOrder.buyerId;
                const oldOrder = orders.find(o => o.id === newOrder.id);
                
                if (!oldOrder && newOrder.status === 'new' && currentUserId === String(buyerId)) {
                  // Звук
                  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSyAzvLZiTYIG2m98OScTgwNUrDo7beHHwU0j9zvyoEuBiV5yPLajkILEmG56+qnVxEKQ5zf8sFuJAUqfsvy14w6BxpnvfDtnjELDlCx6O+8hSMFMpDe7s+FOAYjdsjw3I9BCRFft+jrp1YRCkSc4PKzbSQFKXzM8teNOgcZZr7w7p4yCw5Psejtu4QkBTGQ3u/PhToGInXI8NyPQQkQX7bn7KlYEglEnN/ys2wlBSl8zPLXjToHGGa+8O6dMQwOT7Ho7buEJAUykN7uz4U6BiJ1yPDcj0EJD1+36+uoWBIJQ53g8rNsJQUpfM3y1404Bhlmv/DvnTEMDk+y6O27gyMFMpHe78+FOQYidc3w3I9BCQ9ftuvqqFYSCUOd4PKzbCUFKX3M8teNOQYZZr/w7pwxCw5Psuvrvo4iBS+Q3u/PhTkGInXO8NyQQQkPXrjr6qhVFAlEnuDys2wlBSh8zfLXjDkGGWe/8O+cMgsOTrPr7L+OIgUukN7wz4U6BiJ1zvDckEEJD1647OqnVRQJRJ7g8rNtJQUofM7y1404BhlozfHvmzALDk6068+/jSIFLZHe8c+FOgcjd87w3ZFBCg9eue3qplURCUSe4fK0bCQEJ33N8teMOAYZaM/x7pswCw5Oteve0LyQIgQrj9/xz4Y6ByR31PDelUEKEF+57OmmUxIIRKDh8rVsJAQnfs3y14o4BRZpz/HtmC4KDU607tCzjh8DHpDf8c+FOwgkedfx35ZACxFgsO3qpFIRB0Oh4vKybSMEJn7N89aLOAUVaM/x75gvCg1NvO7Rro8dAxyP3/LPhjsIJHnV8t+WQQsQYbDv66VUEgdDo+Lzs20kBCV+z/PXizcFFWfQ8u+ZMAoOTr/u07eQHwMbj+Dyz4c6CSN419TemkILEGKw8OylVBMHQ6Th8rJvJQQkftHy14s2BRRo0fPvmzIKDk+/7tO5kR8CGY/h89CIOggid9bz3ptCDBBjsvHtplQTB0Ol4/O0bSQEJH/S8tiMNgURZ9Hy8JwyDA9OwO7Uv5EhAxmP4fTRiTsIIXfY89+cQwwQY7Py7qZWEwZBp+TztW4lAyJ/0/LZjDYFEGfS8vGcMw0OT8Hu1cGSIgMYj+P00Io7CSB21/TfnEQNDmO08u6mVxMGQKnl87ZuJgIhftXz2Y0zBQ5m0/LynDUMDlDB79XBkiIDFo/j9dCLOwkhd9f035xGDQ1jtvPvp1gTBj+p5/O3cCcCH33W89qOMwcNZdPy8p02DA9Qw+/Ww5IkAxSN5PXRjDwJIXfZ8+CdRg0MZLb08KdZEwU+qun0uHEoAh191/Tbjjs=');
                  audio.volume = 0.3;
                  audio.play().catch(() => {});
                  
                  // Push уведомление
                  if ('Notification' in window && Notification.permission === 'granted') {
                    const sellerName = newOrder.seller_name || newOrder.sellerName;
                    const offerTitle = newOrder.offer_title || newOrder.offerTitle;
                    new Notification('📬 Новый отклик!', {
                      body: `${sellerName} откликнулся на "${offerTitle}"`,
                      icon: '/favicon.ico',
                      badge: '/favicon.ico',
                      tag: `response-${newOrder.id}`,
                      requireInteraction: true,
                    });
                  }
                }
              });
              
              setOrders(newOrders);
            }).catch(() => {});
          }
        }, 60000); // Каждую минуту
      }
    }

    return () => {
      if (checkResponsesInterval) clearInterval(checkResponsesInterval);
    };
  }, [isAuthenticated, currentUser, requests.length]);

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
            (offer.availableDistricts || []).some(d => selectedDistricts.includes(d))
        );
      } else {
        result = result.filter(
          (offer) =>
            districtsInRegion.includes(offer.district) ||
            (offer.availableDistricts || []).some(d => districtsInRegion.includes(d))
        );
      }
    }

    result.sort((a, b) => {
      return safeGetTime(b.createdAt) - safeGetTime(a.createdAt);
    });

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

  const handleDelete = async (id: string) => {
    try {
      await requestsAPI.deleteRequest(id);
      deleteRequest(id);
      setRequests(prev => prev.filter(r => r.id !== id));
      toast({
        title: 'Успешно',
        description: 'Запрос удалён',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить запрос',
        variant: 'destructive',
      });
    }
  };

  const getUnreadMessages = (requestId: string): number => {
    if (!currentUser) return 0;
    
    const relatedOrders = orders.filter(o => {
      const orderOfferId = o.offer_id || o.offerId;
      const isBuyer = String(currentUser.id) === String(o.buyer_id || o.buyerId);
      
      return orderOfferId === requestId && 
             o.status === 'new' && 
             isBuyer;
    });
    
    return relatedOrders.length;
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
      <DataSyncIndicator isVisible={isSyncing} />

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
                    <div className="flex items-center gap-1.5 px-3 py-2 border-2 border-primary rounded-lg bg-primary/5">
                      <Switch
                        id="show-only-my-requests"
                        checked={showOnlyMy}
                        onCheckedChange={setShowOnlyMy}
                        className="scale-75"
                      />
                      <Label htmlFor="show-only-my-requests" className="cursor-pointer text-foreground font-medium">
                        Только мои
                      </Label>
                    </div>
                  )}
                  
                  <span className="text-muted-foreground">
                    Сортировка: <span className="font-medium text-foreground">Новизна</span>
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

            {filteredRequests.length === 0 ? (
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
                        handleFiltersChange({
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
                        handleFiltersChange({
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
            ) : (
              <>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {currentRequests.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      onDelete={handleDelete}
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
                        Всего найдено: {filteredRequests.length} {filteredRequests.length === 1 ? 'запрос' : filteredRequests.length < 5 ? 'запроса' : 'запросов'}
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