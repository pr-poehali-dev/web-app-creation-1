import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface AdminOrdersFiltersProps {
  searchQuery: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onRefresh: () => void;
  onCleanupOrphaned: () => void;
  onCleanupAll: () => void;
}

export default function AdminOrdersFilters({
  searchQuery,
  statusFilter,
  onSearchChange,
  onStatusChange,
  onRefresh,
  onCleanupOrphaned,
  onCleanupAll,
}: AdminOrdersFiltersProps) {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex gap-4 flex-wrap items-center">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Поиск по названию, ID, имени..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="new">Новые</SelectItem>
              <SelectItem value="pending">Ожидают</SelectItem>
              <SelectItem value="negotiating">Переговоры</SelectItem>
              <SelectItem value="accepted">В работе</SelectItem>
              <SelectItem value="awaiting_payment">В работе (ожидает оплаты)</SelectItem>
              <SelectItem value="completed">Завершены</SelectItem>
              <SelectItem value="rejected">Отклонены</SelectItem>
              <SelectItem value="cancelled">Отменены</SelectItem>
              <SelectItem value="archived">Архивированы</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={onRefresh} variant="outline">
            <Icon name="RefreshCw" className="w-4 h-4 mr-2" />
            Обновить
          </Button>
          <Button onClick={onCleanupOrphaned} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
            <Icon name="Trash2" className="w-4 h-4 mr-2" />
            Очистить неактуальные
          </Button>
          <Button onClick={onCleanupAll} variant="destructive">
            <Icon name="Trash2" className="w-4 h-4 mr-2" />
            Удалить ВСЕ заказы
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
