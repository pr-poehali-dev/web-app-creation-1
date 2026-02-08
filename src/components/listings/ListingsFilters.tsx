import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

type ListingType = 'offer' | 'request';
type ListingStatus = 'active' | 'draft' | 'in_order' | 'completed' | 'archived';

interface ListingsFiltersProps {
  filterStatus: 'all' | ListingStatus;
  filterType: 'all' | ListingType;
  onStatusChange: (status: 'all' | ListingStatus) => void;
  onTypeChange: (type: 'all' | ListingType) => void;
  stats: {
    total: number;
    active: number;
    in_order: number;
    completed: number;
    offers: number;
    requests: number;
  };
}

export default function ListingsFilters({
  filterStatus,
  filterType,
  onStatusChange,
  onTypeChange,
  stats,
}: ListingsFiltersProps) {
  return (
    <>
      <Tabs value={filterStatus} onValueChange={(v) => onStatusChange(v as 'all' | ListingStatus)}>
        <TabsList className="mb-6 flex-wrap h-auto">
          <TabsTrigger value="all">
            Все ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="active">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            Активные ({stats.active})
          </TabsTrigger>
          <TabsTrigger value="in_order">
            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
            В заказах ({stats.in_order})
          </TabsTrigger>
          <TabsTrigger value="completed">
            <span className="w-2 h-2 rounded-full bg-purple-500 mr-2" />
            Завершенные ({stats.completed})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mb-4 flex gap-2">
        <Button
          variant={filterType === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTypeChange('all')}
        >
          Все
        </Button>
        <Button
          variant={filterType === 'offer' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTypeChange('offer')}
        >
          <Icon name="Store" className="mr-2 h-4 w-4" />
          Предложения
        </Button>
        <Button
          variant={filterType === 'request' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTypeChange('request')}
        >
          <Icon name="ShoppingCart" className="mr-2 h-4 w-4" />
          Запросы
        </Button>
      </div>
    </>
  );
}
