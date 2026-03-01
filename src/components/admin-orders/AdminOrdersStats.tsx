import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Order } from '@/types/order';

interface Stats {
  total: number;
  new: number;
  pending: number;
  accepted: number;
  completed: number;
  totalAmount: number;
}

interface AdminOrdersStatsProps {
  orders: Order[];
}

export function computeStats(orders: Order[]): Stats {
  return {
    total: orders.length,
    new: orders.filter(o => o.status === 'new').length,
    pending: orders.filter(o => o.status === 'pending').length,
    accepted: orders.filter(o => o.status === 'accepted').length,
    completed: orders.filter(o => o.status === 'completed').length,
    totalAmount: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
  };
}

export default function AdminOrdersStats({ orders }: AdminOrdersStatsProps) {
  const stats = computeStats(orders);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Всего заказов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Новые</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Ожидают</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Приняты</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Завершены</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Общая сумма</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {stats.totalAmount.toLocaleString('ru-RU')} ₽
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
