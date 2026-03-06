import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import AuctionStatusFilters from '@/components/auction/AuctionStatusFilters';

interface AuctionCounts {
  all: number;
  active: number;
  endingSoon: number;
  upcoming: number;
  ended: number;
}

interface AuctionsToolbarProps {
  isAuthenticated: boolean;
  statusFilter: 'all' | 'active' | 'ending-soon' | 'upcoming' | 'ended';
  auctionCounts: AuctionCounts;
  onFilterChange: (filter: 'all' | 'active' | 'ending-soon' | 'upcoming' | 'ended') => void;
  onCreateClick: () => void;
}

export default function AuctionsToolbar({
  isAuthenticated,
  statusFilter,
  auctionCounts,
  onFilterChange,
  onCreateClick,
}: AuctionsToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2 mb-2 md:mb-3">
      <BackButton />
      <AuctionStatusFilters
        statusFilter={statusFilter}
        onFilterChange={onFilterChange}
        auctionCounts={auctionCounts}
      />
      {isAuthenticated && (
        <Button onClick={onCreateClick} className="hidden md:flex items-center gap-2 whitespace-nowrap">
          <Icon name="Plus" className="h-4 w-4" />
          <span>Создать аукцион</span>
        </Button>
      )}
    </div>
  );
}
