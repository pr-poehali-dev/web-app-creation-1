import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { Auction } from '@/types/auction';

function formatCountdown(diff: number): string {
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (days > 0) return `${days}д. ${hh}:${mm}:${ss}`;
  return `${hh}:${mm}:${ss}`;
}

export const getTimeRemaining = (endTime?: Date | string): string => {
  if (!endTime) return 'Неизвестно';
  const endDate = typeof endTime === 'string' ? new Date(endTime) : endTime;
  if (isNaN(endDate.getTime())) return 'Неизвестно';
  const diff = endDate.getTime() - Date.now();
  if (diff <= 0) return 'Завершен';
  return formatCountdown(diff);
};

export const getTimeUntilStart = (startTime?: Date | string): string => {
  if (!startTime) return 'Неизвестно';
  const startDate = typeof startTime === 'string' ? new Date(startTime) : startTime;
  if (isNaN(startDate.getTime())) return 'Неизвестно';
  const diff = startDate.getTime() - Date.now();
  if (diff <= 0) return 'Начался';
  return formatCountdown(diff);
};

export const getStatusBadge = (status: Auction['status']) => {
  switch (status) {
    case 'active':
      return (
        <Badge className="bg-green-500">
          <Icon name="Play" className="h-3 w-3 mr-1" />
          Активен
        </Badge>
      );
    case 'ending-soon':
      return (
        <Badge className="bg-orange-500">
          <Icon name="Clock" className="h-3 w-3 mr-1" />
          Скоро завершится
        </Badge>
      );
    case 'upcoming':
      return (
        <Badge className="bg-blue-500">
          <Icon name="Calendar" className="h-3 w-3 mr-1" />
          Предстоящий
        </Badge>
      );
    case 'ended':
      return (
        <Badge variant="secondary">
          <Icon name="CheckCircle" className="h-3 w-3 mr-1" />
          Завершен
        </Badge>
      );
  }
};