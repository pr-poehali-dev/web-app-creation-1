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
    <div className="space-y-3 md:space-y-4">
      <div>
        <div className="flex items-start justify-between gap-2 md:gap-4 mb-2">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">{auction.title}</h1>
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

      <div className="space-y-2 md:space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm md:text-base text-muted-foreground">Стартовая цена:</span>
          <span className="text-base md:text-lg font-medium">{auction.startingPrice.toLocaleString()} ₽</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm md:text-base text-muted-foreground">Текущая ставка:</span>
          <span className="text-xl md:text-2xl lg:text-3xl font-bold text-primary">{auction.currentBid.toLocaleString()} ₽</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm md:text-base text-muted-foreground">Минимальный шаг:</span>
          <span className="text-sm md:text-base font-medium">{auction.minBidStep.toLocaleString()} ₽</span>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <div className="space-y-0.5 md:space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Icon name="Users" className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="text-xs md:text-sm">Ставки</span>
          </div>
          <p className="text-lg md:text-xl lg:text-2xl font-bold">{auction.bidCount}</p>
        </div>
        <div className="space-y-0.5 md:space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Icon name="Clock" className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="text-xs md:text-sm">Осталось</span>
          </div>
          <p className="text-lg md:text-xl lg:text-2xl font-bold">{timeRemaining}</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm md:text-base">
          <Icon name="MapPin" className="h-3.5 w-3.5 md:h-4 md:w-4" />
          <span>{districtName}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs md:text-sm">
          <Icon name="Calendar" className="h-3.5 w-3.5" />
          <span>Начало: {auction.startDate.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs md:text-sm">
          <Icon name="CalendarX" className="h-3.5 w-3.5" />
          <span>Завершение: {auction.endDate.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {auction.status === 'active' && (
        <>
          <Separator />
          <Button 
            size="default"
            className="w-full"
            onClick={onMakeBidClick}
          >
            <Icon name="Gavel" className="h-4 w-4 mr-2" />
            Сделать ставку
          </Button>
        </>
      )}
    </div>
  );
}