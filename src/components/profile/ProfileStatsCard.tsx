import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';

interface ProfileStatsCardProps {
  registrationDate: string;
  formatDate: (date: string) => string;
}

export default function ProfileStatsCard({ registrationDate, formatDate }: ProfileStatsCardProps) {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'admin' || userRole === 'moderator' || userRole === 'superadmin';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Статистика аккаунта</CardTitle>
        <CardDescription>Информация о вашей активности</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3 p-4 border rounded-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
              <Icon name="Calendar" className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Дата регистрации</p>
              <p className="font-semibold">{formatDate(registrationDate)}</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/predlozheniya')}
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
              <Icon name="Package" className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground">Активных предложений</p>
              <p className="font-semibold">2</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/zaprosy')}
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
              <Icon name="FileText" className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground">Активных запросов</p>
              <p className="font-semibold">1</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/auction')}
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
              <Icon name="Gavel" className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground">Участие в аукционах</p>
              <p className="font-semibold">3</p>
            </div>
          </button>
        </div>
        
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => navigate('/my-listings')} variant="outline" size="sm">
            <Icon name="LayoutList" className="mr-2 h-4 w-4" />
            Мои объявления
          </Button>
          <Button onClick={() => navigate('/my-orders')} variant="outline" size="sm">
            <Icon name="ShoppingCart" className="mr-2 h-4 w-4" />
            Мои заказы
          </Button>
          <Button onClick={() => navigate('/auction')} variant="outline" size="sm">
            <Icon name="Gavel" className="mr-2 h-4 w-4" />
            Мои аукционы
          </Button>
          {isAdmin && (
            <Button 
              onClick={() => {
                const adminSession = localStorage.getItem('adminSession');
                navigate(adminSession ? '/admin/panel' : '/admin');
              }} 
              variant="default" 
              size="sm" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Icon 
                name={userRole === 'superadmin' ? 'Crown' : userRole === 'admin' ? 'ShieldCheck' : 'Eye'} 
                className="mr-2 h-4 w-4" 
              />
              Админ-панель
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}