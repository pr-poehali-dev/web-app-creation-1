import { useState, useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SplashScreen from "./components/SplashScreen";
import PullToRefresh from "./components/PullToRefresh";
import ErrorBoundary from "./components/ErrorBoundary";
import { getSession, clearSession } from "./utils/auth";
import Header from "./components/Header";
import { DistrictProvider } from "./contexts/DistrictContext";
import { OffersProvider } from "./contexts/OffersContext";

// Ленивая загрузка второстепенных компонентов
const NotificationPermissionBanner = lazy(() => import("./components/NotificationPermissionBanner"));
const TechnicalIssuesBanner = lazy(() => import("./components/TechnicalIssuesBanner"));
const InstallPrompt = lazy(() => import("./components/InstallPrompt"));
const TimezoneProvider = lazy(() => import("./contexts/TimezoneContext").then(m => ({ default: m.TimezoneProvider })));

// Компонент загрузки
const LoadingScreen = () => <SplashScreen />;

// Функция для обработки ошибок динамического импорта
const lazyWithRetry = (componentImport: () => Promise<unknown>) =>
  lazy(async () => {
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const component = await componentImport();
        return component as { default: React.ComponentType };
      } catch (error) {
        console.warn(`Attempt ${i + 1}/${maxRetries} failed:`, error);
        
        // На последней попытке очищаем кэш и перезагружаем
        if (i === maxRetries - 1) {
          console.error('Failed to load module after retries:', error);
          
          // Очищаем все кэши
          if ('caches' in window) {
            try {
              const names = await caches.keys();
              await Promise.all(names.map(name => caches.delete(name)));
            } catch (e) {
              console.error('Failed to clear cache:', e);
            }
          }
          
          // Автоматически перезагружаем страницу один раз (с ?reload чтобы сбросить кэш)
          const hasReloaded = new URLSearchParams(window.location.search).has('reload');
          if (!hasReloaded) {
            const url = new URL(window.location.href);
            url.searchParams.set('reload', '1');
            window.location.replace(url.toString());
            return {
              default: () => <div className="flex items-center justify-center min-h-screen">Загрузка...</div>
            } as { default: React.ComponentType };
          }
          
          // Если уже перезагружали, показываем ошибку
          return { 
            default: () => (
              <div className="flex items-center justify-center min-h-screen p-4">
                <div className="text-center max-w-md">
                  <h2 className="text-xl font-bold mb-2">Ошибка загрузки</h2>
                  <p className="text-muted-foreground mb-4">Не удалось загрузить страницу. Проверьте подключение к интернету.</p>
                  <button 
                    onClick={() => {
                      const url = new URL(window.location.href);
                      url.searchParams.delete('reload');
                      window.location.replace(url.toString());
                    }} 
                    className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                  >
                    Попробовать снова
                  </button>
                </div>
              </div>
            )
          } as { default: React.ComponentType };
        }
        
        // Ждём перед следующей попыткой
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, i)));
      }
    }
    throw new Error('Failed to load module after retries');
  });

// Ленивая загрузка всех страниц
const Login = lazyWithRetry(() => import("./pages/Login"));
const Offers = lazyWithRetry(() => import("./pages/Offers"));
const OfferDetail = lazyWithRetry(() => import("./pages/OfferDetail"));

// Ленивая загрузка остальных страниц
const Home = lazyWithRetry(() => import("./pages/Home"));
const Register = lazyWithRetry(() => import("./pages/Register"));
const MyOrders = lazyWithRetry(() => import("./pages/MyOrders"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));
const SearchResults = lazyWithRetry(() => import("./pages/SearchResults"));
const Requests = lazyWithRetry(() => import("./pages/Requests"));
const MyListings = lazyWithRetry(() => import("./pages/MyListings"));
const MyOffers = lazyWithRetry(() => import("./pages/MyOffers"));
const MyRequests = lazyWithRetry(() => import("./pages/MyRequests"));
const CreateOffer = lazyWithRetry(() => import("./pages/CreateOffer"));
const EditOffer = lazyWithRetry(() => import("./pages/EditOffer"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const NewPassword = lazyWithRetry(() => import("./pages/NewPassword"));
const VerifyEmail = lazyWithRetry(() => import("./pages/VerifyEmail"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const Auctions = lazyWithRetry(() => import("./pages/Auctions"));
const MyAuctions = lazyWithRetry(() => import("./pages/MyAuctions"));
const ActiveOrders = lazyWithRetry(() => import("./pages/ActiveOrders"));
const RequestDetail = lazyWithRetry(() => import("./pages/RequestDetail"));
const EditRequest = lazyWithRetry(() => import("./pages/EditRequest"));
const CreateRequest = lazyWithRetry(() => import("./pages/CreateRequest"));
const CreateAuction = lazyWithRetry(() => import("./pages/CreateAuction"));
const EditAuction = lazyWithRetry(() => import("./pages/EditAuction"));
const AuctionDetail = lazyWithRetry(() => import("./pages/AuctionDetail"));
const TelegramConnect = lazyWithRetry(() => import("./pages/TelegramConnect"));
const VerificationPage = lazyWithRetry(() => import("./pages/VerificationPage"));
const VerificationResubmit = lazyWithRetry(() => import("./pages/VerificationResubmit"));
const AdminVerifications = lazyWithRetry(() => import("./pages/AdminVerifications"));
const AdminLogin = lazyWithRetry(() => import("./pages/AdminLogin"));
const AdminChangePassword = lazyWithRetry(() => import("./pages/AdminChangePassword"));
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));
const AdminUsers = lazyWithRetry(() => import("./pages/AdminUsers"));
const AdminDeletedUsers = lazyWithRetry(() => import("./pages/AdminDeletedUsers"));
const AdminOffers = lazyWithRetry(() => import("./pages/AdminOffers"));
const AdminRequests = lazyWithRetry(() => import("./pages/AdminRequests"));
const AdminAnalytics = lazyWithRetry(() => import("./pages/AdminAnalytics"));
const AdminSettings = lazyWithRetry(() => import("./pages/AdminSettings"));
const AdminAuctions = lazyWithRetry(() => import("./pages/AdminAuctions"));
const AdminContracts = lazyWithRetry(() => import("./pages/AdminContracts"));
const AdminReviews = lazyWithRetry(() => import("./pages/AdminReviews"));
const AdminManageAdmins = lazyWithRetry(() => import("./pages/AdminManageAdmins"));
const AdminPanel = lazyWithRetry(() => import("./pages/AdminPanel"));
const AdminOrders = lazyWithRetry(() => import("./pages/AdminOrders"));
const SetAdminPassword = lazyWithRetry(() => import("./pages/SetAdminPassword"));
const AdminContentManagement = lazyWithRetry(() => import("./pages/AdminContentManagement"));
const TradingPlatform = lazyWithRetry(() => import("./pages/TradingPlatform"));
const CreateContract = lazyWithRetry(() => import("./pages/CreateContract"));
const OrderPage = lazyWithRetry(() => import("./pages/OrderPage"));
const OrderDetail = lazyWithRetry(() => import("./pages/OrderDetail"));
const OrderDetailPage = lazyWithRetry(() => import("./pages/OrderDetailPage"));
const ResponseDetailPage = lazyWithRetry(() => import("./pages/ResponseDetailPage"));

const MyReviews = lazyWithRetry(() => import("./pages/MyReviews"));
const TermsOfService = lazyWithRetry(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const OfferAgreement = lazyWithRetry(() => import("./pages/OfferAgreement"));
const Support = lazyWithRetry(() => import("./pages/Support"));
const ClearData = lazyWithRetry(() => import("./pages/ClearData"));
const DeleteTestData = lazyWithRetry(() => import("./pages/DeleteTestData"));
const MigrateImages = lazyWithRetry(() => import("./pages/MigrateImages"));
const TelegramSetup = lazyWithRetry(() => import("./pages/TelegramSetup"));
const VerifyPhone = lazyWithRetry(() => import("./pages/VerifyPhone"));
const ImageEditor = lazyWithRetry(() => import("./pages/ImageEditor"));

// Оптимизируем QueryClient для быстрой работы на медленном интернете
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Данные считаются свежими 5 минут
      gcTime: 1000 * 60 * 30, // Кэш хранится 30 минут
      retry: 1, // Только 1 повтор при ошибке (не 3)
      refetchOnWindowFocus: false, // Не перезагружать при фокусе окна
      refetchOnReconnect: false, // Не перезагружать при переподключении
    },
  },
});

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Быстрая проверка сессии без лишних операций
    const session = getSession();
    if (session) {
      setIsAuthenticated(true);
      
      // Синхронизируем профиль с сервером в фоне
      if (session.id) {
        setTimeout(async () => {
          try {
            const response = await fetch(`https://functions.poehali.dev/f20975b5-cf6f-4ee6-9127-53f3d552589f?id=${session.id}`, {
              headers: {
                'X-User-Id': String(session.id),
              },
            });
            
            if (response.ok) {
              const data = await response.json();
              const updatedUser = {
                ...session,
                firstName: data.first_name,
                lastName: data.last_name,
                middleName: data.middle_name,
                phone: data.phone,
                companyName: data.company_name,
                inn: data.inn,
                ogrnip: data.ogrnip,
                ogrn: data.ogrn,
              };
              
              // Обновляем localStorage с актуальными данными
              localStorage.setItem('currentUser', JSON.stringify(updatedUser));
              window.dispatchEvent(new Event('userSessionChanged'));
            }
          } catch (error) {
            // Игнорируем ошибки синхронизации
            console.log('Background profile sync failed:', error);
          }
        }, 1000);
      }
    }

    // Prefetch самых частых страниц после загрузки
    const prefetchTimer = setTimeout(() => {
      import("./pages/OfferDetail");
      import("./pages/Offers");
      import("./pages/Login");
      import("./pages/Requests");
      import("./pages/Profile");
      import("./pages/Auctions");
      import("./pages/CreateOffer");
      import("./pages/CreateRequest");
    }, 2000);

    // Регистрируем Service Worker в фоне
    if ('serviceWorker' in navigator) {
      setTimeout(() => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
          // Игнорируем ошибки
        });
      }, 1000);

      // Слушаем сообщения от Service Worker (клики по уведомлениям)
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'NOTIFICATION_CLICK') {
          window.location.href = event.data.url;
        }
      });
    }

    return () => clearTimeout(prefetchTimer);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    clearSession();
    setIsAuthenticated(false);
    // Отправляем событие для сброса состояния во всех компонентах
    window.dispatchEvent(new Event('userLoggedOut'));
  };

  const handleGlobalRefresh = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    window.location.reload();
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PullToRefresh onRefresh={handleGlobalRefresh}>
          <Suspense fallback={<LoadingScreen />}>
            <TimezoneProvider>
              <DistrictProvider>
                <OffersProvider>
                  <Toaster />
                  <Sonner />
                  <TechnicalIssuesBanner />
                  {isAuthenticated && <NotificationPermissionBanner />}
                  <InstallPrompt />
                  <BrowserRouter>
                <ErrorBoundary>
                <Suspense fallback={<LoadingScreen />}>
            <Routes>
            <Route path="/" element={<Navigate to="/predlozheniya" replace />} />
            <Route path="/home" element={<Home isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/predlozheniya" element={<Offers isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/search" element={<SearchResults isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/offer/:id" element={<OfferDetail isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/edit-offer/:id" element={<EditOffer isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/zaprosy" element={<Requests isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/request/:id" element={<RequestDetail isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/edit-request/:id" element={<EditRequest isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/auction" element={<Auctions isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/auction/:id" element={<AuctionDetail isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/support" element={<Support isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/clear-data" element={<ClearData isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/delete-test-data" element={<DeleteTestData />} />
            <Route path="/migrate-images" element={<MigrateImages isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/profile" element={<Profile isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/verification" element={<VerificationPage />} />
            <Route path="/verification/resubmit" element={<VerificationResubmit isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/panel" element={<AdminPanel isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin/dashboard" element={<AdminDashboard isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin/users" element={<AdminUsers isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin/deleted-users" element={<AdminDeletedUsers isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin/offers" element={<AdminOffers isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin/requests" element={<AdminRequests isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin/auctions" element={<AdminAuctions isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin/contracts" element={<AdminContracts isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin/reviews" element={<AdminReviews isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin/orders" element={<AdminOrders isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin/analytics" element={<AdminAnalytics isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin/settings" element={<AdminSettings isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin/manage-admins" element={<AdminManageAdmins isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin/verifications" element={<AdminVerifications isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin/change-password" element={<AdminChangePassword />} />
            <Route path="/admin/content" element={<AdminContentManagement />} />
            <Route path="/set-admin-password" element={<SetAdminPassword />} />
            <Route path="/trading" element={<TradingPlatform isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/create-contract" element={<CreateContract isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/order/:offerId" element={<OrderPage isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/order-detail/:id" element={<OrderDetailPage isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/response-detail/:id" element={<ResponseDetailPage isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />

            <Route path="/my-listings" element={<MyListings isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/my-offers" element={<MyOffers isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/my-requests" element={<MyRequests isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/create-offer" element={<CreateOffer isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/create-request" element={<CreateRequest isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/my-auctions" element={<MyAuctions isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/create-auction" element={<CreateAuction isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/edit-auction/:id" element={<EditAuction isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />

            <Route path="/active-orders" element={<ActiveOrders isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/my-orders" element={<MyOrders isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/my-reviews" element={<MyReviews isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />

            <Route path="/register" element={<Register onRegister={handleLogin} />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/new-password" element={<NewPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/verify-phone" element={<VerifyPhone />} />
            <Route path="/terms" element={<TermsOfService isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/privacy" element={<PrivacyPolicy isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/offer-agreement" element={<OfferAgreement isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/telegram-setup" element={<TelegramSetup isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/telegram-connect" element={<TelegramConnect />} />
            <Route path="/image-editor" element={<ImageEditor />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
                </Suspense>
                </ErrorBoundary>
        </BrowserRouter>
            </OffersProvider>
          </DistrictProvider>
        </TimezoneProvider>
        </Suspense>
        </PullToRefresh>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;