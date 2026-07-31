import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { NewsItem } from './useMarketData';

interface MarketNewsListProps {
  news: NewsItem[];
  isLoading: boolean;
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
}

export default function MarketNewsList({ news, isLoading }: MarketNewsListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Icon name="Loader2" size={22} className="animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (news.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          <Icon name="Newspaper" size={24} className="mx-auto mb-2 opacity-40" />
          Свежих новостей по активу не найдено
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {news.map((item, i) => (
        <a
          key={i}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-3.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium leading-snug">{item.title}</h3>
                <Icon name="ExternalLink" size={14} className="shrink-0 text-muted-foreground mt-0.5" />
              </div>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
              )}
              <div className="text-[11px] text-muted-foreground mt-1.5">{formatDate(item.date)}</div>
            </CardContent>
          </Card>
        </a>
      ))}
    </div>
  );
}
