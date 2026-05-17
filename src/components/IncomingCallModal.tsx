import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { startBrowserRing, stopBrowserRing } from '@/utils/browserCall';

export interface IncomingCallData {
  title: string;
  message: string;
  url?: string;
}

interface Props {
  call: IncomingCallData | null;
  onDismiss: () => void;
}

export default function IncomingCallModal({ call, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (call) {
      setVisible(true);
      startBrowserRing();

      // Автоматически закрыть через 30 секунд
      const timer = setTimeout(() => {
        handleDismiss();
      }, 30000);

      return () => clearTimeout(timer);
    } else {
      setVisible(false);
      stopBrowserRing();
    }
  }, [call]);

  const handleDismiss = () => {
    stopBrowserRing();
    setVisible(false);
    onDismiss();
  };

  const handleOpen = () => {
    stopBrowserRing();
    if (call?.url) {
      window.location.href = call.url;
    }
    onDismiss();
  };

  if (!visible || !call) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pointer-events-none">
      <div
        className="pointer-events-auto mt-6 mx-4 w-full max-w-sm rounded-2xl shadow-2xl border border-primary/20 overflow-hidden animate-in slide-in-from-top-4 duration-300"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2440 100%)' }}
      >
        {/* Анимированная полоса сверху */}
        <div className="h-1 bg-primary animate-pulse" />

        <div className="p-5">
          {/* Иконка + заголовок */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                <Icon name="ShoppingBag" size={28} className="text-primary" />
              </div>
              {/* Пульсирующий круг */}
              <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary/80 uppercase tracking-wider mb-0.5">
                Входящий заказ
              </p>
              <h3 className="text-white font-bold text-base leading-tight truncate">
                {call.title}
              </h3>
            </div>
          </div>

          {/* Сообщение */}
          <p className="text-white/70 text-sm mb-5 leading-relaxed line-clamp-2">
            {call.message}
          </p>

          {/* Кнопки */}
          <div className="flex gap-3">
            <Button
              onClick={handleOpen}
              className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl h-11"
            >
              <Icon name="Eye" size={16} className="mr-2" />
              Открыть заказ
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="w-11 h-11 rounded-xl border-white/20 text-white/70 hover:bg-white/10 hover:text-white p-0 flex-shrink-0"
            >
              <Icon name="X" size={18} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
