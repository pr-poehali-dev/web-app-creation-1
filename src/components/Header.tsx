import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import RegionDistrictSelector from '@/components/RegionDistrictSelector';
import { useDistrict } from '@/contexts/DistrictContext';
import { getSession } from '@/utils/auth';
import { useOffers } from '@/contexts/OffersContext';
import { getUnreadCount } from '@/utils/notifications';
import HeaderMobileMenu from '@/components/header/HeaderMobileMenu';
import HeaderRegionModal from '@/components/header/HeaderRegionModal';
import HeaderUserMenu from '@/components/header/HeaderUserMenu';

interface HeaderProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function Header({ isAuthenticated, onLogout }: HeaderProps) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(getSession());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [regionModalOpen, setRegionModalOpen] = useState(false);
  const [listingsCount, setListingsCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { selectedDistricts, districts, toggleDistrict, setSelectedDistricts, detectedCity } = useDistrict();
  const { offers, requests } = useOffers();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  
  const shouldShowDistricts = () => {
    const hiddenPaths = ['/', '/support'];
    return !hiddenPaths.includes(location.pathname);
  };

  useEffect(() => {
    const handleSessionChange = () => {
      setCurrentUser(getSession());
    };
    
    window.addEventListener('userSessionChanged', handleSessionChange);
    return () => window.removeEventListener('userSessionChanged', handleSessionChange);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    const fetchCounts = async () => {
      try {
        const userListings = [...offers, ...requests].filter(
          item => item.userId === currentUser.id
        );
        setListingsCount(userListings.length);

        const storedOrders = localStorage.getItem('orders');
        if (storedOrders) {
          const ordersData = JSON.parse(storedOrders);
          const userOrders = ordersData.filter(
            (order: any) => order.buyerId === currentUser.id?.toString() || order.sellerId === currentUser.id?.toString()
          );
          setOrdersCount(userOrders.length);
        }

        const notifCount = getUnreadCount(currentUser.id?.toString());
        setUnreadNotifications(notifCount);
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };

    fetchCounts();
    
    const interval = setInterval(() => {
      if (document.hidden) return;
      
      const notifCount = getUnreadCount(currentUser.id?.toString());
      setUnreadNotifications(notifCount);
    }, 30000);

    const handleNotificationUpdate = () => {
      const notifCount = getUnreadCount(currentUser.id?.toString());
      setUnreadNotifications(notifCount);
    };

    window.addEventListener('newNotification', handleNotificationUpdate);
    window.addEventListener('notificationsUpdated', handleNotificationUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('newNotification', handleNotificationUpdate);
      window.removeEventListener('notificationsUpdated', handleNotificationUpdate);
    };
  }, [isAuthenticated, currentUser, offers, requests]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchEndY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndY.current = e.touches[0].clientY;
      const swipeDistance = touchStartY.current - touchEndY.current;
      
      if (swipeDistance > 5) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      const swipeDistance = touchStartY.current - touchEndY.current;
      
      if (swipeDistance > 30) {
        setMobileMenuOpen(false);
      }
      
      touchStartY.current = 0;
      touchEndY.current = 0;
    };

    const menuElement = mobileMenuRef.current;
    if (mobileMenuOpen && menuElement) {
      menuElement.addEventListener('touchstart', handleTouchStart, { passive: true });
      menuElement.addEventListener('touchmove', handleTouchMove, { passive: false });
      menuElement.addEventListener('touchend', handleTouchEnd, { passive: true });
      
      return () => {
        menuElement.removeEventListener('touchstart', handleTouchStart);
        menuElement.removeEventListener('touchmove', handleTouchMove);
        menuElement.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [mobileMenuOpen]);

  const shortenCompanyName = (fullName: string): string => {
    if (!fullName) return fullName;
    
    let shortened = fullName.trim();
    
    shortened = shortened.replace(/ОБЩЕСТВО\s+С\s+ОГРАНИЧЕННОЙ\s+ОТВЕТСТВЕННОСТЬЮ\s*/gi, 'ООО ');
    shortened = shortened.replace(/Общество\s+с\s+ограниченной\s+ответственностью\s*/gi, 'ООО ');
    shortened = shortened.replace(/ЗАКРЫТОЕ\s+АКЦИОНЕРНОЕ\s+ОБЩЕСТВО\s*/gi, 'ЗАО ');
    shortened = shortened.replace(/Закрытое\s+акционерное\s+общество\s*/gi, 'ЗАО ');
    shortened = shortened.replace(/ОТКРЫТОЕ\s+АКЦИОНЕРНОЕ\s+ОБЩЕСТВО\s*/gi, 'ОАО ');
    shortened = shortened.replace(/Открытое\s+акционерное\s+общество\s*/gi, 'ОАО ');
    shortened = shortened.replace(/ПУБЛИЧНОЕ\s+АКЦИОНЕРНОЕ\s+ОБЩЕСТВО\s*/gi, 'ПАО ');
    shortened = shortened.replace(/Публичное\s+акционерное\s+общество\s*/gi, 'ПАО ');
    shortened = shortened.replace(/АКЦИОНЕРНОЕ\s+ОБЩЕСТВО\s*/gi, 'АО ');
    shortened = shortened.replace(/Акционерное\s+общество\s*/gi, 'АО ');
    shortened = shortened.replace(/ИНДИВИДУАЛЬНЫЙ\s+ПРЕДПРИНИМАТЕЛЬ\s*/gi, 'ИП ');
    shortened = shortened.replace(/Индивидуальный\s+предприниматель\s*/gi, 'ИП ');
    
    return shortened.trim();
  };

  const getUserDisplayName = () => {
    if (!currentUser) return 'Личный кабинет';
    
    if (currentUser.userType === 'legal-entity') {
      return shortenCompanyName(currentUser.companyName || 'Организация');
    }
    
    return `${currentUser.firstName} ${currentUser.lastName}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-br from-white via-blue-100/60 to-purple-100/50 dark:from-gray-900 dark:via-blue-900/40 dark:to-purple-900/30 shadow-lg backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-14 md:h-18 items-center justify-between">
          <Link 
            to="/home" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center space-x-1.5 md:space-x-2.5 px-1.5 md:px-3 py-0.5 md:py-1 rounded-md md:rounded-lg border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all mr-2 md:mr-3"
          >
            <div className="h-9 w-9 md:h-12 md:w-12 overflow-hidden rounded-md md:rounded-lg flex items-center justify-center">
              <img 
                src="https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/bucket/4bbf8889-8425-4a91-bebb-1e4aaa060042.png" 
                alt="ЕРТТП" 
                className="h-full w-full brightness-125 contrast-125"
                style={{ filter: 'brightness(1.3) contrast(1.3) drop-shadow(0 0 2px white) drop-shadow(0 0 4px white) drop-shadow(0 0 8px rgba(255,255,255,0.7))', transform: 'scale(1.9) scaleX(-1)' }}
              />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[11px] md:text-base font-bold text-primary whitespace-nowrap leading-tight">ЕРТТП</span>
              <span className="text-[10.5px] md:text-[15px] text-primary/70 whitespace-nowrap leading-tight font-bold">О нас</span>
            </div>
          </Link>

          {/* Mobile buttons */}
          <div className="md:hidden flex items-center gap-2">
            {shouldShowDistricts() && (
              <button
                className="flex flex-col items-start px-2 py-1 text-xs border-2 border-primary/20 rounded-md hover:border-primary/40 transition-colors min-w-0 flex-1 max-w-[180px]"
                onClick={() => setRegionModalOpen(true)}
              >
                <div className="flex items-center gap-1 w-full">
                  <Icon name="MapPin" className="h-3 w-3 text-primary shrink-0" />
                  <span className="font-bold text-primary truncate text-[10px] leading-tight">
                    {(() => {
                      if (selectedDistricts.length === 0) return 'Все районы';
                      if (selectedDistricts.length === districts.length) return 'Все районы';
                      if (selectedDistricts.length === 1) {
                        const district = districts.find(d => d.id === selectedDistricts[0]);
                        return district?.name || 'Район';
                      }
                      return `${selectedDistricts.length} район${selectedDistricts.length < 5 ? 'а' : 'ов'}`;
                    })()}
                  </span>
                </div>
                <span className="text-[10px] leading-tight text-primary/70 font-bold truncate w-full">
                  {detectedCity && detectedCity !== 'Не определен' ? detectedCity : 'Якутия'}
                </span>
              </button>
            )}
            <button
              className="px-3 py-2 text-sm font-bold text-primary uppercase border-2 border-primary/20 rounded-md hover:border-primary/40 transition-colors shrink-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? "Закрыть" : "Меню"}
            </button>
          </div>

          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 mr-1.5 lg:mr-3">
            <Link
              to="/predlozheniya"
              className={`text-[11px] lg:text-sm font-medium transition-colors px-1.5 lg:px-2.5 py-1.5 rounded-md border-2 whitespace-nowrap ${location.pathname === '/predlozheniya' || location.pathname === '/' ? 'bg-primary/10 text-primary border-primary/40' : 'text-foreground hover:text-primary hover:bg-primary/5 border-primary/20 hover:border-primary/40'}`}
            >
              Предложения
            </Link>
            <Link
              to="/zaprosy"
              className={`text-[11px] lg:text-sm font-medium transition-colors px-1.5 lg:px-2.5 py-1.5 rounded-md border-2 whitespace-nowrap ${location.pathname === '/zaprosy' ? 'bg-primary/10 text-primary border-primary/40' : 'text-foreground hover:text-primary hover:bg-primary/5 border-primary/20 hover:border-primary/40'}`}
            >
              Запросы
            </Link>
            <Link
              to="/auction"
              className={`text-[11px] lg:text-sm font-medium transition-colors px-1.5 lg:px-2.5 py-1.5 rounded-md border-2 whitespace-nowrap ${location.pathname === '/auction' ? 'bg-primary/10 text-primary border-primary/40' : 'text-foreground hover:text-primary hover:bg-primary/5 border-primary/20 hover:border-primary/40'}`}
            >
              Аукционы
            </Link>
            <Link
              to="/trading"
              className={`text-[11px] lg:text-sm font-medium transition-colors px-1.5 lg:px-2.5 py-1.5 rounded-md border-2 whitespace-nowrap ${location.pathname === '/trading' ? 'bg-primary/10 text-primary border-primary/40' : 'text-foreground hover:text-primary hover:bg-primary/5 border-primary/20 hover:border-primary/40'}`}
            >
              <span className="flex items-center gap-1">
                Контракты
                <Badge variant="secondary" className="text-[9px] lg:text-xs px-1 lg:px-1.5 py-0.5">Новое</Badge>
              </span>
            </Link>
            <Link
              to="/support"
              className={`text-[11px] lg:text-sm font-medium transition-colors px-1.5 lg:px-2.5 py-1.5 rounded-md border-2 whitespace-nowrap ${location.pathname === '/support' ? 'bg-primary/10 text-primary border-primary/40' : 'text-foreground hover:text-primary hover:bg-primary/5 border-primary/20 hover:border-primary/40'}`}
            >
              Поддержка
            </Link>
          </nav>

          <div className="flex items-center space-x-1.5 md:space-x-2">
            <div className="hidden md:block w-44 lg:w-60">
              <RegionDistrictSelector showBadges={false} />
            </div>
            
            <HeaderUserMenu
              isAuthenticated={isAuthenticated}
              currentUser={currentUser}
              onLogout={onLogout}
              shortenCompanyName={shortenCompanyName}
              getUserDisplayName={getUserDisplayName}
            />
          </div>
        </div>

        <HeaderMobileMenu
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          currentPath={location.pathname}
          menuRef={mobileMenuRef}
        />

        {selectedDistricts.length > 0 && shouldShowDistricts() && (
          <div className="hidden md:block border-t py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <span className="text-xs text-foreground font-bold">Выбранные районы:</span>
                {selectedDistricts.length === districts.length && districts.length > 0 ? (
                  <Badge
                    variant="default"
                    className="cursor-pointer hover:bg-primary/80 transition-colors text-xs"
                    onClick={() => setSelectedDistricts([])}
                  >
                    Выбраны все районы
                    <Icon name="X" className="ml-1 h-3 w-3" />
                  </Badge>
                ) : (
                  <>
                    {selectedDistricts.slice(0, 3).map((districtId) => {
                      const district = districts.find(d => d.id === districtId);
                      return (
                        <Badge
                          key={districtId}
                          variant="secondary"
                          className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors text-xs"
                          onClick={() => toggleDistrict(districtId)}
                        >
                          {district?.name}
                          <Icon name="X" className="ml-1 h-3 w-3" />
                        </Badge>
                      );
                    })}
                    {selectedDistricts.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{selectedDistricts.length - 3} ещё
                      </Badge>
                    )}
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDistricts([])}
                className="shrink-0 h-7 text-xs text-muted-foreground hover:text-destructive"
              >
                <Icon name="X" className="h-3 w-3 mr-1" />
                Сбросить
              </Button>
            </div>
          </div>
        )}

        <HeaderRegionModal
          isOpen={regionModalOpen}
          onClose={() => setRegionModalOpen(false)}
        />
      </div>
    </header>
  );
}