import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import type { Auction } from '@/types/auction';
import { getTimeUntilStart } from './AuctionHelpers';
import { useDateFormat } from '@/hooks/useDateFormat';
import { toast } from 'sonner';

interface AuctionInfoPanelProps {
  auction: Auction;
  categoryName?: string;
  districtName?: string;
  timeRemaining: string;
  timeUntilStart?: string;
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
  timeUntilStart,
  onMakeBidClick 
}: AuctionInfoPanelProps) {
  const { formatDateTime } = useDateFormat();

  const handleShare = async () => {
    const url = window.location.href;
    const shareText = `🔨 ${auction.title}\n\n💰 Текущая ставка: ${auction.currentBid.toLocaleString('ru-RU')} ₽${auction.description ? `\n\n📝 ${auction.description.slice(0, 150)}` : ''}\n\n🔗 `;
    if (navigator.share) {
      try {
        await navigator.share({ title: auction.title, text: `${shareText}${url}`, url });
      } catch (e) {
        if ((e as Error).name !== 'AbortError') await copyText(`${shareText}${url}`);
      }
    } else {
      await copyText(`${shareText}${url}`);
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    toast.success('Описание аукциона скопировано!', { description: 'Вставьте в мессенджер' });
  };
  
  return (
    <div className="space-y-2 md:space-y-3">
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold">{auction.title}</h1>
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

      <Separator className="my-2" />

      <div className="space-y-1.5 md:space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs md:text-sm text-muted-foreground">Старт:</span>
          <span className="text-sm md:text-base font-medium">{auction.startingPrice.toLocaleString()} ₽</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs md:text-sm text-muted-foreground">Текущая:</span>
          <span className="text-lg md:text-xl lg:text-2xl font-bold text-primary">{auction.currentBid.toLocaleString()} ₽</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs md:text-sm text-muted-foreground">Шаг:</span>
          <span className="text-xs md:text-sm font-medium">{auction.minBidStep.toLocaleString()} ₽</span>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Icon name="Users" className="h-3 w-3 md:h-3.5 md:w-3.5" />
            <span className="text-[10px] md:text-xs">Ставки</span>
          </div>
          <p className="text-base md:text-lg lg:text-xl font-bold">{auction.bidCount}</p>
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Icon name="Clock" className="h-3 w-3 md:h-3.5 md:w-3.5" />
            <span className="text-[10px] md:text-xs">
              {auction.status === 'upcoming' ? 'До старта' : 'Осталось'}
            </span>
          </div>
          <p className={`text-base md:text-lg lg:text-xl font-bold ${
            auction.status === 'upcoming' ? 'text-blue-600' : ''
          }`}>
            {auction.status === 'upcoming' ? timeUntilStart : timeRemaining}
          </p>
        </div>
      </div>

      <Separator />

      <div className="space-y-1">
        <div className="flex items-center gap-1 text-muted-foreground text-xs md:text-sm">
          <Icon name="MapPin" className="h-3 w-3 md:h-3.5 md:w-3.5" />
          <span>{districtName}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-[10px] md:text-xs">
          <Icon name="Calendar" className="h-3 w-3" />
          <span>{formatDateTime(auction.startDate, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-[10px] md:text-xs">
          <Icon name="CalendarX" className="h-3 w-3" />
          <span>{formatDateTime(auction.endDate, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <Separator className="my-2" />
      <div className="flex gap-2">
        {auction.status === 'active' && (
          <Button 
            size="sm"
            className="flex-1 h-9 text-sm"
            onClick={onMakeBidClick}
          >
            <Icon name="Gavel" className="h-3.5 w-3.5 mr-1.5" />
            Сделать ставку
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-9 text-sm"
          onClick={handleShare}
        >
          <Icon name="Share2" className="h-3.5 w-3.5 mr-1.5" />
          Поделиться
        </Button>
      </div>
    </div>
  );
}