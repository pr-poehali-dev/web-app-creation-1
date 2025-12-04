
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import NewPassword from "./pages/NewPassword";
import NotFound from "./pages/NotFound";
import Offers from "./pages/Offers";
import Requests from "./pages/Requests";
import Auctions from "./pages/Auctions";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import MyOffers from "./pages/MyOffers";
import MyRequests from "./pages/MyRequests";
import MyAuctions from "./pages/MyAuctions";
import ActiveOrders from "./pages/ActiveOrders";
import Notifications from "./pages/Notifications";
import SearchResults from "./pages/SearchResults";
import OfferDetail from "./pages/OfferDetail";
import RequestDetail from "./pages/RequestDetail";
import CreateOffer from "./pages/CreateOffer";
import CreateRequest from "./pages/CreateRequest";
import VerificationPage from "./pages/VerificationPage";
import AdminVerifications from "./pages/AdminVerifications";
import AdminLogin from "./pages/AdminLogin";
import AdminChangePassword from "./pages/AdminChangePassword";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminOffers from "./pages/AdminOffers";
import AdminRequests from "./pages/AdminRequests";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminSettings from "./pages/AdminSettings";
import AdminAuctions from "./pages/AdminAuctions";
import AdminContracts from "./pages/AdminContracts";
import AdminReviews from "./pages/AdminReviews";
import AdminManageAdmins from "./pages/AdminManageAdmins";
import TradingPlatform from "./pages/TradingPlatform";
import CreateContract from "./pages/CreateContract";
import LocationDetectionDialog from "./components/LocationDetectionDialog";
import { DistrictProvider } from "./contexts/DistrictContext";
import { getSession, clearSession } from "./utils/auth";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (session) {
      setIsAuthenticated(true);
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
        <DistrictProvider>
          <Toaster />
          <Sonner />
          <LocationDetectionDialog />
          <BrowserRouter>
            <Routes>
            <Route path="/" element={<Home isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/search" element={<SearchResults isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/predlozheniya" element={<Offers isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/offer/:id" element={<OfferDetail isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/zaprosy" element={<Requests isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/request/:id" element={<RequestDetail isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/auction" element={<Auctions isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/about" element={<NotFound />} />
            <Route path="/support" element={<NotFound />} />
            <Route path="/profile" element={<Profile isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/verification" element={<VerificationPage />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin/users" element={<AdminUsers isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin/offers" element={<AdminOffers isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin/requests" element={<AdminRequests isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin/auctions" element={<AdminAuctions isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin/contracts" element={<AdminContracts isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin/reviews" element={<AdminReviews isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin/analytics" element={<AdminAnalytics isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin/settings" element={<AdminSettings isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin/manage-admins" element={<AdminManageAdmins isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin/verifications" element={<AdminVerifications isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/admin/change-password" element={<AdminChangePassword />} />
            <Route path="/trading" element={<TradingPlatform isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/create-contract" element={<CreateContract isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/my-offers" element={<MyOffers isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/create-offer" element={<CreateOffer isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/my-requests" element={<MyRequests isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/create-request" element={<CreateRequest isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/my-auctions" element={<MyAuctions isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/active-orders" element={<ActiveOrders isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/notifications" element={<Notifications isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/register" element={<Register onRegister={handleLogin} />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/new-password" element={<NewPassword />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </DistrictProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;