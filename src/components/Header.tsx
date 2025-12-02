import { Link, useNavigate } from 'react-router-dom';
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
  const [currentUser, setCurrentUser] = useState(getSession());
  const { selectedDistricts, districts, toggleDistrict } = useDistrict();

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

  const getUserDisplayName = () => {
    if (!currentUser) return 'Личный кабинет';
    return `${currentUser.firstName} ${currentUser.lastName}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2 transition-opacity hover:opacity-80">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Icon name="Building2" className="h-6 w-6 text-white" />
          </div>
          <span className="text-lg font-bold text-primary">Единая Региональная Торговая Площадка</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
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
            to="/about"
            className="text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            О площадке
          </Link>
          <Link
            to="/support"
            className="text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            Поддержка
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <div className="hidden md:block w-64">
            <RegionDistrictSelector showBadges={false} />
          </div>
          
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Icon name="User" className="h-4 w-4" />
                  <span className="max-w-[150px] truncate">{getUserDisplayName()}</span>
                  <Icon name="ChevronDown" className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {currentUser && (
                  <>
                    <div className="px-2 py-1.5 text-sm font-medium">
                      {currentUser.firstName} {currentUser.lastName}
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
            <Button onClick={() => navigate('/login')}>Авторизация</Button>
          )}
        </div>
      </div>
      
      {selectedDistricts.length > 0 && (
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Выбранные регионы:</span>
              {selectedDistricts.map((districtId) => {
                const district = districts.find(d => d.id === districtId);
                return (
                  <Badge
                    key={districtId}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => toggleDistrict(districtId)}
                  >
                    {district?.name}
                    <Icon name="X" className="ml-1 h-3 w-3" />
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}