
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import NewPassword from "./pages/NewPassword";
import NotFound from "./pages/NotFound";
import Offers from "./pages/Offers";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import OfferDetail from "./pages/OfferDetail";
import LocationDetectionDialog from "./components/LocationDetectionDialog";
import { getLocationFromStorage, type LocationData } from "./utils/geolocation";
import { DistrictProvider } from "./contexts/DistrictContext";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(getLocationFromStorage());

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
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
            <Route path="/requests" element={<NotFound />} />
            <Route path="/auction" element={<NotFound />} />
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