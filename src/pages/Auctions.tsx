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

  const loadAuctions = async () => {
    setIsLoading(true);
    try {
      const loadedAuctions = await auctionsAPI.getAllAuctions('active');
      setAuctions(loadedAuctions);
    } catch (error) {
      console.error('Error loading auctions:', error);
      setAuctions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuctions();
  }, []);

  const filteredAuctions = useMemo(() => {
    let result = [...auctions];

    if (showOnlyMy && isAuthenticated && currentUser) {
      result = result.filter(auction => auction.userId === currentUser.id);
    }

    if (statusFilter !== 'all') {
      result = result.filter((auction) => auction.status === statusFilter);
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
          auction.availableDistricts.some(d => selectedDistricts.includes(d))
      );
    }

    const premiumAuctions = result.filter((auction) => auction.isPremium && auction.status !== 'ended');
    const regularAuctions = result.filter((auction) => !auction.isPremium || auction.status === 'ended');

    premiumAuctions.sort((a, b) => {
      if (a.status === 'ending-soon' && b.status !== 'ending-soon') return -1;
      if (a.status !== 'ending-soon' && b.status === 'ending-soon') return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    regularAuctions.sort((a, b) => {
      if (a.status === 'ending-soon' && b.status !== 'ending-soon') return -1;
      if (a.status !== 'ending-soon' && b.status === 'ending-soon') return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
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
    all: filteredAuctions.length,
    active: filteredAuctions.filter(a => a.status === 'active').length,
    endingSoon: filteredAuctions.filter(a => a.status === 'ending-soon').length,
    upcoming: filteredAuctions.filter(a => a.status === 'upcoming').length,
    ended: filteredAuctions.filter(a => a.status === 'ended').length,
  };

  const premiumCount = currentAuctions.filter((auction) => auction.isPremium && auction.status !== 'ended').length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <BackButton />
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Аукционы</h1>
            <p className="text-muted-foreground">
              Участвуйте в аукционах и делайте выгодные покупки по лучшей цене
            </p>
          </div>
          <Button onClick={handleCreateAuctionClick} className="flex items-center gap-2 whitespace-nowrap">
            <Icon name="Plus" className="h-4 w-4" />
            Создать аукцион
          </Button>
        </div>

        <AuctionSearchBlock
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSearch={handleSearch}
        />

        <AuctionStatusFilters
          statusFilter={statusFilter}
          onFilterChange={setStatusFilter}
          auctionCounts={auctionCounts}
        />

        {isAuthenticated && (
          <div className="mb-6 flex items-center gap-2">
            <Switch
              id="show-only-my"
              checked={showOnlyMy}
              onCheckedChange={setShowOnlyMy}
            />
            <Label htmlFor="show-only-my" className="cursor-pointer">
              Показать только мои аукционы
            </Label>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-96 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : currentAuctions.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="Gavel" className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-xl font-semibold mb-2">
              {showOnlyMy ? 'У вас пока нет аукционов' : 'Аукционы не найдены'}
            </h3>
            <p className="text-muted-foreground mb-8">
              {showOnlyMy
                ? 'Создайте свой первый аукцион, чтобы начать продавать'
                : 'Попробуйте изменить параметры фильтра или поиска'}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Найдено: <span className="font-semibold text-foreground">{filteredAuctions.length}</span>{' '}
                {filteredAuctions.length === 1 ? 'аукцион' : 
                 filteredAuctions.length < 5 ? 'аукциона' : 'аукционов'}
                {premiumCount > 0 && (
                  <span className="ml-2 text-primary">
                    ({premiumCount} {premiumCount === 1 ? 'премиум' : 'премиум'})
                  </span>
                )}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {currentAuctions.map((auction, index) => (
                <div
                  key={auction.id}
                  ref={index === 0 ? firstAuctionRef : null}
                >
                  <AuctionCard 
                    auction={auction}
                    districts={districts}
                    isAuthenticated={isAuthenticated}
                    isHighlighted={filters.query.length >= 2}
                  />
                </div>
              ))}
            </div>

            {hasMore && (
              <div
                ref={observerTarget}
                className="flex justify-center items-center py-8"
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