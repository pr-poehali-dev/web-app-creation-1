import { useEffect, useRef, useState } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPullDown?: number;
}

export function usePullToRefresh({ 
  onRefresh, 
  threshold = 80, 
  maxPullDown = 150 
}: PullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const isPullGesture = useRef(false);
  // Храним текущее значение pullDistance в ref, чтобы избежать stale closure
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  useEffect(() => {
    pullDistanceRef.current = pullDistance;
  }, [pullDistance]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        startX.current = e.touches[0].clientX;
        isDragging.current = true;
        isPullGesture.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || isRefreshingRef.current) return;

      currentY.current = e.touches[0].clientY;
      const deltaY = currentY.current - startY.current;
      const deltaX = Math.abs(e.touches[0].clientX - startX.current);

      // Не блокируем горизонтальные свайпы (назад/вперёд на iOS)
      if (deltaX > 10) {
        isDragging.current = false;
        return;
      }

      if (deltaY > 10) {
        isPullGesture.current = true;
      }

      if (isPullGesture.current && deltaY > 0 && window.scrollY === 0) {
        e.preventDefault();
        const pullAmount = Math.min(deltaY * 0.5, maxPullDown);
        pullDistanceRef.current = pullAmount;
        setPullDistance(pullAmount);
        setIsPulling(pullAmount >= threshold);
      }
    };

    const handleTouchEnd = async () => {
      if (!isDragging.current) return;

      const currentPull = pullDistanceRef.current;
      isDragging.current = false;
      isPullGesture.current = false;

      if (currentPull >= threshold && !isRefreshingRef.current) {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        pullDistanceRef.current = 0;
        setPullDistance(0);
        setIsPulling(false);
        try {
          await onRefresh();
        } catch (error) {
          console.error('Refresh error:', error);
        } finally {
          isRefreshingRef.current = false;
          setIsRefreshing(false);
        }
      } else {
        pullDistanceRef.current = 0;
        setPullDistance(0);
        setIsPulling(false);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
   
  }, [onRefresh, threshold, maxPullDown]);

  return {
    isPulling,
    isRefreshing,
    pullDistance,
  };
}
