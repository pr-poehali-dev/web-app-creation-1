import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { getSession } from '@/utils/auth';

interface ProfileProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const USER_TYPE_LABELS: Record<string, string> = {
  individual: 'Физическое лицо',
  'self-employed': 'Самозанятый',
  entrepreneur: 'Индивидуальный предприниматель',
  'legal-entity': 'Юридическое лицо',
};

export default function Profile({ isAuthenticated, onLogout }: ProfileProps) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(getSession());

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
    }
  }, [isAuthenticated, currentUser, navigate]);

  if (!currentUser) {
    return null;
  }

  const getInitials = () => {
    const firstInitial = currentUser.firstName?.charAt(0) || '';
    const lastInitial = currentUser.lastName?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
              <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
              Назад
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Мой профиль</h1>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                    {getInitials()}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl">
                      {currentUser.firstName} {currentUser.lastName}
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      {currentUser.email}
                    </CardDescription>
                    <div className="mt-2">
                      <Badge variant="secondary">
                        {USER_TYPE_LABELS[currentUser.userType] || currentUser.userType}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="User" className="h-5 w-5" />
                  Личные данные
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Фамилия</Label>
                    <Input value={currentUser.lastName} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Имя</Label>
                    <Input value={currentUser.firstName} disabled />
                  </div>
                </div>

                {currentUser.middleName && (
                  <div className="space-y-2">
                    <Label>Отчество</Label>
                    <Input value={currentUser.middleName} disabled />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Тип пользователя</Label>
                  <Input
                    value={USER_TYPE_LABELS[currentUser.userType] || currentUser.userType}
                    disabled
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Phone" className="h-5 w-5" />
                  Контактная информация
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Телефон</Label>
                  <Input value={currentUser.phone} disabled />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={currentUser.email} disabled />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Calendar" className="h-5 w-5" />
                  Информация об аккаунте
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Дата регистрации</span>
                  <span className="text-sm font-medium">
                    {formatDate(currentUser.registeredAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Статус аккаунта</span>
                  <Badge variant="default" className="bg-green-500">
                    <Icon name="CheckCircle" className="mr-1 h-3 w-3" />
                    Активен
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Icon name="AlertTriangle" className="h-5 w-5" />
                  Настройки безопасности
                </CardTitle>
                <CardDescription>
                  Управление паролем и настройками безопасности
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full" disabled>
                  <Icon name="Key" className="mr-2 h-4 w-4" />
                  Изменить пароль
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Функция редактирования профиля будет доступна в следующей версии
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
