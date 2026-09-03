import { Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { SmartCache } from "@/utils/smartCache";
import * as P from "@/lazyPages";

interface RouteProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

function ProtectedRoute({ isAuthenticated, children }: { isAuthenticated: boolean; children: React.ReactNode }) {
  const location = useLocation();
  if (!isAuthenticated) {
    localStorage.setItem('returnUrl', location.pathname + location.search);
    return <Navigate to="/login" state={{ returnUrl: location.pathname + location.search }} replace />;
  }
  return <>{children}</>;
}

function RouteChangeInvalidator() {
  const location = useLocation();
  const prevPath = useRef<string>('');
  useEffect(() => {
    const prev = prevPath.current;
    prevPath.current = location.pathname;
    if (location.pathname === '/' && prev.startsWith('/offer')) {
      SmartCache.invalidate('offers_list');
    }
  }, [location.pathname]);
  return null;
}

const isFirstVisit = !sessionStorage.getItem('app_visited');
if (isFirstVisit) sessionStorage.setItem('app_visited', '1');

const SPLASH_LOGO_BASE64 = "data:image/png;base64,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";

const pageFallback = isFirstVisit
  ? <div style={{position:'fixed',inset:0,background:'#f1f4f8',zIndex:99999,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'28px'}}><div style={{width:96,height:96,borderRadius:24,overflow:'hidden',boxShadow:'0 16px 48px rgba(0,0,0,0.12)'}}><img src={SPLASH_LOGO_BASE64} alt="ЕРТТП" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} /></div><span style={{fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',fontSize:'clamp(24px,7vw,42px)',fontWeight:900,color:'#1e293b',letterSpacing:'0.12em',textAlign:'center',padding:'0 24px'}}>С НАМИ УСПЕХ</span></div>
  : <div style={{position:'fixed',inset:0,background:'rgba(241,244,248,0.85)',backdropFilter:'blur(4px)',zIndex:99999,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'16px'}}><div style={{width:40,height:40,border:'4px solid #e2e8f0',borderTopColor:'#3b82f6',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} /><span style={{fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',fontSize:'16px',fontWeight:600,color:'#475569'}}>Данные загружаются</span><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

export default function AppRoutes({ isAuthenticated, onLogin, onLogout }: RouteProps) {
  const auth = { isAuthenticated, onLogout };
  return (
    <>
      <RouteChangeInvalidator />
      <ErrorBoundary>
        <Suspense fallback={pageFallback}>
          <Routes>
            <Route path="/" element={<P.Offers {...auth} />} />
            <Route path="/contracts" element={<Navigate to="/" replace />} />
            <Route path="/home" element={<P.Home {...auth} />} />
            <Route path="/predlozheniya" element={<Navigate to="/" replace />} />
            <Route path="/trading" element={<P.TradingPlatform {...auth} />} />
            <Route path="/login" element={<P.Login onLogin={onLogin} />} />
            <Route path="/search" element={<P.SearchResults {...auth} />} />
            <Route path="/offer/:id" element={<P.OfferDetail {...auth} />} />
            <Route path="/edit-offer/:id" element={<P.EditOffer {...auth} />} />
            <Route path="/zaprosy" element={<P.Requests {...auth} />} />
            <Route path="/request/:id" element={<P.RequestDetail {...auth} />} />
            <Route path="/edit-request/:id" element={<P.EditRequest {...auth} />} />
            <Route path="/auction" element={<P.Auctions {...auth} />} />
            <Route path="/auction/:id" element={<P.AuctionDetail {...auth} />} />
            <Route path="/support" element={<P.Support {...auth} />} />
            <Route path="/clear-data" element={<P.ClearData {...auth} />} />
            <Route path="/delete-test-data" element={<P.DeleteTestData />} />
            <Route path="/migrate-images" element={<P.MigrateImages {...auth} />} />
            <Route path="/profile" element={<P.Profile {...auth} />} />
            <Route path="/verification" element={<P.VerificationPage />} />
            <Route path="/verification/resubmit" element={<P.VerificationResubmit {...auth} />} />
            <Route path="/admin" element={<P.AdminLogin />} />
            <Route path="/admin/panel" element={<P.AdminPanel {...auth} />} />
            <Route path="/admin/dashboard" element={<P.AdminDashboard {...auth} />} />
            <Route path="/admin/users" element={<P.AdminUsers {...auth} />} />
            <Route path="/admin/deleted-users" element={<P.AdminDeletedUsers {...auth} />} />
            <Route path="/admin/offers" element={<P.AdminOffers {...auth} />} />
            <Route path="/admin/requests" element={<P.AdminRequests {...auth} />} />
            <Route path="/admin/auctions" element={<P.AdminAuctions {...auth} />} />
            <Route path="/admin/contracts" element={<P.AdminContracts {...auth} />} />
            <Route path="/admin/reviews" element={<P.AdminReviews {...auth} />} />
            <Route path="/admin/orders" element={<P.AdminOrders {...auth} />} />
            <Route path="/admin/analytics" element={<P.AdminAnalytics {...auth} />} />
            <Route path="/admin/settings" element={<P.AdminSettings {...auth} />} />
            <Route path="/admin/manage-admins" element={<P.AdminManageAdmins {...auth} />} />
            <Route path="/admin/verifications" element={<P.AdminVerifications {...auth} />} />
            <Route path="/admin/change-password" element={<P.AdminChangePassword />} />
            <Route path="/admin/content" element={<P.AdminContentManagement />} />
            <Route path="/admin/arbitrage" element={<P.AdminArbitrage {...auth} />} />
            <Route path="/admin/support" element={<P.AdminSupport {...auth} />} />
            <Route path="/admin/subscriptions" element={<P.AdminSubscriptions {...auth} />} />
            <Route path="/admin/market-reviews" element={<P.AdminMarketReviews {...auth} />} />
            <Route path="/set-admin-password" element={<P.SetAdminPassword />} />
            <Route path="/contract/:id" element={<P.ContractDetail {...auth} />} />
            <Route path="/create-contract" element={<P.CreateContract {...auth} />} />
            <Route path="/edit-contract/:id" element={<P.EditContract {...auth} />} />
            <Route path="/my-contracts" element={<P.MyContracts {...auth} />} />
            <Route path="/market" element={<P.Market {...auth} />} />
            <Route path="/order/:offerId" element={<P.OrderPage {...auth} />} />
            <Route path="/my-listings" element={<P.MyListings {...auth} />} />
            <Route path="/my-offers" element={<P.MyOffers {...auth} />} />
            <Route path="/my-requests" element={<P.MyRequests {...auth} />} />
            <Route path="/my-auto-sales" element={<P.MyAutoSales {...auth} />} />
            <Route path="/my-auto-requests" element={<P.MyAutoRequests {...auth} />} />
            <Route path="/create-offer" element={<P.CreateOffer {...auth} />} />
            <Route path="/create-request" element={<P.CreateRequest {...auth} />} />
            <Route path="/my-auctions" element={<P.MyAuctions {...auth} />} />
            <Route path="/create-auction" element={<P.CreateAuction {...auth} />} />
            <Route path="/edit-auction/:id" element={<P.EditAuction {...auth} />} />
            <Route path="/active-orders" element={<P.ActiveOrders {...auth} />} />
            <Route path="/my-orders" element={<P.MyOrders {...auth} />} />
            <Route path="/my-reviews" element={<P.MyReviews {...auth} />} />
            <Route path="/brain-booster" element={<ProtectedRoute isAuthenticated={isAuthenticated}><P.BrainBooster /></ProtectedRoute>} />
            <Route path="/tax-reports" element={<P.TaxReports />} />
            <Route path="/seller/:userId" element={<P.SellerReviews {...auth} />} />
            <Route path="/register" element={<P.Register onRegister={onLogin} />} />
            <Route path="/reset-password" element={<P.ResetPassword />} />
            <Route path="/new-password" element={<P.NewPassword />} />
            <Route path="/verify-email" element={<P.VerifyEmail />} />
            <Route path="/verify-phone" element={<P.VerifyPhone />} />
            <Route path="/terms" element={<P.TermsOfService {...auth} />} />
            <Route path="/privacy" element={<P.PrivacyPolicy {...auth} />} />
            <Route path="/offer-agreement" element={<P.OfferAgreement {...auth} />} />
            <Route path="/image-editor" element={<P.ImageEditor />} />
            <Route path="/s/:code" element={<P.ShortUrlRedirect />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<P.NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}