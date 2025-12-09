import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { Auction } from '@/types/auction';

export const getTimeRemaining = (endTime: Date): string => {
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();

  if (diff <= 0) return 'Завершен';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}д ${hours}ч`;
  if (hours > 0) return `${hours}ч ${minutes}м`;
  return `${minutes}м`;
};

export const getStatusBadge = (status: Auction['status']): JSX.Element | null => {
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

export const canEdit = (auction: Auction): boolean => {
  if (!auction.startDate) return false;
  const start = auction.startDate instanceof Date ? auction.startDate : new Date(auction.startDate);
  if (isNaN(start.getTime())) return false;
  const now = new Date();
  return start > now;
};

export const canReducePrice = (auction: Auction): boolean => {
  return auction.status === 'active' || auction.status === 'ending-soon';
};

export const canStop = (auction: Auction): boolean => {
  return auction.status === 'active' || auction.status === 'ending-soon' || auction.status === 'upcoming';
};