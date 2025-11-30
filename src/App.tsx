
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
import SearchResults from "./pages/SearchResults";
import OfferDetail from "./pages/OfferDetail";
import LocationDetectionDialog from "./components/LocationDetectionDialog";
import { getLocationFromStorage, type LocationData } from "./utils/geolocation";
import { DistrictProvider } from "./contexts/DistrictContext";
import { getSession, clearSession } from "./utils/auth";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(getLocationFromStorage());

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

  const handleLocationDetected = (location: LocationData) => {
    setUserLocation(location);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DistrictProvider>
          <Toaster />
          <Sonner />
          <LocationDetectionDialog onLocationDetected={handleLocationDetected} />
          <BrowserRouter>
            <Routes>
            <Route path="/" element={<Home isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/search" element={<SearchResults isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/predlozheniya" element={<Offers isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/offer/:id" element={<OfferDetail isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/zaprosy" element={<Requests isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/auction" element={<Auctions isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
            <Route path="/about" element={<NotFound />} />
            <Route path="/support" element={<NotFound />} />
            <Route path="/profile" element={<NotFound />} />
            <Route path="/my-offers" element={<NotFound />} />
            <Route path="/my-requests" element={<NotFound />} />
            <Route path="/my-auctions" element={<NotFound />} />
            <Route path="/active-orders" element={<NotFound />} />
            <Route path="/notifications" element={<NotFound />} />
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