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
import { dataSync } from '@/utils/dataSync';
import { filterActiveOffers } from '@/utils/expirationFilter';
import { useOffers } from '@/contexts/OffersContext';
import SEO from '@/components/SEO';

interface OffersProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const ITEMS_PER_PAGE = 20;

function Offers({ isAuthenticated, onLogout }: OffersProps) {
  useScrollToTop();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedRegion, selectedDistricts, districts, detectedDistrictId } = useDistrict();
  const currentUser = getSession();
  const { toast } = useToast();
  const { setOffers: setGlobalOffers } = useOffers();
  const [isLoading, setIsLoading] = useState(true);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showOnlyMy, setShowOnlyMy] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [orders, setOrders] = useState<unknown[]>([]);
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
    let isMounted = true;
    let isLoading = false;

    const loadData = async (forceRefresh = false) => {
      if (isLoading) return;
      isLoading = true;
      const hasUpdates = checkForUpdates('offers');
      const shouldForceRefresh = forceRefresh || hasUpdates;
      
      if (!shouldForceRefresh) {
        const cached = SmartCache.get<Offer[]>('offers_list');
        if (cached && cached.length > 0) {
          setOffers(cached);
          setIsLoading(false);
          
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
        // Таймаут для предотвращения вечной загрузки
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Превышено время ожидания загрузки')), 15000)
        );
        
        const offersData = await Promise.race([
          offersAPI.getOffers({ 
            status: 'active',
            limit: 20,
            offset: 0
          }),
          timeoutPromise
        ]) as { offers: Offer[]; total: number; hasMore: boolean };
        
        if (!isMounted) return;
        
        const loadedOffers = offersData.offers || [];
        setOffers(loadedOffers);
        setGlobalOffers(loadedOffers);
        setTotalOffersCount(offersData.total || 0);
        setHasMoreOnServer(offersData.hasMore || false);
        
        SmartCache.set('offers_list', loadedOffers);
        
        if (showLoading) {
          setIsLoading(false);
        } else {
          setIsSyncing(false);
        }
        
        setTimeout(() => {
          ordersAPI.getAll('all').then(ordersResponse => {
            if (isMounted) {
              setOrders(ordersResponse.orders || []);
            }
          }).catch(() => {});
        }, 500);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        
        // Устанавливаем пустой массив, чтобы не было белого экрана
        if (isMounted) {
          setOffers([]);
        }
        
        const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки';
        
        if (showLoading && isMounted) {
          toast({
            title: 'Не удалось загрузить предложения',
            description: errorMessage,
            variant: 'destructive',
          });
        }
        
        if (showLoading) {
          setIsLoading(false);
        } else {
          setIsSyncing(false);
        }
      }
    };

    loadData(false);
    
    const unsubscribeOffers = dataSync.subscribe('offer_updated', () => {
      if (isMounted) {
        loadFreshData(false);
      }
    });
    
    const unsubscribeOrders = dataSync.subscribe('order_updated', () => {
      if (isMounted) {
        loadFreshData(false);
      }
    });
    
    const handleStorageChange = (e: StorageEvent | Event) => {
      if ('key' in e && e.key === 'force_offers_reload') {
        loadFreshData(true);
      } else if (!('key' in e)) {
        const forceReload = localStorage.getItem('force_offers_reload');
        if (forceReload) {
          localStorage.removeItem('force_offers_reload');
          loadFreshData(true);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      isLoading = false;
      unsubscribeOffers();
      unsubscribeOrders();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [setGlobalOffers, toast]);

  const userIdStr = currentUser?.id;
  const selectedDistrictsKey = selectedDistricts.join(',');
  const districtsLength = districts.length;

  const filteredOffers = useMemo(() => {
    let result = [...offers];

    result = filterActiveOffers(result);

    if (!showOnlyMy) {
      result = result.filter((offer) => {
        if (offer.category === 'utilities') return true;
        const availableQuantity = offer.quantity - (offer.soldQuantity || 0) - (offer.reservedQuantity || 0);
        return availableQuantity > 0;
      });
    }

    if (showOnlyMy && isAuthenticated && userIdStr) {
      result = result.filter(offer => String(offer.userId) === String(userIdStr));
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
      } else if (detectedDistrictId) {
        result = result.filter((offer) => 
          offer.district === detectedDistrictId || 
          (offer.availableDistricts || []).includes(detectedDistrictId)
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
  }, [offers, filters.query, filters.category, filters.subcategory, selectedDistrictsKey, districtsLength, showOnlyMy, isAuthenticated, userIdStr, selectedRegion, detectedDistrictId]);

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
      <SEO 
        title="Предложения товаров и услуг"
        description="Актуальные предложения товаров и услуг от компаний Якутии. Найдите поставщика, сравните цены и оформите сделку на ЕРТТП."
        keywords="предложения товаров Якутия, поставщики Якутск, купить товары Якутия, услуги Якутия"
        canonical="/predlozheniya"
      />
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