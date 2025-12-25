import { useState, useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotificationPermissionBanner from "./components/NotificationPermissionBanner";
import { DistrictProvider } from "./contexts/DistrictContext";
import { TimezoneProvider } from "./contexts/TimezoneContext";
import { OffersProvider } from "./contexts/OffersContext";
import { getSession, clearSession } from "./utils/auth";

// Компонент загрузки
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Ленивая загрузка страниц
const Login = lazy(() => import("./pages/Login").catch(() => window.location.reload()));
const Register = lazy(() => import("./pages/Register").catch(() => window.location.reload()));
const ResetPassword = lazy(() => import("./pages/ResetPassword").catch(() => window.location.reload()));
const NewPassword = lazy(() => import("./pages/NewPassword").catch(() => window.location.reload()));
const NotFound = lazy(() => import("./pages/NotFound").catch(() => window.location.reload()));
const Offers = lazy(() => import("./pages/Offers").catch(() => window.location.reload()));
const Requests = lazy(() => import("./pages/Requests").catch(() => window.location.reload()));
const Auctions = lazy(() => import("./pages/Auctions").catch(() => window.location.reload()));
const Home = lazy(() => import("./pages/Home").catch(() => window.location.reload()));
const Profile = lazy(() => import("./pages/Profile").catch(() => window.location.reload()));
const MyListings = lazy(() => import("./pages/MyListings").catch(() => window.location.reload()));
const MyAuctions = lazy(() => import("./pages/MyAuctions").catch(() => window.location.reload()));
const ActiveOrders = lazy(() => import("./pages/ActiveOrders").catch(() => window.location.reload()));
const Notifications = lazy(() => import("./pages/Notifications").catch(() => window.location.reload()));
const SearchResults = lazy(() => import("./pages/SearchResults").catch(() => window.location.reload()));
const OfferDetail = lazy(() => import("./pages/OfferDetail").catch(() => window.location.reload()));
const RequestDetail = lazy(() => import("./pages/RequestDetail").catch(() => window.location.reload()));
const EditOffer = lazy(() => import("./pages/EditOffer").catch(() => window.location.reload()));
const EditRequest = lazy(() => import("./pages/EditRequest").catch(() => window.location.reload()));
const CreateOffer = lazy(() => import("./pages/CreateOffer").catch(() => window.location.reload()));
const CreateRequest = lazy(() => import("./pages/CreateRequest").catch(() => window.location.reload()));
const CreateAuction = lazy(() => import("./pages/CreateAuction").catch(() => window.location.reload()));
const EditAuction = lazy(() => import("./pages/EditAuction").catch(() => window.location.reload()));
const AuctionDetail = lazy(() => import("./pages/AuctionDetail").catch(() => window.location.reload()));
const VerificationPage = lazy(() => import("./pages/VerificationPage").catch(() => window.location.reload()));
const VerificationResubmit = lazy(() => import("./pages/VerificationResubmit").catch(() => window.location.reload()));
const AdminVerifications = lazy(() => import("./pages/AdminVerifications").catch(() => window.location.reload()));
const AdminLogin = lazy(() => import("./pages/AdminLogin").catch(() => window.location.reload()));
const AdminChangePassword = lazy(() => import("./pages/AdminChangePassword").catch(() => window.location.reload()));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard").catch(() => window.location.reload()));
const AdminUsers = lazy(() => import("./pages/AdminUsers").catch(() => window.location.reload()));
const AdminDeletedUsers = lazy(() => import("./pages/AdminDeletedUsers").catch(() => window.location.reload()));
const AdminOffers = lazy(() => import("./pages/AdminOffers").catch(() => window.location.reload()));
const AdminRequests = lazy(() => import("./pages/AdminRequests").catch(() => window.location.reload()));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics").catch(() => window.location.reload()));
const AdminSettings = lazy(() => import("./pages/AdminSettings").catch(() => window.location.reload()));
const AdminAuctions = lazy(() => import("./pages/AdminAuctions").catch(() => window.location.reload()));
const AdminContracts = lazy(() => import("./pages/AdminContracts").catch(() => window.location.reload()));
const AdminReviews = lazy(() => import("./pages/AdminReviews").catch(() => window.location.reload()));
const AdminManageAdmins = lazy(() => import("./pages/AdminManageAdmins").catch(() => window.location.reload()));
const AdminPanel = lazy(() => import("./pages/AdminPanel").catch(() => window.location.reload()));
const AdminOrders = lazy(() => import("./pages/AdminOrders").catch(() => window.location.reload()));
const SetAdminPassword = lazy(() => import("./pages/SetAdminPassword").catch(() => window.location.reload()));
const TradingPlatform = lazy(() => import("./pages/TradingPlatform").catch(() => window.location.reload()));
const CreateContract = lazy(() => import("./pages/CreateContract").catch(() => window.location.reload()));
const OrderPage = lazy(() => import("./pages/OrderPage").catch(() => window.location.reload()));
const OrderDetail = lazy(() => import("./pages/OrderDetail").catch(() => window.location.reload()));
const OrderDetailPage = lazy(() => import("./pages/OrderDetailPage").catch(() => window.location.reload()));
const ResponseDetailPage = lazy(() => import("./pages/ResponseDetailPage").catch(() => window.location.reload()));
const ChatNotifications = lazy(() => import("./pages/ChatNotifications").catch(() => window.location.reload()));
const MyReviews = lazy(() => import("./pages/MyReviews").catch(() => window.location.reload()));
const MyOrders = lazy(() => import("./pages/MyOrders").catch(() => window.location.reload()));
const TermsOfService = lazy(() => import("./pages/TermsOfService").catch(() => window.location.reload()));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy").catch(() => window.location.reload()));
const OfferAgreement = lazy(() => import("./pages/OfferAgreement").catch(() => window.location.reload()));
const About = lazy(() => import("./pages/About").catch(() => window.location.reload()));
const Support = lazy(() => import("./pages/Support").catch(() => window.location.reload()));
const ClearData = lazy(() => import("./pages/ClearData").catch(() => window.location.reload()));
const DeleteTestData = lazy(() => import("./pages/DeleteTestData").catch(() => window.location.reload()));
const MigrateImages = lazy(() => import("./pages/MigrateImages").catch(() => window.location.reload()));

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
    }

    // Регистрируем Service Worker в фоне
    if ('serviceWorker' in navigator) {
      setTimeout(() => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
          // Игнорируем ошибки
        });
      }, 1000);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    clearSession();
    setIsAuthenticated(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <TimezoneProvider>
          <DistrictProvider>
            <OffersProvider>
              <Toaster />
              <Sonner />
              {isAuthenticated && <NotificationPermissionBanner />}
              <BrowserRouter>
                <Suspense fallback={<LoadingScreen />}>
            <Routes>
            <Route path="/" element={<Home isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/search" element={<SearchResults isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/predlozheniya" element={<Offers isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/offer/:id" element={<OfferDetail isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/edit-offer/:id" element={<EditOffer isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/zaprosy" element={<Requests isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/request/:id" element={<RequestDetail isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/edit-request/:id" element={<EditRequest isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/auction" element={<Auctions isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/auction/:id" element={<AuctionDetail isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/about" element={<About isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
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
            <Route path="/set-admin-password" element={<SetAdminPassword />} />
            <Route path="/trading" element={<TradingPlatform isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/create-contract" element={<CreateContract isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/order/:offerId" element={<OrderPage isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/order-detail/:id" element={<OrderDetailPage isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/response-detail/:id" element={<ResponseDetailPage isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/chat-notifications" element={<ChatNotifications isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/my-listings" element={<MyListings isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/my-offers" element={<MyListings isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/my-requests" element={<MyListings isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/create-offer" element={<CreateOffer isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/create-request" element={<CreateRequest isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/my-auctions" element={<MyAuctions isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/create-auction" element={<CreateAuction isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/edit-auction/:id" element={<EditAuction isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />

            <Route path="/active-orders" element={<ActiveOrders isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/my-orders" element={<MyOrders isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/my-reviews" element={<MyReviews isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/notifications" element={<Notifications isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/register" element={<Register onRegister={handleLogin} />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/new-password" element={<NewPassword />} />
            <Route path="/terms" element={<TermsOfService isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/privacy" element={<PrivacyPolicy isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/offer-agreement" element={<OfferAgreement isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
                </Suspense>
        </BrowserRouter>
            </OffersProvider>
          </DistrictProvider>
        </TimezoneProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;