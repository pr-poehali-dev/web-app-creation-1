import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DataSyncIndicator from '@/components/DataSyncIndicator';
import OffersHeader from '@/components/offers/OffersHeader';
import OffersFilters from '@/components/offers/OffersFilters';
import OffersList from '@/components/offers/OffersList';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import type { SearchFilters, Offer } from '@/types/offer';
import { searchOffers } from '@/utils/searchUtils';
import { addToSearchHistory } from '@/utils/searchHistory';
import { useDistrict } from '@/contexts/DistrictContext';
import { getSession } from '@/utils/auth';
import { offersAPI, ordersAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { SmartCache, checkForUpdates } from '@/utils/smartCache';

interface OffersProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const ITEMS_PER_PAGE = 20;

function Offers({ isAuthenticated, onLogout }: OffersProps) {
  useScrollToTop();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedRegion, selectedDistricts, districts } = useDistrict();
  const currentUser = getSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showOnlyMy, setShowOnlyMy] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [totalOffersCount, setTotalOffersCount] = useState(0);
  const [hasMoreOnServer, setHasMoreOnServer] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    contentType: 'offers',
    category: '',
    subcategory: '',
    district: 'all',
  });

  useEffect(() => {
    const loadData = async (forceRefresh = false) => {
      // Проверяем были ли обновления при переходах между страницами
      const hasUpdates = checkForUpdates('offers');
      const shouldForceRefresh = forceRefresh || hasUpdates;
      
      // Пробуем загрузить из кэша если не требуется обновление
      if (!shouldForceRefresh) {
        const cached = SmartCache.get<Offer[]>('offers_list');
        if (cached && cached.length > 0) {
          setOffers(cached);
          setIsLoading(false);
          
          // В фоне проверяем нужно ли обновить
          if (SmartCache.shouldRefresh('offers_list')) {
            loadFreshData(false);
          }
          return;
        }
      }
      
      await loadFreshData(true);
    };

    const loadFreshData = async (showLoading = true) => {
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsSyncing(true);
      }
      
      try {
        const offersData = await offersAPI.getOffers({ 
          status: 'active',
          limit: 20,
          offset: 0
        });
        
        setOffers(offersData.offers || []);
        setTotalOffersCount(offersData.total || 0);
        setHasMoreOnServer(offersData.hasMore || false);
        
        // Сохраняем в умный кэш
        SmartCache.set('offers_list', offersData.offers || []);
        
        if (showLoading) {
          setIsLoading(false);
        } else {
          setIsSyncing(false);
        }
        
        // Загружаем заказы в фоне
        setTimeout(() => {
          ordersAPI.getAll('all').then(ordersResponse => {
            setOrders(ordersResponse.orders || []);
          }).catch(() => {});
        }, 500);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        if (showLoading) {
          setIsLoading(false);
        } else {
          setIsSyncing(false);
        }
      }
    };

    loadData(false);

    // Слушаем событие нового заказа
    const handleNewOrder = (event: CustomEvent) => {
      const { orderId, sellerId, buyerName, quantity, unit, offerTitle } = event.detail;
      const currentUserId = currentUser?.id?.toString();
      
      // Если заказ для текущего пользователя
      if (currentUserId === String(sellerId)) {
        // Звук
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSyAzvLZiTYIG2m98OScTgwNUrDo7beHHwU0j9zvyoEuBiV5yPLajkILEmG56+qnVxEKQ5zf8sFuJAUqfsvy14w6BxpnvfDtnjELDlCx6O+8hSMFMpDe7s+FOAYjdsjw3I9BCRFft+jrp1YRCkSc4PKzbSQFKXzM8teNOgcZZr7w7p4yCw5Psejtu4QkBTGQ3u/PhToGInXI8NyPQQkQX7bn7KlYEglEnN/ys2wlBSl8zPLXjToHGGa+8O6dMQwOT7Ho7buEJAUykN7uz4U6BiJ1yPDcj0EJD1+36+uoWBIJQ53g8rNsJQUpfM3y1404Bhlmv/DvnTEMDk+y6O27gyMFMpHe78+FOQYidc3w3I9BCQ9ftuvqqFYSCUOd4PKzbCUFKX3M8teNOQYZZr/w7pwxCw5Psuvrvo4iBS+Q3u/PhTkGInXO8NyQQQkPXrjr6qhVFAlEnuDys2wlBSh8zfLXjDkGGWe/8O+cMgsOTrPr7L+OIgUukN7wz4U6BiJ1zvDckEEJD1647OqnVRQJRJ7g8rNtJQUofM7y1404BhlozfHvmzALDk6068+/jSIFLZHe8c+FOgcjd87w3ZFBCg9eue3qplURCUSe4fK0bCQEJ33N8teMOAYZaM/x7pswCw5Oteve0LyQIgQrj9/xz4Y6ByR31PDelUEKEF+57OmmUxIIRKDh8rVsJAQnfs3y14o4BRZpz/HtmC4KDU607tCzjh8DHpDf8c+FOwgkedfx35ZACxFgsO3qpFIRB0Oh4vKybSMEJn7N89aLOAUVaM/x75gvCg1NvO7Rro8dAxyP3/LPhjsIJHnV8t+WQQsQYbDv66VUEgdDo+Lzs20kBCV+z/PXizcFFWfQ8u+ZMAoOTr/u07eQHwMbj+Dyz4c6CSN419TemkILEGKw8OylVBMHQ6Th8rJvJQQkftHy14s2BRRo0fPvmzIKDk+/7tO5kR8CGY/h89CIOggid9bz3ptCDBBjsvHtplQTB0Ol4/O0bSQEJH/S8tiMNgURZ9Hy8JwyDA9OwO7Uv5EhAxmP4fTRiTsIIXfY89+cQwwQY7Py7qZWEwZBp+TztW4lAyJ/0/LZjDYFEGfS8vGcMw0OT8Hu1cGSIgMYj+P00Io7CSB21/TfnEQNDmO08u6mVxMGQKnl87ZuJgIhftXz2Y0zBQ5m0/LynDUMDlDB79XBkiIDFo/j9dCLOwkhd9f035xGDQ1jtvPvp1gTBj+p5/O3cCcCH33W89qOMwcNZdPy8p02DA9Qw+/Ww5IkAxSN5PXRjDwJIXfZ8+CdRg0MZLb08KdZEwU+qun0uHEoAh191/Tbjjs=');
        audio.volume = 0.3;
        audio.play().catch(() => {});
        
        // Push уведомление
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🛒 Новый заказ!', {
            body: `${buyerName} заказал ${quantity} ${unit} - "${offerTitle}"`,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: `order-${orderId}`,
            requireInteraction: true,
          });
        }
        
        // Обновляем список заказов для бейджа
        ordersAPI.getAll('all').then(ordersResponse => {
          setOrders(ordersResponse.orders || []);
        }).catch(() => {});
      }
    };

    window.addEventListener('newOrderCreated' as any, handleNewOrder);
    
    return () => {
      window.removeEventListener('newOrderCreated' as any, handleNewOrder);
    };
  }, [isAuthenticated, currentUser]);

  const filteredOffers = useMemo(() => {
    let result = [...offers];

    // Скрываем предложения с нулевым доступным количеством
    if (!showOnlyMy) {
      result = result.filter((offer) => {
        const availableQuantity = offer.quantity - (offer.soldQuantity || 0) - (offer.reservedQuantity || 0);
        return availableQuantity > 0;
      });
    }

    if (showOnlyMy && isAuthenticated && currentUser) {
      result = result.filter(offer => String(offer.userId) === String(currentUser.id));
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
  }, [offers, filters, selectedDistricts, showOnlyMy, isAuthenticated, currentUser, selectedRegion, districts]);

  const currentOffers = filteredOffers.slice(0, displayedCount);
  const hasMore = displayedCount < filteredOffers.length;

  const loadMore = async () => {
    if (isLoadingMore || (!hasMore && !hasMoreOnServer)) return;

    setIsLoadingMore(true);
    
    if (offers.length > displayedCount) {
      setTimeout(() => {
        setDisplayedCount((prev) => prev + ITEMS_PER_PAGE);
        setIsLoadingMore(false);
      }, 300);
      return;
    }
    
    if (hasMoreOnServer) {
      try {
        const offersData = await offersAPI.getOffers({ 
          status: 'active',
          limit: 20,
          offset: offers.length
        });
        
        setOffers(prev => [...prev, ...(offersData.offers || [])]);
        setTotalOffersCount(offersData.total || 0);
        setHasMoreOnServer(offersData.hasMore || false);
        setDisplayedCount(prev => prev + ITEMS_PER_PAGE);
      } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
      }
    }
    
    setIsLoadingMore(false);
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
    if (!currentUser) return 0;
    
    const relatedOrders = orders.filter(o => {
      const orderOfferId = o.offer_id || o.offerId;
      const isSeller = String(currentUser.id) === String(o.seller_id || o.sellerId);
      
      return orderOfferId === offerId && 
             o.status === 'new' && 
             isSeller;
    });
    
    return relatedOrders.length;
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
      <DataSyncIndicator isVisible={isSyncing} />

      <main className="container mx-auto px-4 py-4 md:py-8 flex-1">
        <OffersHeader isAuthenticated={isAuthenticated} />
        
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-4">Предложения</h1>

        <OffersFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSearch={handleSearch}
          showOnlyMy={showOnlyMy}
          onShowOnlyMyChange={setShowOnlyMy}
          isAuthenticated={isAuthenticated}
          filteredOffersCount={filteredOffers.length}
          premiumCount={premiumCount}
          selectedDistricts={selectedDistricts}
          districts={districts}
          currentDistrictName={currentDistrictName}
        />

        <OffersList
          isLoading={isLoading}
          filteredOffers={filteredOffers}
          currentOffers={currentOffers}
          premiumCount={premiumCount}
          regularCount={regularCount}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          filters={filters}
          currentDistrictName={currentDistrictName}
          onFiltersChange={handleFiltersChange}
          onDelete={handleDelete}
          getUnreadMessages={getUnreadMessages}
          loadMore={loadMore}
        />
      </main>

      <Footer />
    </div>
  );
}

export default Offers;