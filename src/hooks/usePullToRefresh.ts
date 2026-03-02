import { useEffect, useRef, useState, useCallback } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPullDown?: number;
}

export function usePullToRefresh({ 
  onRefresh, 
  threshold = 70, 
  maxPullDown = 120 
}: PullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const isTrackingRef = useRef(false);
  const isVerticalRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const onRefreshRef = useRef(onRefresh);
  const animFrameRef = useRef<number | null>(null);

  // Всегда актуальная ссылка без пересоздания листенеров
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const setPull = useCallback((val: number) => {
    pullDistanceRef.current = val;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(() => setPullDistance(val));
  }, []);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || isRefreshingRef.current) return;
      startYRef.current = e.touches[0].clientY;
      startXRef.current = e.touches[0].clientX;
      isTrackingRef.current = true;
      isVerticalRef.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isTrackingRef.current || isRefreshingRef.current) return;

      const dy = e.touches[0].clientY - startYRef.current;
      const dx = Math.abs(e.touches[0].clientX - startXRef.current);

      if (!isVerticalRef.current) {
        if (dx > 8) {
          isTrackingRef.current = false;
          setPull(0);
          return;
        }
        if (dy > 8) {
          isVerticalRef.current = true;
        } else {
          return;
        }
      }

      if (dy <= 0 || window.scrollY > 0) {
        setPull(0);
        return;
      }

      e.preventDefault();
      const pulled = Math.min(dy * 0.45, maxPullDown);
      setPull(pulled);
    };

    const onTouchEnd = async () => {
      if (!isTrackingRef.current) return;
      isTrackingRef.current = false;
      isVerticalRef.current = false;

      const pulled = pullDistanceRef.current;
      setPull(0);

      if (pulled >= threshold && !isRefreshingRef.current) {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        try {
          await onRefreshRef.current();
        } catch {
          // silent
        } finally {
          isRefreshingRef.current = false;
          setIsRefreshing(false);
        }
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [threshold, maxPullDown, setPull]);

  return {
    isPulling: pullDistance >= threshold,
    isRefreshing,
    pullDistance,
  };
}
