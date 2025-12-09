import { Card, CardContent } from '@/components/ui/card';

interface MyAuctionsStatsProps {
  stats: {
    total: number;
    pending: number;
    active: number;
    endingSoon: number;
    upcoming: number;
    ended: number;
  };
  onFilterChange: (status: 'all' | 'pending' | 'active' | 'ending-soon' | 'upcoming' | 'ended') => void;
}

export default function MyAuctionsStats({ stats, onFilterChange }: MyAuctionsStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onFilterChange('all')}>
        <CardContent className="pt-6 text-center">
          <div className="text-3xl font-bold text-primary">{stats.total}</div>
          <p className="text-sm text-muted-foreground mt-1">Всего</p>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onFilterChange('pending')}>
        <CardContent className="pt-6 text-center">
          <div className="text-3xl font-bold text-yellow-500">{stats.pending}</div>
          <p className="text-sm text-muted-foreground mt-1">Ожидают</p>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onFilterChange('active')}>
        <CardContent className="pt-6 text-center">
          <div className="text-3xl font-bold text-green-500">{stats.active}</div>
          <p className="text-sm text-muted-foreground mt-1">Активные</p>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onFilterChange('ending-soon')}>
        <CardContent className="pt-6 text-center">
          <div className="text-3xl font-bold text-orange-500">{stats.endingSoon}</div>
          <p className="text-sm text-muted-foreground mt-1">Скоро завершатся</p>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onFilterChange('upcoming')}>
        <CardContent className="pt-6 text-center">
          <div className="text-3xl font-bold text-blue-500">{stats.upcoming}</div>
          <p className="text-sm text-muted-foreground mt-1">Предстоящие</p>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onFilterChange('ended')}>
        <CardContent className="pt-6 text-center">
          <div className="text-3xl font-bold text-muted-foreground">{stats.ended}</div>
          <p className="text-sm text-muted-foreground mt-1">Завершены</p>
        </CardContent>
      </Card>
    </div>
  );
}
