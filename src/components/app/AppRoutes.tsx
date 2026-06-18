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

const pageFallback = isFirstVisit
  ? <div style={{position:'fixed',inset:0,background:'#f1f4f8',zIndex:99999,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'28px'}}><div style={{width:96,height:96,borderRadius:24,overflow:'hidden',boxShadow:'0 16px 48px rgba(0,0,0,0.12)'}}><img src="https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/bucket/4bbf8889-8425-4a91-bebb-1e4aaa060042.png" alt="ЕРТТП" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} /></div><span style={{fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',fontSize:'clamp(24px,7vw,42px)',fontWeight:900,color:'#1e293b',letterSpacing:'0.12em',textAlign:'center',padding:'0 24px'}}>С НАМИ УСПЕХ</span></div>
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
            <Route path="/set-admin-password" element={<P.SetAdminPassword />} />
            <Route path="/contract/:id" element={<P.ContractDetail {...auth} />} />
            <Route path="/create-contract" element={<P.CreateContract {...auth} />} />
            <Route path="/edit-contract/:id" element={<P.EditContract {...auth} />} />
            <Route path="/my-contracts" element={<P.MyContracts {...auth} />} />
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
            <Route path="/mosquito-repellent" element={<ProtectedRoute isAuthenticated={isAuthenticated}><P.MosquitoRepellent /></ProtectedRoute>} />
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