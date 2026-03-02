import { useEffect, useState, useRef } from 'react';

type LoadingState = 'hidden' | 'loading' | 'slow' | 'done';

export default function TopLoadingBar() {
  const [state, setState] = useState<LoadingState>('hidden');
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeCount = useRef(0);

  const startProgress = () => {
    setProgress(0);
    setState('loading');

    // Медленно ползёт до 85% пока идёт загрузка
    let current = 0;
    progressInterval.current = setInterval(() => {
      current += Math.random() * 8 + 2;
      if (current >= 85) {
        current = 85;
        if (progressInterval.current) clearInterval(progressInterval.current);
      }
      setProgress(current);
    }, 300);

    // Если загрузка затянулась — показываем текст
    slowTimer.current = setTimeout(() => {
      setState('slow');
    }, 3000);
  };

  const finishProgress = () => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    if (slowTimer.current) clearTimeout(slowTimer.current);
    setProgress(100);
    setState('done');
    doneTimer.current = setTimeout(() => {
      setState('hidden');
      setProgress(0);
    }, 500);
  };

  useEffect(() => {
    const handleStart = () => {
      activeCount.current += 1;
      if (activeCount.current === 1) startProgress();
    };

    const handleEnd = () => {
      activeCount.current = Math.max(0, activeCount.current - 1);
      if (activeCount.current === 0) finishProgress();
    };

    window.addEventListener('loadingStart', handleStart);
    window.addEventListener('loadingEnd', handleEnd);

    return () => {
      window.removeEventListener('loadingStart', handleStart);
      window.removeEventListener('loadingEnd', handleEnd);
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (slowTimer.current) clearTimeout(slowTimer.current);
      if (doneTimer.current) clearTimeout(doneTimer.current);
    };
  }, []);

  if (state === 'hidden') return null;

  return (
    <>
      {/* Полоска прогресса */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          zIndex: 99999,
          background: 'transparent',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
            transition: progress === 100 ? 'width 0.2s ease' : 'width 0.3s ease-out',
            boxShadow: '0 0 8px rgba(99, 102, 241, 0.6)',
          }}
        />
      </div>

      {/* Баннер "затянулась загрузка" */}
      {state === 'slow' && (
        <div
          style={{
            position: 'fixed',
            top: 3,
            left: 0,
            right: 0,
            zIndex: 99998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 16px',
            background: 'rgba(241, 244, 248, 0.95)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid rgba(99, 102, 241, 0.15)',
            pointerEvents: 'none',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              border: '2px solid #e2e8f0',
              borderTopColor: '#6366f1',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#475569',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              letterSpacing: '0.01em',
            }}
          >
            Обновляем данные...
          </span>
        </div>
      )}
    </>
  );
}

// Утилиты для запуска/остановки из любого места приложения
export function showLoading() {
  window.dispatchEvent(new Event('loadingStart'));
}

export function hideLoading() {
  window.dispatchEvent(new Event('loadingEnd'));
}
