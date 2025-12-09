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
    <div className="mb-0">
      <div className="flex gap-1 md:gap-1.5 flex-wrap justify-center md:justify-start">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          onClick={() => onFilterChange('all')}
          className="gap-0.5 md:gap-1 text-[10px] md:text-xs h-7 md:h-8 px-1.5 md:px-2"
          size="sm"
        >
          <Icon name="List" className="h-3 w-3 md:h-3.5 md:w-3.5" />
          <span>Все</span>
        </Button>
        <Button
          variant={statusFilter === 'active' ? 'default' : 'outline'}
          onClick={() => onFilterChange('active')}
          className="gap-0.5 md:gap-1 text-[10px] md:text-xs h-7 md:h-8 px-1.5 md:px-2"
          size="sm"
        >
          <Icon name="Play" className="h-3 w-3 md:h-3.5 md:w-3.5" />
          <span className="hidden sm:inline">Активные</span>
          <span className="sm:hidden">Акт.</span>
        </Button>
        <Button
          variant={statusFilter === 'ending-soon' ? 'default' : 'outline'}
          onClick={() => onFilterChange('ending-soon')}
          className="gap-0.5 md:gap-1 text-[10px] md:text-xs h-7 md:h-8 px-1.5 md:px-2"
          size="sm"
        >
          <Icon name="Clock" className="h-3 w-3 md:h-3.5 md:w-3.5" />
          <span className="hidden sm:inline whitespace-nowrap">Заверш. скоро</span>
          <span className="sm:hidden">Скоро</span>
        </Button>
        <Button
          variant={statusFilter === 'upcoming' ? 'default' : 'outline'}
          onClick={() => onFilterChange('upcoming')}
          className="gap-0.5 md:gap-1 text-[10px] md:text-xs h-7 md:h-8 px-1.5 md:px-2"
          size="sm"
        >
          <Icon name="Calendar" className="h-3 w-3 md:h-3.5 md:w-3.5" />
          <span className="hidden sm:inline">Предстоящие</span>
          <span className="sm:hidden">Предст.</span>
        </Button>
        <Button
          variant={statusFilter === 'ended' ? 'default' : 'outline'}
          onClick={() => onFilterChange('ended')}
          className="gap-0.5 md:gap-1 text-[10px] md:text-xs h-7 md:h-8 px-1.5 md:px-2"
          size="sm"
        >
          <Icon name="CheckCircle" className="h-3 w-3 md:h-3.5 md:w-3.5" />
          <span className="hidden sm:inline">Завершенные</span>
          <span className="sm:hidden">Зав.</span>
        </Button>
      </div>
    </div>
  );
}