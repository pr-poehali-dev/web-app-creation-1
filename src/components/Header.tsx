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
interface HeaderProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function Header({ isAuthenticated, onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(getSession());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { selectedDistricts, districts, toggleDistrict } = useDistrict();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  
  const shouldShowDistricts = () => {
    const hiddenPaths = ['/', '/about', '/support'];
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
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-14 md:h-18 items-center justify-between">
          <Link 
            to="/" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center space-x-1.5 md:space-x-2.5 px-1.5 md:px-3 py-0.5 md:py-1 rounded-md md:rounded-lg border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all mr-2 md:mr-3"
          >
            <div className="flex h-8 w-8 md:h-11 md:w-11 items-center justify-center rounded-md md:rounded-lg bg-primary">
              <Icon name="Building2" className="h-4 w-4 md:h-7 md:w-7 text-white" />
            </div>
            <span className="text-base md:text-2xl font-bold text-primary whitespace-nowrap">ЕРТТП</span>
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden px-3 py-2 text-sm font-bold text-primary uppercase"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? "Закрыть" : "Меню"}
          </button>

          <nav className="hidden md:flex items-center space-x-2 lg:space-x-3 mr-3 lg:mr-4">
            <Link
              to="/predlozheniya"
              className="text-xs lg:text-sm font-medium text-foreground transition-colors hover:text-primary hover:bg-primary/5 px-2 lg:px-3 py-1.5 rounded-md border-2 border-primary/20 hover:border-primary/40"
            >
              Предложения
            </Link>
            <Link
              to="/zaprosy"
              className="text-xs lg:text-sm font-medium text-foreground transition-colors hover:text-primary hover:bg-primary/5 px-2 lg:px-3 py-1.5 rounded-md border-2 border-primary/20 hover:border-primary/40"
            >
              Запросы
            </Link>
            <Link
              to="/auction"
              className="text-xs lg:text-sm font-medium text-foreground transition-colors hover:text-primary hover:bg-primary/5 px-2 lg:px-3 py-1.5 rounded-md border-2 border-primary/20 hover:border-primary/40"
            >
              Аукционы
            </Link>
            <Link
              to="/trading"
              className="text-xs lg:text-sm font-medium text-foreground transition-colors hover:text-primary hover:bg-primary/5 px-2 lg:px-3 py-1.5 rounded-md border-2 border-primary/20 hover:border-primary/40"
            >
              <span className="flex items-center gap-1">
                Контракты
                <Badge variant="secondary" className="text-[10px] lg:text-xs px-1.5 py-0.5">Новое</Badge>
              </span>
            </Link>
            <Link
              to="/about"
              className="text-xs lg:text-sm font-medium text-foreground transition-colors hover:text-primary hover:bg-primary/5 px-2 lg:px-3 py-1.5 rounded-md border-2 border-primary/20 hover:border-primary/40 whitespace-nowrap"
            >
              О&nbsp;площадке
            </Link>
            <Link
              to="/support"
              className="text-xs lg:text-sm font-medium text-foreground transition-colors hover:text-primary hover:bg-primary/5 px-2 lg:px-3 py-1.5 rounded-md border-2 border-primary/20 hover:border-primary/40"
            >
              Поддержка
            </Link>
          </nav>

          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="hidden md:block w-40 lg:w-52">
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
                  <DropdownMenuItem onClick={() => navigate('/my-offers')}>
                    <Icon name="Package" className="mr-2 h-4 w-4" />
                    Мои предложения
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-requests')}>
                    <Icon name="FileText" className="mr-2 h-4 w-4" />
                    Мои запросы
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-auctions')}>
                    <Icon name="Gavel" className="mr-2 h-4 w-4" />
                    Мои аукционы
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-reviews')}>
                    <Icon name="Star" className="mr-2 h-4 w-4" />
                    Мои отзывы
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/active-orders')}>
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
              <Button onClick={() => navigate('/login')} className="h-8 md:h-10 px-3 md:px-5 text-[10px] md:text-sm">Авторизация</Button>
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
              to="/about"
              className="block mx-4 px-3 py-2 text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary rounded-md border-2 border-primary/20 hover:border-primary/40 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              О площадке
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