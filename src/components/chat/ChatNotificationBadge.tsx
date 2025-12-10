import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface ChatNotificationBadgeProps {
  count: number;
  className?: string;
}

export default function ChatNotificationBadge({ count, className = '' }: ChatNotificationBadgeProps) {
  if (count === 0) return null;

  return (
    <Badge 
      variant="destructive" 
      className={`gap-1 animate-pulse ${className}`}
    >
      <Icon name="MessageSquare" className="h-3 w-3" />
      {count > 99 ? '99+' : count}
    </Badge>
  );
}
