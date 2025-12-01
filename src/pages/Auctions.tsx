import { useState, useMemo, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import SearchBlock from '@/components/SearchBlock';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { SearchFilters } from '@/types/offer';
import { MOCK_AUCTIONS } from '@/data/mockAuctions';
import type { Auction } from '@/types/auction';
import { useNavigate } from 'react-router-dom';
import { useDistrict } from '@/contexts/DistrictContext';
import { CATEGORIES } from '@/data/categories';

interface AuctionsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const ITEMS_PER_PAGE = 20;

export default function Auctions({ isAuthenticated, onLogout }: AuctionsProps) {
  const navigate = useNavigate();
  const { districts, selectedDistricts } = useDistrict();
  const [isLoading, setIsLoading] = useState(true);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    contentType: 'offers',
    category: '',
    subcategory: '',
    district: 'all',
  });

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ending-soon' | 'upcoming' | 'ended'>('all');

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const filteredAuctions = useMemo(() => {
    let result = [...MOCK_AUCTIONS];

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
  }, [filters, statusFilter, selectedDistricts]);

  const currentAuctions = filteredAuctions.slice(0, displayedCount);
  const hasMore = displayedCount < filteredAuctions.length;

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = () => {
    setDisplayedCount(ITEMS_PER_PAGE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getTimeRemaining = (endTime: Date) => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();

    if (diff <= 0) return 'Завершен';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}д ${hours}ч`;
    if (hours > 0) return `${hours}ч ${minutes}м`;
    return `${minutes}м`;
  };

  const getStatusBadge = (status: Auction['status']) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-500">
            <Icon name="Play" className="h-3 w-3 mr-1" />
            Активен
          </Badge>
        );
      case 'ending-soon':
        return (
          <Badge className="bg-orange-500">
            <Icon name="Clock" className="h-3 w-3 mr-1" />
            Скоро завершится
          </Badge>
        );
      case 'upcoming':
        return (
          <Badge className="bg-blue-500">
            <Icon name="Calendar" className="h-3 w-3 mr-1" />
            Предстоящий
          </Badge>
        );
      case 'ended':
        return (
          <Badge variant="secondary">
            <Icon name="CheckCircle" className="h-3 w-3 mr-1" />
            Завершен
          </Badge>
        );
    }
  };

  const AuctionCard = ({ auction }: { auction: Auction }) => {
    const category = CATEGORIES.find(c => c.id === auction.category);
    const districtName = districts.find(d => d.id === auction.district)?.name;

    return (
      <Card
        className={`transition-all hover:shadow-xl cursor-pointer group ${
          auction.isPremium && auction.status !== 'ended' ? 'border-2 border-primary shadow-lg' : ''
        }`}
        onClick={() => navigate(`/auction/${auction.id}`)}
      >
        {auction.isPremium && auction.status !== 'ended' && (
          <div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 text-center">
            Премиум аукцион
          </div>
        )}

        <CardHeader className="p-0">
          <div className="relative aspect-video bg-muted overflow-hidden">
            {auction.images.length > 0 ? (
              <img
                src={auction.images[0].url}
                alt={auction.images[0].alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icon name="Gavel" className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <div className="absolute top-2 right-2">
              {getStatusBadge(auction.status)}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {auction.title}
            </h3>
          </div>

          {category && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{category.name}</Badge>
            </div>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Стартовая цена:</span>
              <span className="font-medium">{auction.startingPrice.toLocaleString()} ₽</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Текущая ставка:</span>
              <span className="font-bold text-primary text-lg">
                {auction.currentPrice.toLocaleString()} ₽
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Шаг ставки:</span>
              <span className="font-medium">{auction.minBidStep.toLocaleString()} ₽</span>
            </div>
          </div>

          <div className="pt-2 space-y-2 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Icon name="Users" className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Ставок: {auction.bidsCount}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Icon name="Clock" className="h-4 w-4 text-muted-foreground" />
              <span className={`font-semibold ${
                auction.status === 'ending-soon' ? 'text-orange-500' : 'text-muted-foreground'
              }`}>
                {auction.status === 'ended' ? 'Завершен' : `Осталось: ${getTimeRemaining(auction.endTime)}`}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="MapPin" className="h-4 w-4" />
              <span>{districtName}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/auction/${auction.id}`);
            }}
            className="w-full"
            size="lg"
            disabled={auction.status === 'ended'}
          >
            {auction.status === 'ended' ? (
              <>
                <Icon name="CheckCircle" className="mr-2 h-4 w-4" />
                Аукцион завершен
              </>
            ) : (
              <>
                <Icon name="Gavel" className="mr-2 h-4 w-4" />
                Сделать ставку
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Аукционы</h1>
          <p className="text-muted-foreground">
            Участвуйте в аукционах и делайте выгодные покупки по лучшей цене
          </p>
        </div>

        <SearchBlock
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSearch={handleSearch}
          allOffers={[]}
        />

        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
              size="sm"
            >
              Все
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('active')}
              size="sm"
            >
              Активные
            </Button>
            <Button
              variant={statusFilter === 'ending-soon' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('ending-soon')}
              size="sm"
            >
              <Icon name="Clock" className="h-4 w-4 mr-1" />
              Скоро завершатся
            </Button>
            <Button
              variant={statusFilter === 'upcoming' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('upcoming')}
              size="sm"
            >
              Предстоящие
            </Button>
            <Button
              variant={statusFilter === 'ended' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('ended')}
              size="sm"
            >
              Завершенные
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card key={index} className="h-96 animate-pulse bg-muted" />
            ))}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                Найдено: <span className="font-semibold text-foreground">{filteredAuctions.length}</span>{' '}
                {filteredAuctions.length === 1
                  ? 'аукцион'
                  : filteredAuctions.length < 5
                  ? 'аукциона'
                  : 'аукционов'}
              </p>
            </div>

            {currentAuctions.length === 0 ? (
              <div className="text-center py-20">
                <Icon name="Gavel" className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-2">Аукционов не найдено</h3>
                <p className="text-muted-foreground mb-8">
                  Попробуйте изменить параметры поиска или фильтры
                </p>
                <Button onClick={() => handleFiltersChange({
                  query: '',
                  contentType: 'offers',
                  category: '',
                  subcategory: '',
                  district: 'all',
                })}>
                  Сбросить фильтры
                </Button>
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
                  {currentAuctions.map((auction) => (
                    <AuctionCard key={auction.id} auction={auction} />
                  ))}
                </div>

                <div ref={observerTarget} className="flex justify-center py-8">
                  {isLoadingMore && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icon name="Loader2" className="h-5 w-5 animate-spin" />
                      <span>Загрузка...</span>
                    </div>
                  )}
                  {!hasMore && currentAuctions.length > ITEMS_PER_PAGE && (
                    <p className="text-muted-foreground">Больше нет аукционов</p>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}