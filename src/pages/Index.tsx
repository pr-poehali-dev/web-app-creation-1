import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import DistrictSelector from '@/components/DistrictSelector';
import type { LocationData } from '@/utils/geolocation';
import { useDistrict } from '@/contexts/DistrictContext';

interface IndexProps {
  isAuthenticated: boolean;
  onLogout: () => void;
  userLocation: LocationData | null;
}

export default function Index({ isAuthenticated, onLogout, userLocation }: IndexProps) {
  const navigate = useNavigate();
  const { selectedDistrict, districts } = useDistrict();
  
  const currentDistrictName = districts.find(d => d.id === selectedDistrict)?.name || 'Все районы';

  const features = [
    {
      icon: 'Package',
      title: 'Предложения',
      description: 'Размещайте и просматривайте коммерческие предложения',
      path: '/offers',
    },
    {
      icon: 'FileText',
      title: 'Запросы',
      description: 'Создавайте запросы на поставку товаров и услуг',
      path: '/requests',
    },
    {
      icon: 'Gavel',
      title: 'Аукцион',
      description: 'Участвуйте в торгах и аукционах',
      path: '/auction',
    },
    {
      icon: 'Info',
      title: 'О площадке',
      description: 'Узнайте больше о нашей платформе',
      path: '/about',
    },
    {
      icon: 'HeadphonesIcon',
      title: 'Поддержка',
      description: 'Получите помощь от нашей команды',
      path: '/support',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground">
            Единая региональная товарно-торговая площадка
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Эффективное решение для управления предложениями, запросами и аукционами. 
            Оптимизируйте бизнес-процессы вашей компании.
          </p>
        </div>

        <div className="mb-8 flex flex-col md:flex-row gap-4 justify-center items-stretch">
          {userLocation && (
            <Card className="border-primary/20 bg-primary/5 flex-1 max-w-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Icon name="MapPin" className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Ваше местоположение</p>
                    <p className="font-medium">{userLocation.city}, {userLocation.district}</p>
                  </div>
                  {userLocation.source === 'geolocation' && (
                    <div className="rounded-full bg-green-100 px-2 py-1">
                      <span className="text-xs text-green-700">Точное</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card className="border-primary/20 bg-primary/5 flex-1 max-w-md md:hidden">
            <CardContent className="pt-6">
              <DistrictSelector showLabel={true} />
              {selectedDistrict !== 'all' && (
                <p className="text-sm text-muted-foreground mt-2">
                  Отображаются предложения для: {currentDistrictName}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.path}
              className="transition-all hover:shadow-lg cursor-pointer"
              onClick={() => navigate(feature.path)}
            >
              <CardHeader>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Icon name={feature.icon as any} className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full justify-between">
                  Перейти
                  <Icon name="ArrowRight" className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>Начните работу прямо сейчас</CardTitle>
              <CardDescription>
                Войдите в систему или зарегистрируйтесь для доступа ко всем функциям платформы
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button onClick={() => navigate('/login')} size="lg">
                  Войти в систему
                </Button>
                <Button onClick={() => navigate('/register')} variant="outline" size="lg">
                  Регистрация
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}