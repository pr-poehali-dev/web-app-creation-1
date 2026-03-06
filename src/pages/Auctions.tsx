import Header from '@/components/Header';
import AuctionSearchBlock from '@/components/auction/AuctionSearchBlock';
import AuctionsToolbar from '@/components/auction/AuctionsToolbar';
import AuctionsGrid from '@/components/auction/AuctionsGrid';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useAuctionsPageData } from '@/hooks/useAuctionsPageData';
import SEO from '@/components/SEO';

interface AuctionsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function Auctions({ isAuthenticated, onLogout }: AuctionsProps) {
  useScrollToTop();

  const {
    isLoading,
    filteredAuctions,
    currentAuctions,
    isLoadingMore,
    hasMore,
    showOnlyMy,
    filters,
    statusFilter,
    auctionCounts,
    districts,
    setStatusFilter,
    handleFiltersChange,
    handleDelete,
    handleCreateAuctionClick,
    loadMore,
  } = useAuctionsPageData(isAuthenticated);

  const premiumCount = currentAuctions.filter((a) => a.isPremium && a.status !== 'ended').length;

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
        <AuctionsToolbar
          isAuthenticated={isAuthenticated}
          statusFilter={statusFilter}
          auctionCounts={auctionCounts}
          onFilterChange={setStatusFilter}
          onCreateClick={handleCreateAuctionClick}
        />

        <h1 className="text-lg md:text-xl font-bold text-foreground mb-2 md:mb-3">Аукционы</h1>

        <AuctionSearchBlock
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSearch={() => {}}
        />

        {isAuthenticated && (
          <Button onClick={handleCreateAuctionClick} className="md:hidden flex items-center gap-2 whitespace-nowrap w-full mb-2">
            <Icon name="Plus" className="h-4 w-4" />
            <span>Создать аукцион</span>
          </Button>
        )}

        <AuctionsGrid
          isLoading={isLoading}
          currentAuctions={currentAuctions}
          filteredCount={filteredAuctions.length}
          premiumCount={premiumCount}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          isHighlighted={filters.query.length >= 2}
          districts={districts}
          isAuthenticated={isAuthenticated}
          showOnlyMy={showOnlyMy}
          onDelete={handleDelete}
          onLoadMore={loadMore}
          onCreateClick={handleCreateAuctionClick}
        />
      </main>

      <Footer />
    </div>
  );
}
