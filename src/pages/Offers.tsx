import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    contentType: 'offers',
    category: '',
    subcategory: '',
    district: 'all',
  });

  useEffect(() => {
    const loadData = async (forceRefresh = false) => {
      const cachedOffers = localStorage.getItem('cached_offers');
      const cacheTimestamp = localStorage.getItem('cached_offers_time');
      const cacheAge = cacheTimestamp ? Date.now() - parseInt(cacheTimestamp) : Infinity;
      
      if (!forceRefresh && cachedOffers && cacheAge < 5 * 60 * 1000) {
        try {
          const parsed = JSON.parse(cachedOffers);
          setOffers(parsed);
          setIsLoading(false);
          return;
        } catch (e) {
          console.error('Failed to parse cached offers');
        }
      }
      
      setIsLoading(true);
      
      try {
        const offersData = await offersAPI.getOffers({ 
          status: 'active',
          limit: 20,
          offset: 0
        });
        setOffers(offersData.offers || []);
        setTotalOffersCount(offersData.total || 0);
        setHasMoreOnServer(offersData.hasMore || false);
        localStorage.setItem('cached_offers', JSON.stringify(offersData.offers || []));
        localStorage.setItem('cached_offers_time', Date.now().toString());
        setIsLoading(false);
        
        setTimeout(() => {
          ordersAPI.getAll('all').then(ordersResponse => {
            setOrders(ordersResponse.orders || []);
          }).catch(() => {});
        }, 500);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        setIsLoading(false);
      }
    };

    // Проверяем URL параметр updated - если есть, значит были изменения
    const updatedParam = searchParams.get('updated');
    // Проверяем флаг в localStorage - мог быть установлен при редактировании
    const hasLocalChanges = localStorage.getItem('offers_updated') === 'true';
    
    if (updatedParam || hasLocalChanges) {
      console.log('🔄 Обнаружены изменения, загружаю свежие данные');
      loadData(true);
      // Убираем параметр из URL
      if (updatedParam) {
        searchParams.delete('updated');
        setSearchParams(searchParams, { replace: true });
      }
      // Убираем флаг из localStorage
      localStorage.removeItem('offers_updated');
    } else {
      loadData(false);
    }
  }, [searchParams, setSearchParams]);

  const filteredOffers = useMemo(() => {
    let result = [...offers];

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