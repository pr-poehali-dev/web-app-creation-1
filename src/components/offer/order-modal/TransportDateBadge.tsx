import Icon from '@/components/ui/icon';

interface TransportDateBadgeProps {
  dateTime: string;
}

export default function TransportDateBadge({ dateTime }: TransportDateBadgeProps) {
  const formatted = (() => {
    try {
      const d = new Date(dateTime);
      return isNaN(d.getTime())
        ? dateTime
        : d.toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
    } catch {
      return dateTime;
    }
  })();

  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
      <Icon name="Calendar" className="w-4 h-4 text-muted-foreground shrink-0" />
      <div>
        <span className="text-muted-foreground">Дата и время выезда: </span>
        <span className="font-semibold">{formatted}</span>
      </div>
    </div>
  );
}
