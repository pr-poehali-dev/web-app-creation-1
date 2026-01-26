import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';

interface DataSyncIndicatorProps {
  isVisible: boolean;
}

export default function DataSyncIndicator({ isVisible }: DataSyncIndicatorProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
    } else {
      // Задержка перед скрытием для плавности
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!show) return null;

  return (
    <div 
      className={`fixed top-16 right-4 z-40 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm">
        <Icon name="RefreshCw" className="h-4 w-4 animate-spin" />
        <span>Обновление...</span>
      </div>
    </div>
  );
}
