import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
  const { selectedDistricts, districts, toggleDistrict } = useDistrict();
  
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
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 px-2 py-1.5 rounded-lg border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all mr-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Icon name="Building2" className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-primary whitespace-nowrap">ЕРТП</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 mr-6">
            <Link
              to="/predlozheniya"
              className="text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              Предложения
            </Link>
            <Link
              to="/zaprosy"
              className="text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              Запросы
            </Link>
            <Link
              to="/auction"
              className="text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              Аукцион
            </Link>
            <Link
              to="/trading"
              className="text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              <span className="flex items-center gap-1">
                Контракты
                <Badge variant="secondary" className="text-xs">Новое</Badge>
              </span>
            </Link>
            <Link
              to="/about"
              className="text-sm font-medium text-foreground transition-colors hover:text-primary whitespace-nowrap"
            >
              О&nbsp;площадке
            </Link>
            <Link
              to="/support"
              className="text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              Поддержка
            </Link>
          </nav>

          <div className="flex items-center space-x-3">
            <div className="hidden md:block w-48">
              <RegionDistrictSelector showBadges={false} />
            </div>
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-1.5 h-9 px-3">
                    {currentUser?.userType !== 'legal-entity' && <Icon name="User" className="h-3.5 w-3.5" />}
                    <span className={currentUser?.userType === 'legal-entity' ? 'max-w-[200px] truncate text-xs' : 'max-w-[120px] truncate text-xs'}>{getUserDisplayName()}</span>
                    <Icon name="ChevronDown" className="h-3.5 w-3.5" />
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
                  <DropdownMenuItem onClick={() => navigate('/active-orders')}>
                    <Icon name="ShoppingCart" className="mr-2 h-4 w-4" />
                    Активные заказы
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/notifications')}>
                    <Icon name="Bell" className="mr-2 h-4 w-4" />
                    Уведомления
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <Icon name="LogOut" className="mr-2 h-4 w-4" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => navigate('/login')} className="h-9 px-4 text-xs">Авторизация</Button>
            )}
          </div>
        </div>

        {selectedDistricts.length > 0 && shouldShowDistricts() && (
          <div className="border-t py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Выбранные районы:</span>
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