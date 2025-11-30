import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import SearchBlock from '@/components/SearchBlock';
import OfferCard from '@/components/OfferCard';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { SearchFilters } from '@/types/offer';
import { MOCK_OFFERS } from '@/data/mockOffers';
import { CATEGORIES } from '@/data/categories';

interface HomeProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const ITEMS_PER_PAGE = 20;

export default function Home({ isAuthenticated, onLogout }: HomeProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    contentType: 'offers',
    category: '',
    subcategory: '',
    district: 'all',
  });

  const filteredOffers = useMemo(() => {
    let result = [...MOCK_OFFERS];

    if (filters.query) {
      const query = filters.query.toLowerCase();
      result = result.filter(
        (offer) =>
          offer.title.toLowerCase().includes(query) ||
          offer.description.toLowerCase().includes(query)
      );
    }

    if (filters.category) {
      result = result.filter((offer) => offer.category === filters.category);
    }

    if (filters.subcategory) {
      result = result.filter((offer) => offer.subcategory === filters.subcategory);
    }

    if (filters.district !== 'all') {
      result = result.filter((offer) => offer.district === filters.district);
    }

    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return result;
  }, [filters]);

  const totalPages = Math.ceil(filteredOffers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentOffers = filteredOffers.slice(startIndex, endIndex);

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {filters.contentType === 'offers' ? 'Предложения' : 'Запросы'}
          </h1>
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
        />

        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Найдено: <span className="font-semibold text-foreground">{filteredOffers.length}</span>{' '}
            {filteredOffers.length === 1
              ? 'предложение'
              : filteredOffers.length < 5
              ? 'предложения'
              : 'предложений'}
          </p>
          {filters.district !== 'all' && (
            <p className="text-sm text-muted-foreground">
              Сортировка: <span className="font-semibold text-foreground">По новизне</span>
            </p>
          )}
        </div>

        {currentOffers.length === 0 ? (
          <div className="text-center py-16">
            <Icon name="Package" className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Ничего не найдено</h3>
            <p className="text-muted-foreground mb-6">
              Попробуйте изменить параметры поиска
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {currentOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <Icon name="ChevronLeft" className="h-4 w-4" />
                </Button>

                {getPageNumbers().map((page, index) => (
                  typeof page === 'number' ? (
                    <Button
                      key={index}
                      variant={currentPage === page ? 'default' : 'outline'}
                      onClick={() => handlePageChange(page)}
                      className="min-w-10"
                    >
                      {page}
                    </Button>
                  ) : (
                    <span key={index} className="px-2 text-muted-foreground">
                      {page}
                    </span>
                  )
                ))}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <Icon name="ChevronRight" className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Страница {currentPage} из {totalPages}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
