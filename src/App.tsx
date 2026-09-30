import { useState, useEffect } from "react";
import { removeSplash } from "./main";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import PullToRefresh from "./components/PullToRefresh";
import { getSession, clearSession } from "./utils/auth";
import { clearPin, clearPinUnlockFlag, markPinUnlocked } from "./utils/pinAuth";
import { clearCache } from "./services/api";
import { SmartCache } from "./utils/smartCache";
import { DistrictProvider } from "./contexts/DistrictContext";
import { OffersProvider } from "./contexts/OffersContext";
import { TimezoneProvider } from "./contexts/TimezoneContext";
import { showLoading, hideLoading } from "./components/TopLoadingBar";
import { useAppInit } from "./components/app/useAppInit";
import { usePinLock } from "./hooks/usePinLock";
import AppBanners from "./components/app/AppBanners";
import AppRoutes from "./components/app/AppRoutes";
import PinSetupScreen from "./components/pin/PinSetupScreen";
import PinLockScreen from "./components/pin/PinLockScreen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

function AppInner() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getSession());
  const pinLock = usePinLock(isAuthenticated);

  useEffect(() => { removeSplash(); }, []);
  useAppInit();

  const handleLogin = () => {
    markPinUnlocked();
    setIsAuthenticated(true);
  };

  const handleRegister = () => {
    setIsAuthenticated(true);
    pinLock.requireSetup();
  };

  const handleLogout = () => {
    clearSession();
    clearPinUnlockFlag();
    setIsAuthenticated(false);
    window.dispatchEvent(new Event('userLoggedOut'));
  };

  const handleForgotPin = async () => {
    await clearPin();
    handleLogout();
  };

  const handleGlobalRefresh = async () => {
    showLoading();
    try {
      clearCache();
      SmartCache.invalidateAll('orders');
      SmartCache.invalidateAll('requests');
      SmartCache.invalidateAll('offers');
      SmartCache.invalidateAll('auctions');
      window.dispatchEvent(new CustomEvent('globalRefresh'));
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      await new Promise(r => setTimeout(r, 400));
      window.location.reload();
    } catch {
      hideLoading();
    }
  };

  if (isAuthenticated && pinLock.showPinSetup) {
    return <PinSetupScreen onComplete={pinLock.completeSetup} />;
  }

  if (isAuthenticated && pinLock.showPinLock) {
    const session = getSession();
    const userName = session ? `${session.firstName || ''} ${session.lastName || ''}`.trim() : undefined;
    return (
      <PinLockScreen
        userName={userName}
        onSuccess={pinLock.completeUnlock}
        onForgotPin={handleForgotPin}
      />
    );
  }

  return (
    <PullToRefresh onRefresh={handleGlobalRefresh}>
      <AppBanners isAuthenticated={isAuthenticated} />
      <AppRoutes
        isAuthenticated={isAuthenticated}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
      />
    </PullToRefresh>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <TimezoneProvider>
          <DistrictProvider>
            <OffersProvider>
              <AppInner />
            </OffersProvider>
          </DistrictProvider>
        </TimezoneProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;