import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface SellerOption {
  id: string;
  name: string;
}

interface AdminOffersFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  filterSeller: string;
  onFilterSellerChange: (value: string) => void;
  uniqueSellers: SellerOption[];
  onDeleteTestOffers: () => void;
}

export default function AdminOffersFilters({
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  filterSeller,
  onFilterSellerChange,
  uniqueSellers,
  onDeleteTestOffers,
}: AdminOffersFiltersProps) {
  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1">
          <Input
            placeholder="Поиск по названию или продавцу..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={filterStatus} onValueChange={onFilterStatusChange}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="active">Активные</SelectItem>
            <SelectItem value="moderation">На модерации</SelectItem>
            <SelectItem value="rejected">Отклоненные</SelectItem>
            <SelectItem value="completed">Завершенные</SelectItem>
            <SelectItem value="deleted">Удаленные</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSeller} onValueChange={onFilterSellerChange}>
          <SelectTrigger className="w-full md:w-[250px]">
            <SelectValue placeholder="Продавец" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все продавцы</SelectItem>
            {uniqueSellers.map(seller => (
              <SelectItem key={seller.id} value={seller.id}>
                {seller.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDeleteTestOffers}
          className="md:w-auto"
        >
          <Icon name="Trash2" className="mr-2 h-4 w-4" />
          Очистить тест
        </Button>
      </div>
    </div>
  );
}
