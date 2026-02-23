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

  return null;
}