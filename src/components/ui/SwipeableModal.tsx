import { useEffect, useRef, useState, ReactNode } from 'react';
import Icon from '@/components/ui/icon';

interface SwipeableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function SwipeableModal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}: SwipeableModalProps) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTranslateX(0);
      setTranslateY(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy < -10 || Math.abs(dx) > 10) {
      setTranslateX(dx);
      setTranslateY(Math.min(0, dy));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const THRESHOLD = 80;
    if (Math.abs(translateX) > THRESHOLD || translateY < -THRESHOLD) {
      onClose();
    } else {
      setTranslateX(0);
      setTranslateY(0);
    }
  };

  if (!isOpen) return null;

  const opacity = Math.max(0.2, 1 - (Math.abs(translateX) + Math.abs(translateY)) / 300);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-200"
        style={{ opacity }}
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full sm:max-w-2xl bg-background rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl ${className}`}
        style={{
          maxHeight: '92dvh',
          transform: `translateX(${translateX}px) translateY(${translateY}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s ease',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 pt-5 pb-3 border-b relative">
          <div className="sm:hidden w-10 h-1 bg-muted-foreground/30 rounded-full absolute left-1/2 -translate-x-1/2 top-2" />
          <div className="font-semibold text-base flex-1 min-w-0 pr-2">{title}</div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 transition-colors text-white shrink-0"
            aria-label="Закрыть"
          >
            <Icon name="X" size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
