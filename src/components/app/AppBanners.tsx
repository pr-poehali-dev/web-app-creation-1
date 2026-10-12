import NotificationPermissionBanner from "@/components/NotificationPermissionBanner";
import TechnicalIssuesBanner from "@/components/TechnicalIssuesBanner";
import InstallPrompt from "@/components/InstallPrompt";
import OnlineInviteBanner from "@/components/OnlineInviteBanner";
import BannerStrip from "@/components/BannerStrip";
import LocationToast from "@/components/LocationToast";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useLocation } from "react-router-dom";
import TopLoadingBar from "@/components/TopLoadingBar";

interface AppBannersProps {
  isAuthenticated: boolean;
}

export default function AppBanners({ isAuthenticated }: AppBannersProps) {
  const isGames = useLocation().pathname.startsWith("/games");
  return (
    <>
      <TopLoadingBar />
      <Toaster />
      <Sonner />
      <TechnicalIssuesBanner />
      {!isGames && <BannerStrip />}
      {!isGames && isAuthenticated && <NotificationPermissionBanner />}
      {!isGames && isAuthenticated && (
        <OnlineInviteBanner
          onOpenOrderChat={(orderId) => {
            const dispatch = () => window.dispatchEvent(
              new CustomEvent('openOrderChatById', { detail: { orderId: String(orderId) } })
            );
            if (window.location.pathname === '/my-orders') {
              dispatch();
            } else {
              window.location.href = `/my-orders?orderId=${orderId}`;
            }
          }}
        />
      )}
      {!isGames && <LocationToast />}
      {!isGames && <InstallPrompt />}
    </>
  );
}
