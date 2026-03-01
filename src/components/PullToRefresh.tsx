import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const { isPulling, isRefreshing, pullDistance } = usePullToRefresh({ onRefresh });

  const active = pullDistance > 0 || isRefreshing;
  const spinnerSize = 36;
  const spinnerOffset = isRefreshing ? spinnerSize + 12 : Math.min(pullDistance, spinnerSize + 12);
  const rotation = Math.min((pullDistance / 80) * 270, 270);

  return (
    <>
      <div
        className="pointer-events-none fixed top-0 left-0 right-0 z-50 flex justify-center"
        style={{
          height: `${spinnerOffset}px`,
          transition: isRefreshing || pullDistance === 0 ? 'height 0.2s ease' : 'none',
        }}
      >
        {active && (
          <div
            className="absolute bottom-2 flex items-center justify-center rounded-full bg-background shadow-md border border-border"
            style={{ width: spinnerSize, height: spinnerSize }}
          >
            {isRefreshing ? (
              <svg
                className="animate-spin text-primary"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20" strokeLinecap="round" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isPulling ? 'text-primary' : 'text-muted-foreground'}
                style={{ transform: `rotate(${rotation}deg)`, transition: 'none' }}
              >
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          transform: `translateY(${isRefreshing ? spinnerSize + 12 : pullDistance > 0 ? Math.min(pullDistance, spinnerSize + 12) : 0}px)`,
          transition: isRefreshing || pullDistance === 0 ? 'transform 0.2s ease' : 'none',
        }}
      >
        {children}
      </div>
    </>
  );
}
