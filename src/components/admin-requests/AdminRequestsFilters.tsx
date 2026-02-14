import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BuyerOption {
  id: string;
  name: string;
}

interface AdminRequestsFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  filterBuyer: string;
  onFilterBuyerChange: (value: string) => void;
  uniqueBuyers: BuyerOption[];
}

export default function AdminRequestsFilters({
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  filterBuyer,
  onFilterBuyerChange,
  uniqueBuyers,
}: AdminRequestsFiltersProps) {
  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1">
          <Input
            placeholder="Поиск по названию или покупателю..."
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
            <SelectItem value="archived">Архивированные</SelectItem>
            <SelectItem value="deleted">Удаленные</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterBuyer} onValueChange={onFilterBuyerChange}>
          <SelectTrigger className="w-full md:w-[250px]">
            <SelectValue placeholder="Покупатель" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все покупатели</SelectItem>
            {uniqueBuyers.map(buyer => (
              <SelectItem key={buyer.id} value={buyer.id}>
                {buyer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
