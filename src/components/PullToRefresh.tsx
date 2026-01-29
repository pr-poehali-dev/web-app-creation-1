import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import Icon from '@/components/ui/icon';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const { isPulling, isRefreshing, pullDistance } = usePullToRefresh({ onRefresh });

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-200"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 0 ? 1 : 0,
          background: 'linear-gradient(to bottom, hsl(var(--background)), transparent)',
        }}
      >
        <div
          className={`flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
            isRefreshing ? 'text-primary' : isPulling ? 'text-green-600' : 'text-muted-foreground'
          }`}
          style={{
            transform: `translateY(${Math.min(pullDistance - 40, 20)}px)`,
          }}
        >
          {isRefreshing ? (
            <>
              <Icon name="Loader2" className="h-5 w-5 animate-spin" />
              <span>Обновление...</span>
            </>
          ) : isPulling ? (
            <>
              <Icon name="CheckCircle" className="h-5 w-5" />
              <span>Отпустите для обновления</span>
            </>
          ) : (
            <>
              <Icon name="ArrowDown" className="h-5 w-5" />
              <span>Потяните вниз</span>
            </>
          )}
        </div>
      </div>
      {children}
    </>
  );
}
