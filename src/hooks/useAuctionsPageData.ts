import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SearchFilters } from '@/types/offer';
import type { Auction } from '@/types/auction';
import { auctionsAPI } from '@/services/api';
import { useDistrict } from '@/contexts/DistrictContext';
import { getSession } from '@/utils/auth';
import { useToast } from '@/hooks/use-toast';
import { safeGetTime } from '@/utils/dateUtils';
import { dataSync } from '@/utils/dataSync';

const ITEMS_PER_PAGE = 20;

const playBidSound = () => {
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSyAzvLZiTYIG2m98OScTgwNUrDo7beHHwU0j9zvyoEuBiV5yPLajkILEmG56+qnVxEKQ5zf8sFuJAUqfsvy14w6BxpnvfDtnjELDlCx6O+8hSMFMpDe7s+FOAYjdsjw3I9BCRFft+jrp1YRCkSc4PKzbSQFKXzM8teNOgcZZr7w7p4yCw5Psejtu4QkBTGQ3u/PhToGInXI8NyPQQkQX7bn7KlYEglEnN/ys2wlBSl8zPLXjToHGGa+8O6dMQwOT7Ho7buEJAUykN7uz4U6BiJ1yPDcj0EJD1+36+uoWBIJQ53g8rNsJQUpfM3y1404Bhlmv/DvnTEMDk+y6O27gyMFMpHe78+FOQYidc3w3I9BCQ9ftuvqqFYSCUOd4PKzbCUFKX3M8teNOQYZZr/w7pwxCw5Psuvrvo4iBS+Q3u/PhTkGInXO8NyQQQkPXrjr6qhVFAlEnuDys2wlBSh8zfLXjDkGGWe/8O+cMgsOTrPr7L+OIgUukN7wz4U6BiJ1zvDckEEJD1647OqnVRQJRJ7g8rNtJQUofM7y1404BhlozfHvmzALDk6068+/jSIFLZHe8c+FOgcjd87w3ZFBCg9eue3qplURCUSe4fK0bCQEJ33N8teMOAYZaM/x7pswCw5Oteve0LyQIgQrj9/xz4Y6ByR31PDelUEKEF+57OmmUxIIRKDh8rVsJAQnfs3y14o4BRZpz/HtmC4KDU607tCzjh8DHpDf8c+FOwgkedfx35ZACxFgsO3qpFIRB0Oh4vKybSMEJn7N89aLOAUVaM/x75gvCg1NvO7Rro8dAxyP3/LPhjsIJHnV8t+WQQsQYbDv66VUEgdDo+Lzs20kBCV+z/PXizcFFWfQ8u+ZMAoOTr/u07eQHwMbj+Dyz4c6CSN419TemkILEGKw8OylVBMHQ6Th8rJvJQQkftHy14s2BRRo0fPvmzIKDk+/7tO5kR8CGY/h89CIOggid9bz3ptCDBBjsvHtplQTB0Ol4/O0bSQEJH/S8tiMNgURZ9Hy8JwyDA9OwO7Uv5EhAxmP4fTRiTsIIXfY89+cQwwQY7Py7qZWEwZBp+TztW4lAyJ/0/LZjDYFEGfS8vGcMw0OT8Hu1cGSIgMYj+P00Io7CSB21/TfnEQNDmO08u6mVxMGQKnl87ZuJgIhftXz2Y0zBQ5m0/LynDUMDlDB79XBkiIDFo/j9dCLOwkhd9f035xGDQ1jtvPvp1gTBj+p5/O3cCcCH33W89qOMwcNZdPy8p02DA9Qw+/Ww5IkAxSN5PXRjDwJIXfZ8+CdRg0MZLb08KdZEwU+qun0uHEoAh191/Tbjjsj6sD5+GfJMKAAAAASUVORK5CYII=');
    audio.volume = 0.4;
    audio.play().catch(() => {});
  } catch (_e) { /* ignore */ }
};

export function useAuctionsPageData(isAuthenticated: boolean) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getSession();
  const { districts, selectedDistricts } = useDistrict();

  const [verificationStatus, setVerificationStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showOnlyMy, setShowOnlyMy] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ending-soon' | 'upcoming' | 'ended'>('all');
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    contentType: 'offers',
    category: '',
    subcategory: '',
    district: 'all',
  });

  const prevBidsRef = useRef<Record<string, number>>({});

  const checkVerificationStatus = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;
      const response = await fetch('https://functions.poehali.dev/1c97f222-fdea-4b59-b941-223ee8bb077b', {
        headers: { 'X-User-Id': userId },
      });
      if (response.ok) {
        const data = await response.json();
        setVerificationStatus(data.verificationStatus);
      }
    } catch (error) {
      console.error('Error checking verification:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      checkVerificationStatus();
    }
  }, [isAuthenticated]);

  const loadAuctions = async (silent = false) => {
    if (!silent) setIsLoading(true);
    if (silent) setIsRefreshing(true);
    try {
      const loadedAuctions = await auctionsAPI.getAllAuctions();
      if (silent) {
        loadedAuctions.forEach((auction) => {
          if (auction.status === 'active' || auction.status === 'ending-soon') {
            const prevCount = prevBidsRef.current[auction.id];
            const currCount = auction.bidsCount ?? auction.bidCount ?? 0;
            if (prevCount !== undefined && currCount > prevCount) {
              playBidSound();
            }
            prevBidsRef.current[auction.id] = currCount;
          }
        });
      } else {
        loadedAuctions.forEach((auction) => {
          prevBidsRef.current[auction.id] = auction.bidsCount ?? auction.bidCount ?? 0;
        });
      }
      setAuctions(loadedAuctions);
    } catch (error) {
      console.error('Error loading auctions:', error);
      if (!silent) setAuctions([]);
    } finally {
      if (!silent) setIsLoading(false);
      if (silent) setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    loadAuctions(false);

    const refreshInterval = setInterval(() => {
      if (!document.hidden) loadAuctions(true);
    }, 5000);

    const unsubscribe = dataSync.subscribe('auction_updated', () => {
      loadAuctions(true);
    });

    const handleStorageChange = (e: StorageEvent | Event) => {
      if ('key' in e && e.key === 'force_auctions_reload') {
        loadAuctions(false);
      } else if (!('key' in e)) {
        const forceReload = localStorage.getItem('force_auctions_reload');
        if (forceReload) {
          localStorage.removeItem('force_auctions_reload');
          loadAuctions(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(refreshInterval);
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await auctionsAPI.deleteAuction(id);
      setAuctions(prev => prev.filter(a => a.id !== id));
      toast({ title: 'Успешно', description: 'Аукцион удален' });
    } catch (error) {
      console.error('Error deleting auction:', error);
      toast({ title: 'Ошибка', description: 'Не удалось удалить аукцион', variant: 'destructive' });
    }
  };

  const handleCreateAuctionClick = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Требуется авторизация',
        description: 'Для создания аукциона необходимо войти в систему',
        duration: 5000,
      });
      navigate('/login');
      return;
    }
    if (verificationStatus !== 'verified') {
      toast({
        title: 'Требуется верификация',
        description: verificationStatus === 'pending'
          ? 'Верификация вашей учётной записи на рассмотрении. После одобрения верификации вам будут доступны все возможности на ЕРТТП.'
          : 'Для создания аукциона необходимо пройти верификацию. Перейдите в профиль и подайте заявку на верификацию.',
        duration: 8000,
      });
      return;
    }
    navigate('/create-auction');
  };

  const filteredAuctions = useMemo(() => {
    let result = [...auctions];

    if (showOnlyMy && isAuthenticated && currentUser) {
      result = result.filter(auction => auction.userId === currentUser.id);
    }

    if (statusFilter !== 'all') {
      result = result.filter((auction) => auction.status === statusFilter);
    } else {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      result = result.filter((auction) => {
        if (auction.status !== 'ended') return true;
        const endedAt = auction.endTime
          ? new Date(auction.endTime).getTime()
          : auction.endDate
            ? new Date(auction.endDate).getTime()
            : null;
        if (!endedAt) return false;
        return endedAt > oneDayAgo;
      });
    }

    if (filters.query && filters.query.length >= 2) {
      const query = filters.query.toLowerCase();
      result = result.filter(
        (auction) =>
          auction.title.toLowerCase().includes(query) ||
          auction.description.toLowerCase().includes(query)
      );
    }

    if (filters.category) {
      result = result.filter((auction) => auction.category === filters.category);
    }

    if (filters.subcategory) {
      result = result.filter((auction) => auction.subcategory === filters.subcategory);
    }

    if (selectedDistricts.length > 0) {
      result = result.filter(
        (auction) =>
          selectedDistricts.includes(auction.district) ||
          (auction.availableDistricts && auction.availableDistricts.some(d => selectedDistricts.includes(d)))
      );
    }

    const premiumAuctions = result.filter((auction) => auction.isPremium && auction.status !== 'ended');
    const regularAuctions = result.filter((auction) => !auction.isPremium || auction.status === 'ended');

    premiumAuctions.sort((a, b) => {
      if (a.status === 'ending-soon' && b.status !== 'ending-soon') return -1;
      if (a.status !== 'ending-soon' && b.status === 'ending-soon') return 1;
      return safeGetTime(b.createdAt) - safeGetTime(a.createdAt);
    });

    regularAuctions.sort((a, b) => {
      if (a.status === 'ending-soon' && b.status !== 'ending-soon') return -1;
      if (a.status !== 'ending-soon' && b.status === 'ending-soon') return 1;
      return safeGetTime(b.createdAt) - safeGetTime(a.createdAt);
    });

    return [...premiumAuctions, ...regularAuctions];
  }, [auctions, filters, statusFilter, selectedDistricts, showOnlyMy, isAuthenticated, currentUser]);

  const auctionCounts = {
    all: auctions.length,
    active: auctions.filter(a => a.status === 'active').length,
    endingSoon: auctions.filter(a => a.status === 'ending-soon').length,
    upcoming: auctions.filter(a => a.status === 'upcoming').length,
    ended: auctions.filter(a => a.status === 'ended').length,
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setDisplayedCount(ITEMS_PER_PAGE);
  };

  const loadMore = () => {
    if (isLoadingMore || displayedCount >= filteredAuctions.length) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayedCount((prev) => prev + ITEMS_PER_PAGE);
      setIsLoadingMore(false);
    }, 500);
  };

  return {
    isLoading,
    isRefreshing,
    auctions,
    filteredAuctions,
    currentAuctions: filteredAuctions.slice(0, displayedCount),
    displayedCount,
    isLoadingMore,
    hasMore: displayedCount < filteredAuctions.length,
    showOnlyMy,
    filters,
    statusFilter,
    auctionCounts,
    districts,
    currentUser,
    setShowOnlyMy,
    setStatusFilter,
    handleFiltersChange,
    handleDelete,
    handleCreateAuctionClick,
    loadMore,
  };
}
