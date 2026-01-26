import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    if (isStandalone || isIOSStandalone) {
      return;
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) {
      return;
    }

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    if (iOS) {
      setTimeout(() => setShowPrompt(true), 2000);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(installEvent);
      
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('Пользователь принял установку');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleClose = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
          
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors z-10"
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
          
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-white rounded-2xl p-2 shadow-lg">
                <img
                  src="https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/bucket/4bbf8889-8425-4a91-bebb-1e4aaa060042.png"
                  alt="ЕРТТП"
                  className="w-full h-full object-contain"
                  style={{ transform: 'scaleX(-1)' }}
                />
              </div>
            </div>
            
            <h3 className="font-bold text-xl mb-2 text-center">Установите ЕРТТП</h3>
            <p className="text-sm text-blue-100 mb-4 text-center">
              Быстрый доступ с главного экрана
            </p>
            
            <div className="space-y-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm font-medium mb-1">Нажмите кнопку "Поделиться"</p>
                  <div className="flex items-center gap-2 text-xs text-blue-100">
                    <span className="bg-white/20 px-2 py-1 rounded flex items-center gap-1">
                      <span className="text-2xl">📤</span> Внизу экрана
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm font-medium mb-1">Выберите "На экран Домой"</p>
                  <div className="flex items-center gap-2 text-xs text-blue-100">
                    <span className="bg-white/20 px-2 py-1 rounded flex items-center gap-1">
                      <span className="text-xl">➕</span> В меню
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm font-medium mb-1">Нажмите "Добавить"</p>
                  <div className="flex items-center gap-2 text-xs text-blue-100">
                    <span className="bg-white/20 px-2 py-1 rounded flex items-center gap-1">
                      <span className="text-xl">✓</span> Готово!
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-blue-200 animate-pulse">
                👆 Следуйте инструкции выше
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-2xl p-5 text-white">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
          aria-label="Закрыть"
        >
          <X size={20} />
        </button>
        
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-14 h-14 bg-white rounded-xl p-1.5">
            <img
              src="https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/bucket/4bbf8889-8425-4a91-bebb-1e4aaa060042.png"
              alt="ЕРТТП"
              className="w-full h-full object-contain"
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>
          
          <div className="flex-1 pr-6">
            <h3 className="font-bold text-lg mb-1">Установить ЕРТТП</h3>
            <p className="text-sm text-blue-100 mb-4">
              Добавьте приложение на главный экран для быстрого доступа
            </p>
            
            <button
              onClick={handleInstallClick}
              className="w-full bg-white text-blue-700 font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              <Download size={18} />
              Установить приложение
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;