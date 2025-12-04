import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

interface AdminDashboardProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function AdminDashboard({ isAuthenticated, onLogout }: AdminDashboardProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const adminSections = [
    {
      id: 'users',
      title: 'Управление пользователями',
      description: 'Просмотр, редактирование и блокировка пользователей',
      icon: 'Users',
      color: 'bg-blue-500',
      count: 150,
      path: '/admin/users'
    },
    {
      id: 'verifications',
      title: 'Верификация',
      description: 'Обработка заявок на верификацию',
      icon: 'ShieldCheck',
      color: 'bg-green-500',
      count: 5,
      path: '/admin/verifications'
    },
    {
      id: 'offers',
      title: 'Управление предложениями',
      description: 'Модерация и удаление предложений',
      icon: 'Package',
      color: 'bg-purple-500',
      count: 320,
      path: '/admin/offers'
    },
    {
      id: 'requests',
      title: 'Управление запросами',
      description: 'Модерация и удаление запросов',
      icon: 'FileText',
      color: 'bg-orange-500',
      count: 180,
      path: '/admin/requests'
    },
    {
      id: 'auctions',
      title: 'Управление аукционами',
      description: 'Модерация аукционов и ставок',
      icon: 'Gavel',
      color: 'bg-red-500',
      count: 45,
      path: '/admin/auctions'
    },
    {
      id: 'contracts',
      title: 'Управление контрактами',
      description: 'Просмотр и модерация контрактов',
      icon: 'FileSignature',
      color: 'bg-indigo-500',
      count: 89,
      path: '/admin/contracts'
    },
    {
      id: 'reviews',
      title: 'Управление отзывами',
      description: 'Модерация отзывов и рейтингов',
      icon: 'Star',
      color: 'bg-yellow-500',
      count: 267,
      path: '/admin/reviews'
    },
    {
      id: 'analytics',
      title: 'Аналитика',
      description: 'Статистика и отчеты по площадке',
      icon: 'TrendingUp',
      color: 'bg-teal-500',
      count: null,
      path: '/admin/analytics'
    },
    {
      id: 'settings',
      title: 'Настройки системы',
      description: 'Конфигурация площадки и параметры',
      icon: 'Settings',
      color: 'bg-gray-500',
      count: null,
      path: '/admin/settings'
    },
    {
      id: 'manage-admins',
      title: 'Управление администраторами',
      description: 'Добавление и удаление администраторов',
      icon: 'ShieldCheck',
      color: 'bg-pink-500',
      count: null,
      path: '/admin/manage-admins'
    }
  ];

  const recentActivity = [
    { action: 'Новый пользователь зарегистрирован', user: 'ООО "Стройинвест"', time: '5 мин назад', type: 'user' },
    { action: 'Заявка на верификацию отправлена', user: 'ИП Иванов А.С.', time: '12 мин назад', type: 'verification' },
    { action: 'Новое предложение создано', user: 'ООО "МеталлТорг"', time: '25 мин назад', type: 'offer' },
    { action: 'Контракт подписан', user: 'ПАО "СтройМастер"', time: '1 час назад', type: 'contract' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Административная панель</h1>
              <p className="text-muted-foreground">Управление торговой площадкой</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/admin/change-password')}>
              <Icon name="Key" className="mr-2 h-4 w-4" />
              Сменить пароль
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              <TabsTrigger value="activity">Активность</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {adminSections.map((section) => (
                  <a
                    key={section.id}
                    href={section.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Card 
                      className="cursor-pointer transition-all hover:shadow-lg h-full"
                    >
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${section.color}`}>
                          <Icon name={section.icon as any} className="h-6 w-6 text-white" />
                        </div>
                        {section.count !== null && (
                          <Badge variant="secondary" className="text-lg font-bold">
                            {section.count}
                          </Badge>
                        )}
                      </CardHeader>
                      <CardContent>
                        <CardTitle className="mb-2 text-lg">{section.title}</CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Последняя активность</CardTitle>
                  <CardDescription>События на площадке в реальном времени</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start gap-4 border-b pb-4 last:border-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <Icon 
                            name={
                              activity.type === 'user' ? 'User' : 
                              activity.type === 'verification' ? 'Shield' :
                              activity.type === 'offer' ? 'Package' : 'FileSignature'
                            } 
                            className="h-5 w-5" 
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">{activity.user}</p>
                        </div>
                        <span className="text-sm text-muted-foreground">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}