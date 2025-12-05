import { useState, useMemo, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import SearchBlock from '@/components/SearchBlock';
import OfferCard from '@/components/OfferCard';
import OfferCardSkeleton from '@/components/OfferCardSkeleton';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { SearchFilters } from '@/types/offer';
import { MOCK_OFFERS } from '@/data/mockOffers';
import { searchOffers } from '@/utils/searchUtils';
import { addToSearchHistory } from '@/utils/searchHistory';
import { useDistrict } from '@/contexts/DistrictContext';

interface HomeProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const ITEMS_PER_PAGE = 20;

export default function Home({ isAuthenticated, onLogout }: HomeProps) {
  const { selectedDistricts, districts } = useDistrict();
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

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const filteredOffers = useMemo(() => {
    let result = [...MOCK_OFFERS];

    if (filters.query && filters.query.length >= 2) {
      result = searchOffers(result, filters.query);
    }

    if (filters.category) {
      result = result.filter((offer) => offer.category === filters.category);
    }

    if (filters.subcategory) {
      result = result.filter((offer) => offer.subcategory === filters.subcategory);
    }

    if (selectedDistricts.length > 0) {
      result = result.filter((offer) => 
        selectedDistricts.includes(offer.district) || 
        offer.availableDistricts?.some(d => selectedDistricts.includes(d))
      );
    }

    const premiumOffers = result.filter((offer) => offer.isPremium);
    const regularOffers = result.filter((offer) => !offer.isPremium);

    premiumOffers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    regularOffers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return [...premiumOffers, ...regularOffers];
  }, [filters, selectedDistricts]);

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

  const premiumCount = currentOffers.filter((offer) => offer.isPremium).length;
  const regularCount = currentOffers.length - premiumCount;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 p-8 rounded-lg border border-primary/20">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Единая региональная торговая площадка (ЕРТП)
          </h1>
          <div className="space-y-4 text-muted-foreground">
            <p className="text-lg font-semibold text-primary">
              «Единая региональная торговая площадка» (ЕРТП) – это ваш прямой путь к успеху на местном рынке!
            </p>
            <p className="font-medium">
              Увеличьте продажи, оптимизируйте производство, привлекайте инвестиции – все это с Единой региональной торговой площадкой!
            </p>
            <p className="font-medium">
              ЕРТП – это ваш инструмент для процветания на местном рынке. Мы предлагаем:
            </p>
            <ul className="space-y-3 pl-5">
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong>Гарантированный сбыт вашей продукции:</strong> забудьте о проблемах с реализацией – ЕРТП предоставит вам прямой доступ к вашей целевой аудитории.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong>Оптимизацию производственных и логистических процессов:</strong> анализируйте рыночный спрос и планируйте свою деятельность на основе реальных данных.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong>Новые возможности для финансирования:</strong> получите средства на развитие своего бизнеса напрямую от потребителей через инновационные механизмы предоплаты и гарантированных поставок.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong>Выгода потребителей:</strong> возможность выставлять заявки на покупку товаров и услуг на своих условиях, получать скидки и гарантии сроков поставки по заранее оговоренной цене и минимизировать риски изменения цен, срыва сроков поставки.</span>
              </li>
            </ul>
            <p className="font-semibold text-foreground pt-2">
              ЕРТП – это не просто торговая площадка, это ваш партнер по развитию вашего бизнеса!
            </p>
            <p className="font-medium">
              Зарегистрируйтесь на ЕРТП сегодня и начните развивать местную экономику вместе с нами!
            </p>
            <p className="text-center font-bold text-primary text-lg pt-2">
              Присоединяйтесь!
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {filters.contentType === 'offers' ? 'Предложения' : 'Запросы'}
          </h2>
          <p className="text-muted-foreground">
            {filters.contentType === 'offers'
              ? 'Найдите товары и услуги от проверенных поставщиков'
              : 'Просмотрите запросы на покупку от покупателей'}
          </p>
        </div>

        <SearchBlock
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSearch={handleSearch}
          allOffers={MOCK_OFFERS}
        />

        {isLoading ? (
          <>
            <div className="mb-6">
              <div className="h-5 w-48 bg-muted animate-pulse rounded" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <OfferCardSkeleton key={index} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Icon name="Package" className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Найдено: <span className="font-semibold text-foreground">{filteredOffers.length}</span>{' '}
                      {filteredOffers.length === 1
                        ? 'предложение'
                        : filteredOffers.length < 5
                        ? 'предложения'
                        : 'предложений'}
                    </p>
                  </div>
                  
                  {filters.query && filters.query.length >= 2 && (
                    <div className="flex items-center gap-2">
                      <Icon name="Search" className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        по запросу: <span className="font-semibold text-foreground">"{filters.query}"</span>
                      </p>
                    </div>
                  )}

                  {premiumCount > 0 && (
                    <div className="flex items-center gap-2">
                      <Icon name="Star" className="h-4 w-4 text-primary" />
                      <p className="text-sm text-muted-foreground">
                        Премиум: <span className="font-semibold text-primary">{premiumCount}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Icon name="ArrowDownUp" className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Сортировка: <span className="font-semibold text-foreground">Премиум + По новизне</span>
                  </p>
                </div>
              </div>

              {(filters.category || selectedDistricts.length > 0) && (
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

            {currentOffers.length === 0 ? (
              <div className="text-center py-20 px-4">
                <div className="max-w-md mx-auto">
                  <Icon name="SearchX" className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold mb-3">Пока нет предложений или запросов</h3>
                  <p className="text-muted-foreground mb-8">
                    По вашему запросу ничего не найдено. Попробуйте изменить параметры поиска или фильтры.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={() =>
                        handleFiltersChange({
                          query: '',
                          contentType: filters.contentType,
                          category: '',
                          subcategory: '',
                          district: 'all',
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
                      <Icon name="Home" className="h-4 w-4" />
                      Все предложения
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {premiumCount > 0 && regularCount > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <Icon name="Star" className="h-4 w-4" />
                      <span>Оплаченные объявления ({premiumCount})</span>
                    </div>
                  </div>
                )}

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {currentOffers.map((offer, index) => (
                    <div key={offer.id}>
                      {index === premiumCount && premiumCount > 0 && (
                        <div className="col-span-full mb-4 mt-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Icon name="Package" className="h-4 w-4" />
                            <span>Обычные объявления ({regularCount})</span>
                          </div>
                        </div>
                      )}
                      <OfferCard offer={offer} />
                    </div>
                  ))}
                </div>

                {hasMore && (
                  <div ref={observerTarget} className="mt-8">
                    {isLoadingMore && (
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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