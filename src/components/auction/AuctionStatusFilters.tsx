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
      <div className="flex gap-1.5 md:gap-2 flex-wrap">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          onClick={() => onFilterChange('all')}
          className="gap-1 md:gap-2 text-xs md:text-sm h-8 md:h-10 px-2 md:px-4"
          size="sm"
        >
          <Icon name="List" className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden md:inline">Все</span>
          <span className="md:hidden">Все</span>
          <span className="hidden sm:inline">({auctionCounts.all})</span>
        </Button>
        <Button
          variant={statusFilter === 'active' ? 'default' : 'outline'}
          onClick={() => onFilterChange('active')}
          className="gap-1 md:gap-2 text-xs md:text-sm h-8 md:h-10 px-2 md:px-4"
          size="sm"
        >
          <Icon name="Play" className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden md:inline">Активные</span>
          <span className="md:hidden">Активн.</span>
          <span className="hidden sm:inline">({auctionCounts.active})</span>
        </Button>
        <Button
          variant={statusFilter === 'ending-soon' ? 'default' : 'outline'}
          onClick={() => onFilterChange('ending-soon')}
          className="gap-1 md:gap-2 text-xs md:text-sm h-8 md:h-10 px-2 md:px-4"
          size="sm"
        >
          <Icon name="Clock" className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden md:inline">Заверш. скоро</span>
          <span className="md:hidden whitespace-nowrap">Скоро</span>
          <span className="hidden sm:inline">({auctionCounts.endingSoon})</span>
        </Button>
        <Button
          variant={statusFilter === 'upcoming' ? 'default' : 'outline'}
          onClick={() => onFilterChange('upcoming')}
          className="gap-1 md:gap-2 text-xs md:text-sm h-8 md:h-10 px-2 md:px-4"
          size="sm"
        >
          <Icon name="Calendar" className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden md:inline">Предстоящие</span>
          <span className="md:hidden">Предст.</span>
          <span className="hidden sm:inline">({auctionCounts.upcoming})</span>
        </Button>
        <Button
          variant={statusFilter === 'ended' ? 'default' : 'outline'}
          onClick={() => onFilterChange('ended')}
          className="gap-1 md:gap-2 text-xs md:text-sm h-8 md:h-10 px-2 md:px-4"
          size="sm"
        >
          <Icon name="CheckCircle" className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden md:inline">Завершенные</span>
          <span className="md:hidden">Заверш.</span>
          <span className="hidden sm:inline">({auctionCounts.ended})</span>
        </Button>
      </div>
    </div>
  );
}