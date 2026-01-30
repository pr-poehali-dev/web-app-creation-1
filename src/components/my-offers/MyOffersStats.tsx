import { Card, CardContent } from '@/components/ui/card';

type OfferStatus = 'active' | 'draft' | 'moderation' | 'archived';

interface OffersStats {
  total: number;
  active: number;
  draft: number;
  moderation: number;
  archived: number;
}

interface MyOffersStatsProps {
  stats: OffersStats;
  onFilterChange: (status: 'all' | OfferStatus) => void;
}

export default function MyOffersStats({ stats, onFilterChange }: MyOffersStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onFilterChange('all')}>
        <CardContent className="pt-6 text-center">
          <div className="text-3xl font-bold text-primary">{stats.total}</div>
          <p className="text-sm text-muted-foreground mt-1">Всего</p>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onFilterChange('active')}>
        <CardContent className="pt-6 text-center">
          <div className="text-3xl font-bold text-green-500">{stats.active}</div>
          <p className="text-sm text-muted-foreground mt-1">Активных</p>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onFilterChange('draft')}>
        <CardContent className="pt-6 text-center">
          <div className="text-3xl font-bold text-gray-500">{stats.draft}</div>
          <p className="text-sm text-muted-foreground mt-1">Черновики</p>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onFilterChange('moderation')}>
        <CardContent className="pt-6 text-center">
          <div className="text-3xl font-bold text-orange-500">{stats.moderation}</div>
          <p className="text-sm text-muted-foreground mt-1">На модерации</p>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onFilterChange('archived')}>
        <CardContent className="pt-6 text-center">
          <div className="text-3xl font-bold text-slate-500">{stats.archived}</div>
          <p className="text-sm text-muted-foreground mt-1">В архиве</p>
        </CardContent>
      </Card>
    </div>
  );
}
