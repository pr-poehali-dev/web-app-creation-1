import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import AuctionSearchBlock from '@/components/auction/AuctionSearchBlock';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import type { SearchFilters } from '@/types/offer';
import type { Auction } from '@/types/auction';
import { auctionsAPI } from '@/services/api';
import { useDistrict } from '@/contexts/DistrictContext';
import { getSession } from '@/utils/auth';
import AuctionCard from '@/components/auction/AuctionCard';
import AuctionStatusFilters from '@/components/auction/AuctionStatusFilters';
import { useToast } from '@/hooks/use-toast';
import { safeGetTime } from '@/utils/dateUtils';
import { dataSync } from '@/utils/dataSync';
import SEO from '@/components/SEO';

interface AuctionsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const ITEMS_PER_PAGE = 20;

export default function Auctions({ isAuthenticated, onLogout }: AuctionsProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getSession();
  const [verificationStatus, setVerificationStatus] = useState<string>('');

  const checkVerificationStatus = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const response = await fetch('https://functions.poehali.dev/1c97f222-fdea-4b59-b941-223ee8bb077b', {
        headers: {
          'X-User-Id': userId,
        },
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
  const { districts, selectedDistricts } = useDistrict();
  const [isLoading, setIsLoading] = useState(true);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showOnlyMy, setShowOnlyMy] = useState(false);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const observerTarget = useRef<HTMLDivElement>(null);
  const firstAuctionRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    contentType: 'offers',
    category: '',
    subcategory: '',
    district: 'all',
  });

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ending-soon' | 'upcoming' | 'ended'>('all');

  const [isRefreshing, setIsRefreshing] = useState(false);
  const prevBidsRef = useRef<Record<string, number>>({});

  const playBidSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSyAzvLZiTYIG2m98OScTgwNUrDo7beHHwU0j9zvyoEuBiV5yPLajkILEmG56+qnVxEKQ5zf8sFuJAUqfsvy14w6BxpnvfDtnjELDlCx6O+8hSMFMpDe7s+FOAYjdsjw3I9BCRFft+jrp1YRCkSc4PKzbSQFKXzM8teNOgcZZr7w7p4yCw5Psejtu4QkBTGQ3u/PhToGInXI8NyPQQkQX7bn7KlYEglEnN/ys2wlBSl8zPLXjToHGGa+8O6dMQwOT7Ho7buEJAUykN7uz4U6BiJ1yPDcj0EJD1+36+uoWBIJQ53g8rNsJQUpfM3y1404Bhlmv/DvnTEMDk+y6O27gyMFMpHe78+FOQYidc3w3I9BCQ9ftuvqqFYSCUOd4PKzbCUFKX3M8teNOQYZZr/w7pwxCw5Psuvrvo4iBS+Q3u/PhTkGInXO8NyQQQkPXrjr6qhVFAlEnuDys2wlBSh8zfLXjDkGGWe/8O+cMgsOTrPr7L+OIgUukN7wz4U6BiJ1zvDckEEJD1647OqnVRQJRJ7g8rNtJQUofM7y1404BhlozfHvmzALDk6068+/jSIFLZHe8c+FOgcjd87w3ZFBCg9eue3qplURCUSe4fK0bCQEJ33N8teMOAYZaM/x7pswCw5Oteve0LyQIgQrj9/xz4Y6ByR31PDelUEKEF+57OmmUxIIRKDh8rVsJAQnfs3y14o4BRZpz/HtmC4KDU607tCzjh8DHpDf8c+FOwgkedfx35ZACxFgsO3qpFIRB0Oh4vKybSMEJn7N89aLOAUVaM/x75gvCg1NvO7Rro8dAxyP3/LPhjsIJHnV8t+WQQsQYbDv66VUEgdDo+Lzs20kBCV+z/PXizcFFWfQ8u+ZMAoOTr/u07eQHwMbj+Dyz4c6CSN419TemkILEGKw8OylVBMHQ6Th8rJvJQQkftHy14s2BRRo0fPvmzIKDk+/7tO5kR8CGY/h89CIOggid9bz3ptCDBBjsvHtplQTB0Ol4/O0bSQEJH/S8tiMNgURZ9Hy8JwyDA9OwO7Uv5EhAxmP4fTRiTsIIXfY89+cQwwQY7Py7qZWEwZBp+TztW4lAyJ/0/LZjDYFEGfS8vGcMw0OT8Hu1cGSIgMYj+P00Io7CSB21/TfnEQNDmO08u6mVxMGQKnl87ZuJgIhftXz2Y0zBQ5m0/LynDUMDlDB79XBkiIDFo/j9dCLOwkhd9f035xGDQ1jtvPvp1gTBj+p5/O3cCcCH33W89qOMwcNZdPy8p02DA9Qw+/Ww5IkAxSN5PXRjDwJIXfZ8+CdRg0MZLb08KdZEwU+qun0uHEoAh191/Tbjjsj6sD5+GfJMKAAAAASUVORK5CYII=');
      audio.volume = 0.4;
      audio.play().catch(() => {});
    } catch (_e) { /* ignore */ }
  };

  const loadAuctions = async (silent = false) => {
    if (!silent) setIsLoading(true);
    if (silent) setIsRefreshing(true);
    
    try {
      const loadedAuctions = await auctionsAPI.getAllAuctions();

      // Проверяем новые ставки на активных аукционах
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
        // Первая загрузка — запоминаем текущие ставки без звука
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
      if (silent) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await auctionsAPI.deleteAuction(id);
      setAuctions(prev => prev.filter(a => a.id !== id));
      toast({
        title: 'Успешно',
        description: 'Аукцион удален',
      });
    } catch (error) {
      console.error('Error deleting auction:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить аукцион',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadAuctions(false);
    
    // Обновление каждые 5 сек для отслеживания новых ставок в реальном времени
    const refreshInterval = setInterval(() => {
      if (!document.hidden) {
        loadAuctions(true);
      }
    }, 5000);

    // Подписываемся на обновления аукционов
    const unsubscribe = dataSync.subscribe('auction_updated', () => {
      console.log('Auction updated, reloading...');
      loadAuctions(true);
    });

    // Слушатель триггера принудительного обновления после публикации
    const handleStorageChange = (e: StorageEvent | Event) => {
      if ('key' in e && e.key === 'force_auctions_reload') {
        console.log('🔄 Force reload auctions triggered by publication');
        loadAuctions(false);
      } else if (!('key' in e)) {
        const forceReload = localStorage.getItem('force_auctions_reload');
        if (forceReload) {
          console.log('🔄 Force reload auctions triggered by publication (manual)');
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

  const filteredAuctions = useMemo(() => {
    let result = [...auctions];

    if (showOnlyMy && isAuthenticated && currentUser) {
      result = result.filter(auction => auction.userId === currentUser.id);
    }

    if (statusFilter !== 'all') {
      result = result.filter((auction) => auction.status === statusFilter);
    } else {
      // Скрываем завершённые аукционы старше 1 дня — они уходят в архив
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

  const currentAuctions = filteredAuctions.slice(0, displayedCount);
  const hasMore = displayedCount < filteredAuctions.length;

  useEffect(() => {
    if (filters.query && filters.query.length >= 2 && filteredAuctions.length > 0) {
      const timer = setTimeout(() => {
        if (firstAuctionRef.current) {
          firstAuctionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [filters.query, filteredAuctions.length]);

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
  };

  const handleSearch = () => {
    setDisplayedCount(ITEMS_PER_PAGE);
    setTimeout(() => {
      if (firstAuctionRef.current && filteredAuctions.length > 0) {
        firstAuctionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const auctionCounts = {
    all: auctions.length,
    active: auctions.filter(a => a.status === 'active').length,
    endingSoon: auctions.filter(a => a.status === 'ending-soon').length,
    upcoming: auctions.filter(a => a.status === 'upcoming').length,
    ended: auctions.filter(a => a.status === 'ended').length,
  };

  const premiumCount = currentAuctions.filter((auction) => auction.isPremium && auction.status !== 'ended').length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO 
        title="Аукционы и торги"
        description="Участвуйте в аукционах и электронных торгах. Покупайте товары по лучшим ценам или выставляйте свои лоты на ЕРТТП."
        keywords="аукционы онлайн, электронные торги, купить на аукционе, выставить лот, ЕРТТП"
        canonical="/auktsiony"
      />
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-2 md:px-3 py-2 md:py-3 flex-1">
        <div className="flex items-center justify-between gap-2 mb-2 md:mb-3">
          <BackButton />
          <AuctionStatusFilters
            statusFilter={statusFilter}
            onFilterChange={setStatusFilter}
            auctionCounts={auctionCounts}
          />
          {isAuthenticated && (
            <Button onClick={handleCreateAuctionClick} className="hidden md:flex items-center gap-2 whitespace-nowrap">
              <Icon name="Plus" className="h-4 w-4" />
              <span>Создать аукцион</span>
            </Button>
          )}
        </div>
        
        <h1 className="text-lg md:text-xl font-bold text-foreground mb-2 md:mb-3">Аукционы</h1>

        <AuctionSearchBlock
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSearch={handleSearch}
        />

        {isAuthenticated && (
          <Button onClick={handleCreateAuctionClick} className="md:hidden flex items-center gap-2 whitespace-nowrap w-full mb-2">
            <Icon name="Plus" className="h-4 w-4" />
            <span>Создать аукцион</span>
          </Button>
        )}

        {isAuthenticated && (
          <div className="mb-2 md:mb-3 flex items-center gap-2 px-3 py-2 border-2 border-primary rounded-lg bg-primary/5 w-fit">
            <Switch
              id="show-only-my"
              checked={showOnlyMy}
              onCheckedChange={setShowOnlyMy}
              className="scale-75"
            />
            <Label htmlFor="show-only-my" className="cursor-pointer text-xs md:text-sm text-foreground font-medium">
              Только мои
            </Label>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-96 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : currentAuctions.length === 0 ? (
          <div className="text-center py-10 md:py-16">
            <Icon name="Gavel" className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-3 md:mb-4" />
            <h3 className="text-base md:text-lg font-semibold mb-2">
              {showOnlyMy ? 'У вас пока нет аукционов' : 'Аукционы не найдены'}
            </h3>
            <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
              {showOnlyMy
                ? 'Создайте свой первый аукцион, чтобы начать продавать'
                : 'Попробуйте изменить параметры фильтра или поиска'}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-2 md:mb-3 flex items-center justify-between">
              <p className="text-xs md:text-sm text-muted-foreground">
                Найдено: <span className="font-semibold text-foreground">{filteredAuctions.length}</span>{' '}
                {filteredAuctions.length === 1 ? 'аукцион' : 
                 filteredAuctions.length < 5 ? 'аукциона' : 'аукционов'}
                {premiumCount > 0 && (
                  <span className="ml-2 text-primary">
                    ({premiumCount} {premiumCount === 1 ? 'премиум' : 'премиум'})
                  </span>
                )}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className={`h-1.5 w-1.5 rounded-full ${isRefreshing ? 'bg-green-500 animate-pulse' : 'bg-green-500'}`} />
                <span className="hidden sm:inline">Обновление каждые 3 сек</span>
              </div>
            </div>

            <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {currentAuctions.map((auction, index) => (
                <div
                  key={`${auction.id}-${auction.currentBid}-${auction.bidCount}`}
                  ref={index === 0 ? firstAuctionRef : null}
                >
                  <AuctionCard 
                    auction={auction}
                    districts={districts}
                    isAuthenticated={isAuthenticated}
                    isHighlighted={filters.query.length >= 2}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>

            {hasMore && (
              <div
                ref={observerTarget}
                className="flex justify-center items-center py-4 md:py-6"
              >
                {isLoadingMore ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span>Загрузка...</span>
                  </div>
                ) : (
                  <Button onClick={loadMore} variant="outline" className="gap-2">
                    <Icon name="ChevronDown" className="h-4 w-4" />
                    Показать еще
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}