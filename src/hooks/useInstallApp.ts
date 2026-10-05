import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Событие может прийти раньше, чем смонтируется компонент — ловим на уровне модуля
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    localStorage.setItem('pwa-installed', '1');
    notify();
  });
}

const isStandaloneNow = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as { standalone?: boolean }).standalone === true;

export type InstallResult = 'installed' | 'dismissed' | 'ios-manual' | 'manual' | 'already';

export function useInstallApp() {
  const [, force] = useState(0);

  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isInstalled = typeof window !== 'undefined' && isStandaloneNow();
  const canPromptInstall = !!deferredPrompt;

  const install = useCallback(async (): Promise<InstallResult> => {
    if (isStandaloneNow()) return 'already';

    // Android / Chrome / Edge: нативное окно установки в один клик
    if (deferredPrompt) {
      const evt = deferredPrompt;
      deferredPrompt = null;
      notify();
      await evt.prompt();
      const { outcome } = await evt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem('pwa-installed', '1');
        return 'installed';
      }
      return 'dismissed';
    }

    // iOS: программной установки нет — открываем системное меню «Поделиться»,
    // в нём сразу есть пункт «На экран Домой»
    if (isIOS) {
      if (navigator.share) {
        try {
          await navigator.share({ url: window.location.origin, title: document.title });
        } catch {
          /* пользователь закрыл меню */
        }
      }
      return 'ios-manual';
    }

    return 'manual';
  }, [isIOS]);

  return { install, isIOS, isInstalled, canPromptInstall };
}
