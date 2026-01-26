import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Icon from '@/components/ui/icon';
import RegionDistrictSelector from '@/components/RegionDistrictSelector';
import { useDistrict } from '@/contexts/DistrictContext';
import { getSession } from '@/utils/auth';
import { useOffers } from '@/contexts/OffersContext';
import { getUnreadCount } from '@/utils/notifications';
interface HeaderProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function Header({ isAuthenticated, onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(getSession());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [listingsCount, setListingsCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { selectedDistricts, districts, toggleDistrict } = useDistrict();
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
    
    // ⚡ ОПТИМИЗАЦИЯ: Увеличили интервал с 5 до 10 сек + проверка document.hidden
    const interval = setInterval(() => {
      if (document.hidden) return;
      
      const notifCount = getUnreadCount(currentUser.id?.toString());
      setUnreadNotifications(notifCount);
    }, 10000);

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
      
      // Блокируем прокрутку страницы только при свайпе вверх
      if (swipeDistance > 5) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      const swipeDistance = touchStartY.current - touchEndY.current;
      
      // Закрываем только если это свайп вверх больше 30px
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

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const shortenCompanyName = (fullName: string): string => {
    if (!fullName) return fullName;
    
    let shortened = fullName.trim();
    
    // Замены с учетом разных форматов
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
            <img 
              src="https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/bucket/4bbf8889-8425-4a91-bebb-1e4aaa060042.png" 
              alt="ЕРТТП" 
              className="h-9 w-9 md:h-12 md:w-12 rounded-md md:rounded-lg brightness-125 contrast-125" 
              style={{ filter: 'brightness(1.3) contrast(1.3) drop-shadow(0 0 2px white) drop-shadow(0 0 4px white) drop-shadow(0 0 8px rgba(255,255,255,0.7))' }}
            />
            <div className="flex flex-col items-start">
              <span className="text-[11px] md:text-base font-bold text-primary whitespace-nowrap leading-tight">ЕРТТП</span>
              <span className="text-[7px] md:text-[10px] text-primary/70 whitespace-nowrap leading-tight font-bold">О нас</span>
            </div>
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden px-3 py-2 text-sm font-bold text-primary uppercase border-2 border-primary/20 rounded-md hover:border-primary/40 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? "Закрыть" : "Меню"}
          </button>

          <nav className="hidden md:flex items-center space-x-1.5 lg:space-x-3 mr-2 lg:mr-4">
            <Link
              to="/predlozheniya"
              className={`text-[11px] lg:text-sm font-medium transition-colors px-2 lg:px-3 py-1.5 rounded-md border-2 whitespace-nowrap ${location.pathname === '/predlozheniya' || location.pathname === '/' ? 'bg-primary/10 text-primary border-primary/40' : 'text-foreground hover:text-primary hover:bg-primary/5 border-primary/20 hover:border-primary/40'}`}
            >
              Предложения
            </Link>
            <Link
              to="/zaprosy"
              className={`text-[11px] lg:text-sm font-medium transition-colors px-2 lg:px-3 py-1.5 rounded-md border-2 whitespace-nowrap ${location.pathname === '/zaprosy' ? 'bg-primary/10 text-primary border-primary/40' : 'text-foreground hover:text-primary hover:bg-primary/5 border-primary/20 hover:border-primary/40'}`}
            >
              Запросы
            </Link>
            <Link
              to="/auction"
              className={`text-[11px] lg:text-sm font-medium transition-colors px-2 lg:px-3 py-1.5 rounded-md border-2 whitespace-nowrap ${location.pathname === '/auction' ? 'bg-primary/10 text-primary border-primary/40' : 'text-foreground hover:text-primary hover:bg-primary/5 border-primary/20 hover:border-primary/40'}`}
            >
              Аукционы
            </Link>
            <Link
              to="/trading"
              className={`text-[11px] lg:text-sm font-medium transition-colors px-2 lg:px-3 py-1.5 rounded-md border-2 whitespace-nowrap ${location.pathname === '/trading' ? 'bg-primary/10 text-primary border-primary/40' : 'text-foreground hover:text-primary hover:bg-primary/5 border-primary/20 hover:border-primary/40'}`}
            >
              <span className="flex items-center gap-1">
                Контракты
                <Badge variant="secondary" className="text-[9px] lg:text-xs px-1 lg:px-1.5 py-0.5">Новое</Badge>
              </span>
            </Link>
            <Link
              to="/support"
              className={`text-[11px] lg:text-sm font-medium transition-colors px-2 lg:px-3 py-1.5 rounded-md border-2 whitespace-nowrap ${location.pathname === '/support' ? 'bg-primary/10 text-primary border-primary/40' : 'text-foreground hover:text-primary hover:bg-primary/5 border-primary/20 hover:border-primary/40'}`}
            >
              Поддержка
            </Link>
          </nav>

          <div className="flex items-center space-x-1.5 md:space-x-2">
            <div className="hidden md:block w-44 lg:w-60">
              <RegionDistrictSelector showBadges={false} />
            </div>
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-1 md:space-x-1.5 h-8 md:h-10 px-2 md:px-4 text-xs md:text-sm">
                    {currentUser?.role === 'admin' ? (
                      <>
                        <Icon name="ShieldCheck" className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                        <span className="max-w-[100px] lg:max-w-[160px] truncate text-[10px] md:text-sm font-semibold text-primary">Администратор</span>
                      </>
                    ) : (
                      <>
                        {currentUser?.userType !== 'legal-entity' && <Icon name="User" className="h-3 w-3 md:h-4 md:w-4" />}
                        <span className={currentUser?.userType === 'legal-entity' ? 'max-w-[150px] lg:max-w-[220px] truncate text-[10px] md:text-sm' : 'max-w-[80px] lg:max-w-[140px] truncate text-[10px] md:text-sm'}>{getUserDisplayName()}</span>
                      </>
                    )}
                    <Icon name="ChevronDown" className="h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {currentUser && (
                    <>
                      <div className="px-2 py-1.5 text-sm font-medium">
                        {currentUser.userType === 'legal-entity' && currentUser.companyName ? (
                          shortenCompanyName(currentUser.companyName)
                        ) : (
                          <>{currentUser.firstName} {currentUser.lastName}</>
                        )}
                      </div>
                      <div className="px-2 pb-2 text-xs text-muted-foreground">
                        {currentUser.email}
                      </div>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <Icon name="User" className="mr-2 h-4 w-4" />
                    Мои данные
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-auctions')}>
                    <Icon name="Gavel" className="mr-2 h-4 w-4" />
                    Мои аукционы
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-reviews')}>
                    <Icon name="Star" className="mr-2 h-4 w-4" />
                    Мои отзывы
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-orders')}>
                    <Icon name="ShoppingCart" className="mr-2 h-4 w-4" />
                    Мои заказы
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => navigate('/notifications')}>
                    <Icon name="Bell" className="mr-2 h-4 w-4" />
                    Уведомления
                  </DropdownMenuItem>
                  {currentUser?.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5 text-xs font-semibold text-primary uppercase">
                        Администрирование
                      </div>
                      <DropdownMenuItem onClick={() => navigate('/admin/panel')}>
                        <Icon name="LayoutDashboard" className="mr-2 h-4 w-4" />
                        Админ-панель
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/admin/verifications')}>
                        <Icon name="ShieldCheck" className="mr-2 h-4 w-4" />
                        Верификация
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/admin/users')}>
                        <Icon name="Users" className="mr-2 h-4 w-4" />
                        Пользователи
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/admin/offers')}>
                        <Icon name="Package" className="mr-2 h-4 w-4" />
                        Предложения
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/admin/requests')}>
                        <Icon name="FileText" className="mr-2 h-4 w-4" />
                        Запросы
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/admin/auctions')}>
                        <Icon name="Gavel" className="mr-2 h-4 w-4" />
                        Аукционы
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/admin/contracts')}>
                        <Icon name="FileSignature" className="mr-2 h-4 w-4" />
                        Контракты
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/admin/analytics')}>
                        <Icon name="TrendingUp" className="mr-2 h-4 w-4" />
                        Аналитика
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                        <Icon name="Settings" className="mr-2 h-4 w-4" />
                        Настройки
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <Icon name="LogOut" className="mr-2 h-4 w-4" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => navigate('/login')} className="h-8 md:h-10 px-3 md:px-5 text-[10px] md:text-sm">Вход/Регистрация</Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div 
            ref={mobileMenuRef}
            className="md:hidden border-t py-4 space-y-2 touch-pan-y"
          >
            <Link
              to="/predlozheniya"
              className="block mx-4 px-3 py-2 text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary rounded-md border-2 border-primary/20 hover:border-primary/40 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Предложения
            </Link>
            <Link
              to="/zaprosy"
              className="block mx-4 px-3 py-2 text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary rounded-md border-2 border-primary/20 hover:border-primary/40 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Запросы
            </Link>
            <Link
              to="/auction"
              className="block mx-4 px-3 py-2 text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary rounded-md border-2 border-primary/20 hover:border-primary/40 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Аукционы
            </Link>
            <Link
              to="/trading"
              className="block mx-4 px-3 py-2 text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary rounded-md border-2 border-primary/20 hover:border-primary/40 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="flex items-center gap-2">
                Контракты
                <Badge variant="secondary" className="text-xs">Новое</Badge>
              </span>
            </Link>
            <Link
              to="/support"
              className="block mx-4 px-3 py-2 text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary rounded-md border-2 border-primary/20 hover:border-primary/40 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Поддержка
            </Link>
            <div className="px-4 pt-2">
              <RegionDistrictSelector showBadges={false} />
            </div>
          </div>
        )}

        {selectedDistricts.length > 0 && shouldShowDistricts() && (
          <div className="border-t py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-foreground font-bold">Выбранные районы:</span>
              {selectedDistricts.map((districtId) => {
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
            </div>
          </div>
        )}
      </div>
    </header>
  );
}