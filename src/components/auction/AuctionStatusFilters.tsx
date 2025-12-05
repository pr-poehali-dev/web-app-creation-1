import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { Auction } from '@/types/auction';

interface AuctionStatusFiltersProps {
  statusFilter: 'all' | Auction['status'];
  onFilterChange: (filter: 'all' | Auction['status']) => void;
  auctionCounts: {
    all: number;
    active: number;
    endingSoon: number;
    upcoming: number;
    ended: number;
  };
}

export default function AuctionStatusFilters({ 
  statusFilter, 
  onFilterChange, 
  auctionCounts 
}: AuctionStatusFiltersProps) {
  return (
    <div className="mb-6">
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          onClick={() => onFilterChange('all')}
          className="gap-2"
        >
          <Icon name="List" className="h-4 w-4" />
          Все ({auctionCounts.all})
        </Button>
        <Button
          variant={statusFilter === 'active' ? 'default' : 'outline'}
          onClick={() => onFilterChange('active')}
          className="gap-2"
        >
          <Icon name="Play" className="h-4 w-4" />
          Активные ({auctionCounts.active})
        </Button>
        <Button
          variant={statusFilter === 'ending-soon' ? 'default' : 'outline'}
          onClick={() => onFilterChange('ending-soon')}
          className="gap-2"
        >
          <Icon name="Clock" className="h-4 w-4" />
          Заверш. скоро ({auctionCounts.endingSoon})
        </Button>
        <Button
          variant={statusFilter === 'upcoming' ? 'default' : 'outline'}
          onClick={() => onFilterChange('upcoming')}
          className="gap-2"
        >
          <Icon name="Calendar" className="h-4 w-4" />
          Предстоящие ({auctionCounts.upcoming})
        </Button>
        <Button
          variant={statusFilter === 'ended' ? 'default' : 'outline'}
          onClick={() => onFilterChange('ended')}
          className="gap-2"
        >
          <Icon name="CheckCircle" className="h-4 w-4" />
          Завершенные ({auctionCounts.ended})
        </Button>
      </div>
    </div>
  );
}
