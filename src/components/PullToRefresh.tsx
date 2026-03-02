import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const { isPulling, isRefreshing, pullDistance } = usePullToRefresh({ onRefresh });

  const maxPull = 120;
  const threshold = 70;
  const progress = Math.min(pullDistance / threshold, 1);
  const visible = pullDistance > 5 || isRefreshing;

  // Размер индикатора и поворот стрелки в зависимости от прогресса
  const rotate = isPulling ? 180 : progress * 160;
  const indicatorSize = 36;
  const circumference = 2 * Math.PI * 14;
  const strokeDash = circumference * (isRefreshing ? 0.75 : progress * 0.75);

  return (
    <div style={{ position: 'relative' }}>
      {/* Индикатор — появляется сверху, толкает контент вниз */}
      <div
        style={{
          height: isRefreshing ? 56 : `${Math.min(pullDistance * 0.5, maxPull * 0.5)}px`,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: isRefreshing ? 'height 0.2s ease' : 'none',
          opacity: visible ? 1 : 0,
        }}
      >
        {visible && (
          <div
            style={{
              width: indicatorSize,
              height: indicatorSize,
              borderRadius: '50%',
              background: 'hsl(var(--background))',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {isRefreshing ? (
              // Крутящийся спиннер
              <svg width={indicatorSize} height={indicatorSize} viewBox="0 0 32 32">
                <circle
                  cx="16" cy="16" r="10"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="2.5"
                />
                <circle
                  cx="16" cy="16" r="10"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={`${strokeDash} ${circumference}`}
                  strokeDashoffset={0}
                  style={{
                    transformOrigin: '16px 16px',
                    animation: 'ptr-spin 0.8s linear infinite',
                  }}
                />
              </svg>
            ) : (
              // Стрелка с прогрессом
              <svg
                width={indicatorSize}
                height={indicatorSize}
                viewBox="0 0 32 32"
                style={{ transform: `rotate(${rotate}deg)`, transition: 'transform 0.15s ease' }}
              >
                <circle
                  cx="16" cy="16" r="10"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="2.5"
                />
                <circle
                  cx="16" cy="16" r="10"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={`${strokeDash} ${circumference}`}
                  strokeDashoffset={circumference * 0.25}
                  style={{ transformOrigin: '16px 16px' }}
                />
                <path
                  d="M16 10 L16 22 M12 18 L16 22 L20 18"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity={progress}
                />
              </svg>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes ptr-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {children}
    </div>
  );
}
