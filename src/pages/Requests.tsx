import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import DataSyncIndicator from '@/components/DataSyncIndicator';
import AuctionSearchBlock from '@/components/auction/AuctionSearchBlock';
import Footer from '@/components/Footer';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import type { SearchFilters } from '@/types/offer';
import { searchOffers } from '@/utils/searchUtils';
import { useDistrict } from '@/contexts/DistrictContext';
import { getSession } from '@/utils/auth';
import { triggerArchiveExpired } from '@/services/api';
import { safeGetTime } from '@/utils/dateUtils';
import { filterActiveRequests } from '@/utils/expirationFilter';
import SEO from '@/components/SEO';
import { useRequestsData } from '@/hooks/useRequestsData';
import RequestsToolbar from '@/components/requests/RequestsToolbar';
import RequestsFiltersBar from '@/components/requests/RequestsFiltersBar';
import RequestsGrid from '@/components/requests/RequestsGrid';

interface RequestsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const ITEMS_PER_PAGE = 20;

export default function Requests({ isAuthenticated, onLogout }: RequestsProps) {
  useScrollToTop();
  triggerArchiveExpired();
  const { selectedRegion, selectedDistricts, districts, detectedDistrictId } = useDistrict();
  const currentUser = getSession();
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showOnlyMy, setShowOnlyMy] = useState(false);

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    contentType: 'requests',
    category: '',
    subcategory: '',
    district: 'all',
  });

  const { requests, orders, isLoading, isSyncing, handleDelete } = useRequestsData();

  const filteredRequests = useMemo(() => {
    let result = [...requests];

    result = filterActiveRequests(result);

    if (showOnlyMy && isAuthenticated && currentUser) {
      result = result.filter(offer => String(offer.userId) === String(currentUser.id));
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

      const isTransportVisible = (offer: { category?: string; district?: string; availableDistricts?: string[]; transportAllDistricts?: boolean }, targetDistricts: string[]) => {
        if (offer.category !== 'transport') return false;
        if (offer.transportAllDistricts) return true;
        if (offer.district && targetDistricts.includes(offer.district)) return true;
        const offerDistricts = offer.availableDistricts || [];
        if (offerDistricts.length === 0) return true;
        return offerDistricts.some(d => targetDistricts.includes(d));
      };

      if (selectedDistricts.length > 0) {
        result = result.filter(
          (offer) =>
            isTransportVisible(offer, selectedDistricts) ||
            selectedDistricts.includes(offer.district) ||
            (offer.availableDistricts || []).some(d => selectedDistricts.includes(d))
        );
      } else if (detectedDistrictId) {
        result = result.filter(
          (offer) =>
            isTransportVisible(offer, [detectedDistrictId]) ||
            offer.district === detectedDistrictId ||
            (offer.availableDistricts || []).includes(detectedDistrictId)
        );
      } else {
        result = result.filter(
          (offer) =>
            isTransportVisible(offer, districtsInRegion) ||
            districtsInRegion.includes(offer.district) ||
            (offer.availableDistricts || []).some(d => districtsInRegion.includes(d))
        );
      }
    }

    result.sort((a, b) => {
      return safeGetTime(b.createdAt) - safeGetTime(a.createdAt);
    });

    return result;
  }, [requests, filters, selectedDistricts, showOnlyMy, isAuthenticated, currentUser, selectedRegion, districts, detectedDistrictId]);

  const hasMore = displayedCount < filteredRequests.length;

  const loadMore = () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayedCount((prev) => prev + ITEMS_PER_PAGE);
      setIsLoadingMore(false);
    }, 500);
  };

  const getUnreadMessages = (requestId: string): number => {
    if (!currentUser) return 0;

    const relatedOrders = orders.filter(o => {
      const orderOfferId = (o as Record<string, unknown>).offer_id || (o as Record<string, unknown>).offerId;
      const isBuyer = String(currentUser.id) === String((o as Record<string, unknown>).buyer_id || (o as Record<string, unknown>).buyerId);
      return orderOfferId === requestId && (o as Record<string, unknown>).status === 'new' && isBuyer;
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
      <SEO
        title="Запросы на товары и услуги"
        description="Запросы на поставку товаров и услуг. Откликайтесь на запросы покупателей и находите новых клиентов на ЕРТТП."
        keywords="запросы на поставку, закупки товаров, заявки на услуги, найти поставщика, ЕРТТП"
        canonical="/zaprosy"
      />
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      <DataSyncIndicator isVisible={isSyncing} />

      <main className="container mx-auto px-4 py-4 md:py-8 flex-1">
        <RequestsToolbar isAuthenticated={isAuthenticated} />

        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-4">Запросы</h1>

        <AuctionSearchBlock
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSearch={handleSearch}
          placeholder="Поиск по запросам..."
          label="Поиск запросов"
        />

        {!isLoading && (
          <RequestsFiltersBar
            filteredCount={filteredRequests.length}
            filters={filters}
            isAuthenticated={isAuthenticated}
            showOnlyMy={showOnlyMy}
            onShowOnlyMyChange={setShowOnlyMy}
          />
        )}

        <RequestsGrid
          isLoading={isLoading}
          filteredRequests={filteredRequests}
          displayedCount={displayedCount}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          filters={filters}
          onDelete={handleDelete}
          getUnreadMessages={getUnreadMessages}
          onFiltersChange={handleFiltersChange}
          onLoadMore={loadMore}
        />
      </main>

      <Footer />
    </div>
  );
}
