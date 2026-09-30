import { useState, useEffect, useCallback } from 'react';
import { getSession } from '@/utils/auth';
import { isPinUnlockedThisSession, markPinUnlocked, clearPinUnlockFlag } from '@/utils/pinAuth';

export function usePinLock(isAuthenticated: boolean) {
  const [showPinLock, setShowPinLock] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowPinLock(false);
      return;
    }
    const session = getSession();
    if (session?.hasPin && !isPinUnlockedThisSession()) {
      setShowPinLock(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        clearPinUnlockFlag();
        return;
      }
      if (document.visibilityState === 'visible' && isAuthenticated) {
        const session = getSession();
        if (session?.hasPin && !isPinUnlockedThisSession()) {
          setShowPinLock(true);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated]);

  const requireSetup = useCallback(() => {
    setShowPinSetup(true);
  }, []);

  const skipLockOnce = useCallback(() => {
    markPinUnlocked();
    setShowPinLock(false);
  }, []);

  const completeSetup = useCallback(() => {
    setShowPinSetup(false);
    setShowPinLock(false);
  }, []);

  const completeUnlock = useCallback(() => {
    setShowPinLock(false);
  }, []);

  return {
    showPinLock,
    showPinSetup,
    requireSetup,
    skipLockOnce,
    completeSetup,
    completeUnlock,
  };
}
