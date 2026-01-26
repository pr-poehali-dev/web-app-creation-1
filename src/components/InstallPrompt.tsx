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
              />
            </div>
            
            <div className="flex-1 pr-6">
              <h3 className="font-bold text-lg mb-1">Установить ЕРТТП</h3>
              <p className="text-sm text-blue-100 mb-3">
                Добавьте приложение на главный экран:
              </p>
              
              <ol className="text-xs text-blue-100 space-y-2 list-decimal list-inside">
                <li>Нажмите на кнопку "Поделиться" <span className="inline-block">📤</span></li>
                <li>Выберите "На экран Домой"</li>
                <li>Нажмите "Добавить"</li>
              </ol>
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