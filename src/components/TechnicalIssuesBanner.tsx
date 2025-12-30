import { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TechnicalIssuesBanner() {
  const [hasConnectionIssue, setHasConnectionIssue] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      // ⚡ ОПТИМИЗАЦИЯ: Пропускаем проверку если вкладка неактивна
      if (document.hidden) return;
      
      const recentErrors = sessionStorage.getItem('connection_errors');
      if (recentErrors) {
        const errorCount = parseInt(recentErrors);
        if (errorCount >= 2) {
          setHasConnectionIssue(true);
        }
      }
    };

    checkConnection();
    // ⚡ ОПТИМИЗАЦИЯ: Увеличили интервал с 5 до 10 сек
    const interval = setInterval(checkConnection, 10000);

    return () => clearInterval(interval);
  }, []);

  if (!hasConnectionIssue || isDismissed) {
    return null;
  }

  return (
    <Alert className="fixed top-0 left-0 right-0 z-50 rounded-none border-l-0 border-r-0 border-t-0 bg-amber-50 border-amber-200">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <AlertDescription className="text-amber-900 font-medium">
            ⚠️ Технические проблемы с сервером. Мы работаем над восстановлением. Некоторые данные могут отображаться из кэша.
          </AlertDescription>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-amber-600 hover:text-amber-800 transition-colors"
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </Alert>
  );
}