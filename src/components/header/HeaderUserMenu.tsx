import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Icon from '@/components/ui/icon';

interface User {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  userType?: string;
  companyName?: string;
}

interface HeaderUserMenuProps {
  isAuthenticated: boolean;
  currentUser: User | null;
  onLogout: () => void;
  shortenCompanyName: (name: string) => string;
  getUserDisplayName: () => string;
}

export default function HeaderUserMenu({
  isAuthenticated,
  currentUser,
  onLogout,
  shortenCompanyName,
  getUserDisplayName
}: HeaderUserMenuProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <Button onClick={() => navigate('/login')} className="h-8 md:h-10 px-3 md:px-5 text-[10px] md:text-sm">
        Вход/Регистрация
      </Button>
    );
  }

  return (
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
        <DropdownMenuItem onClick={() => navigate('/profile')} className="border-2 border-border rounded-md mb-1">
          <Icon name="User" className="mr-2 h-4 w-4" />
          Мои данные
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/my-auctions')} className="border-2 border-border rounded-md mb-1">
          <Icon name="Gavel" className="mr-2 h-4 w-4" />
          Мои аукционы
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/my-reviews')} className="border-2 border-border rounded-md mb-1">
          <Icon name="Star" className="mr-2 h-4 w-4" />
          Мои отзывы
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/my-orders')} className="border-2 border-border rounded-md mb-1">
          <Icon name="ShoppingCart" className="mr-2 h-4 w-4" />
          Мои заказы
        </DropdownMenuItem>
        {currentUser?.role === 'admin' && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-semibold text-primary uppercase">
              Администрирование
            </div>
            <DropdownMenuItem onClick={() => navigate('/admin/panel')} className="border-2 border-border rounded-md mb-1">
              <Icon name="LayoutDashboard" className="mr-2 h-4 w-4" />
              Админ-панель
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/verifications')} className="border-2 border-border rounded-md mb-1">
              <Icon name="ShieldCheck" className="mr-2 h-4 w-4" />
              Верификация
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/users')} className="border-2 border-border rounded-md mb-1">
              <Icon name="Users" className="mr-2 h-4 w-4" />
              Пользователи
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/offers')} className="border-2 border-border rounded-md mb-1">
              <Icon name="Package" className="mr-2 h-4 w-4" />
              Предложения
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/requests')} className="border-2 border-border rounded-md mb-1">
              <Icon name="FileText" className="mr-2 h-4 w-4" />
              Запросы
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/auctions')} className="border-2 border-border rounded-md mb-1">
              <Icon name="Gavel" className="mr-2 h-4 w-4" />
              Аукционы
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/contracts')} className="border-2 border-border rounded-md mb-1">
              <Icon name="FileSignature" className="mr-2 h-4 w-4" />
              Контракты
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/analytics')} className="border-2 border-border rounded-md mb-1">
              <Icon name="TrendingUp" className="mr-2 h-4 w-4" />
              Аналитика
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/settings')} className="border-2 border-border rounded-md mb-1">
              <Icon name="Settings" className="mr-2 h-4 w-4" />
              Настройки
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive border-2 border-border rounded-md">
          <Icon name="LogOut" className="mr-2 h-4 w-4" />
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
