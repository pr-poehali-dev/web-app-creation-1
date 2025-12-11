import { Card, CardContent } from '@/components/ui/card';

interface ListingsStatsProps {
  stats: {
    total: number;
    active: number;
    in_order: number;
    completed: number;
    offers: number;
    requests: number;
  };
}

export default function ListingsStats({ stats }: ListingsStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{stats.total}</p>
            <p className="text-sm text-muted-foreground mt-1">Всего</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-500">{stats.active}</p>
            <p className="text-sm text-muted-foreground mt-1">Активных</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-500">{stats.in_order}</p>
            <p className="text-sm text-muted-foreground mt-1">В заказах</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-500">{stats.completed}</p>
            <p className="text-sm text-muted-foreground mt-1">Завершено</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-3xl font-bold">{stats.offers}/{stats.requests}</p>
            <p className="text-sm text-muted-foreground mt-1">Пред./Запр.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
