import { useEffect, useState } from 'react';
import { X, Download, Share } from 'lucide-react';

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
    const isIOSStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
    
    if (isStandalone || isIOSStandalone) {
      return;
    }

    if (localStorage.getItem('pwa-installed') === '1') {
      return;
    }

    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const daysSince = (Date.now() - Number(dismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return;
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) {
      return;
    }

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as { MSStream?: unknown }).MSStream;
    setIsIOS(iOS);

    if (iOS) {
      setTimeout(() => setShowPrompt(true), 5000);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(installEvent);
      
      setTimeout(() => setShowPrompt(true), 5000);
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
      localStorage.setItem('pwa-installed', '1');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleClose = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
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
            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white transition-colors z-10 rounded-md w-7 h-7 flex items-center justify-center border border-red-400"
            aria-label="Закрыть"
          >
            <X size={16} />
          </button>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white rounded-xl p-1 shadow-lg overflow-hidden flex-shrink-0">
                <img
                  src="https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/bucket/4bbf8889-8425-4a91-bebb-1e4aaa060042.png"
                  alt="ЕРТТП"
                  className="w-full h-full object-contain"
                  style={{ transform: 'scaleX(-1)' }}
                />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">Установите ЕРТТП</h3>
                <p className="text-xs text-blue-100">Быстрый доступ с главного экрана</p>
              </div>
            </div>
            
            <div className="space-y-2 bg-white/10 backdrop-blur-sm rounded-lg p-3">
              {[
                { n: 1, text: 'Нажмите "Поделиться"', icon: <Share className="w-3.5 h-3.5" strokeWidth={2.5} />, hint: 'Внизу экрана' },
                { n: 2, text: '"На экран Домой"', icon: <span className="text-sm">➕</span>, hint: 'В меню' },
                { n: 3, text: 'Нажмите "Добавить"', icon: <span className="text-sm">✓</span>, hint: 'Готово!' },
              ].map(({ n, text, icon, hint }) => (
                <div key={n} className="flex items-center gap-2">
                  <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm">
                    {n}
                  </div>
                  <p className="text-sm font-medium flex-1">{text}</p>
                  <span className="bg-blue-500/60 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                    {icon} {hint}
                  </span>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-blue-200 animate-pulse text-center mt-2">
              👆 Следуйте инструкции выше
            </p>
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
          <div className="flex-shrink-0 w-14 h-14 bg-white rounded-xl p-1.5 overflow-hidden">
            <img
              src="https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/bucket/4bbf8889-8425-4a91-bebb-1e4aaa060042.png"
              alt="ЕРТТП"
              className="w-full h-full object-contain scale-[1.8]"
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