import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import type { Auction } from '@/types/auction';

interface AuctionInfoPanelProps {
  auction: Auction;
  categoryName?: string;
  districtName?: string;
  timeRemaining: string;
  onMakeBidClick: () => void;
}

const getStatusBadge = (status: Auction['status']) => {
  switch (status) {
    case 'pending':
      return <Badge className="bg-yellow-500"><Icon name="Clock" className="h-3 w-3 mr-1" />Ожидает публикации</Badge>;
    case 'active':
      return <Badge className="bg-green-500"><Icon name="Play" className="h-3 w-3 mr-1" />Активен</Badge>;
    case 'ending-soon':
      return <Badge className="bg-orange-500"><Icon name="Clock" className="h-3 w-3 mr-1" />Скоро завершится</Badge>;
    case 'upcoming':
      return <Badge className="bg-blue-500"><Icon name="Calendar" className="h-3 w-3 mr-1" />Предстоящий</Badge>;
    case 'ended':
      return <Badge variant="secondary"><Icon name="CheckCircle" className="h-3 w-3 mr-1" />Завершен</Badge>;
    default:
      return null;
  }
};

export default function AuctionInfoPanel({ 
  auction, 
  categoryName, 
  districtName, 
  timeRemaining,
  onMakeBidClick 
}: AuctionInfoPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-3xl font-bold">{auction.title}</h1>
          {getStatusBadge(auction.status)}
        </div>
        {categoryName && (
          <Badge variant="secondary">{categoryName}</Badge>
        )}
        {auction.isPremium && (
          <Badge className="bg-primary ml-2">
            <Icon name="Star" className="h-3 w-3 mr-1" />
            Премиум
          </Badge>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Стартовая цена:</span>
          <span className="text-xl font-medium">{auction.startingPrice.toLocaleString()} ₽</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Текущая ставка:</span>
          <span className="text-3xl font-bold text-primary">{auction.currentBid.toLocaleString()} ₽</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Минимальный шаг:</span>
          <span className="font-medium">{auction.minBidStep.toLocaleString()} ₽</span>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon name="Users" className="h-4 w-4" />
            <span className="text-sm">Количество ставок</span>
          </div>
          <p className="text-2xl font-bold">{auction.bidCount}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon name="Clock" className="h-4 w-4" />
            <span className="text-sm">Осталось времени</span>
          </div>
          <p className="text-2xl font-bold">{timeRemaining}</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon name="MapPin" className="h-4 w-4" />
          <span>{districtName}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon name="Calendar" className="h-4 w-4" />
          <span>Начало: {auction.startDate.toLocaleString('ru-RU')}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon name="CalendarX" className="h-4 w-4" />
          <span>Завершение: {auction.endDate.toLocaleString('ru-RU')}</span>
        </div>
      </div>

      {auction.status === 'active' && (
        <>
          <Separator />
          <Button 
            size="lg" 
            className="w-full"
            onClick={onMakeBidClick}
          >
            <Icon name="Gavel" className="h-5 w-5 mr-2" />
            Сделать ставку
          </Button>
        </>
      )}
    </div>
  );
}
