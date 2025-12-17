import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface AdminPanelProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface StatsData {
  totalUsers: number;
  verifiedUsers: number;
  pendingVerifications: number;
  resubmittedVerifications: number;
  totalOffers: number;
  totalRequests: number;
  totalAuctions: number;
  activeContracts: number;
  totalReviews: number;
}

export default function AdminPanel({ isAuthenticated, onLogout }: AdminPanelProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingVerifications: 0,
    resubmittedVerifications: 0,
    totalOffers: 0,
    totalRequests: 0,
    totalAuctions: 0,
    activeContracts: 0,
    totalReviews: 0,
  });

  useEffect(() => {
    const adminSession = localStorage.getItem('adminSession');
    const userRole = localStorage.getItem('userRole');
    
    if (!adminSession || userRole !== 'admin') {
      toast({
        title: 'Доступ запрещен',
        description: 'Требуется авторизация администратора',
        variant: 'destructive',
      });
      navigate('/admin');
      return;
    }

    loadStats();
  }, [navigate, toast]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      
      // Загружаем заявки на верификацию
      const verificationsResponse = await fetch('https://functions.poehali.dev/bdff7262-3acc-4253-afcc-26ef5ef8b778?status=pending', {
        headers: {
          'X-User-Id': userId || '',
        },
      });
      
      let pendingCount = 0;
      let resubmittedCount = 0;
      
      if (verificationsResponse.ok) {
        const data = await verificationsResponse.json();
        pendingCount = data.verifications?.length || 0;
        resubmittedCount = data.verifications?.filter((v: any) => v.isResubmitted).length || 0;
      }
      
      setStats({
        totalUsers: 0,
        verifiedUsers: 0,
        pendingVerifications: pendingCount,
        resubmittedVerifications: resubmittedCount,
        totalOffers: 0,
        totalRequests: 0,
        totalAuctions: 0,
        activeContracts: 0,
        totalReviews: 0,
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить статистику',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const adminSections = [
    {
      id: 'verifications',
      title: 'Верификация пользователей',
      description: 'Обработка заявок на верификацию аккаунтов',
      icon: 'ShieldCheck',
      color: 'bg-green-500',
      count: stats.pendingVerifications,
      path: '/admin/verifications',
      priority: 'high'
    },
    {
      id: 'users',
      title: 'Управление пользователями',
      description: 'Просмотр, редактирование и блокировка пользователей',
      icon: 'Users',
      color: 'bg-blue-500',
      count: null,
      path: '/admin/users',
      priority: 'normal'
    },
    {
      id: 'deleted-users',
      title: 'История удаленных',
      description: 'Просмотр и восстановление удаленных пользователей',
      icon: 'Archive',
      color: 'bg-slate-500',
      count: null,
      path: '/admin/deleted-users',
      priority: 'low'
    },
    {
      id: 'offers',
      title: 'Модерация предложений',
      description: 'Проверка и управление предложениями на площадке',
      icon: 'Package',
      color: 'bg-purple-500',
      count: null,
      path: '/admin/offers',
      priority: 'normal'
    },
    {
      id: 'requests',
      title: 'Модерация запросов',
      description: 'Проверка и управление запросами покупателей',
      icon: 'FileText',
      color: 'bg-orange-500',
      count: null,
      path: '/admin/requests',
      priority: 'normal'
    },
    {
      id: 'auctions',
      title: 'Управление аукционами',
      description: 'Модерация аукционов и контроль ставок',
      icon: 'Gavel',
      color: 'bg-red-500',
      count: null,
      path: '/admin/auctions',
      priority: 'normal'
    },
    {
      id: 'contracts',
      title: 'Управление контрактами',
      description: 'Просмотр и модерация фьючерсных контрактов',
      icon: 'FileSignature',
      color: 'bg-indigo-500',
      count: null,
      path: '/admin/contracts',
      priority: 'normal'
    },
    {
      id: 'orders',
      title: 'Мониторинг заказов',
      description: 'Просмотр всех заказов системы и статистика',
      icon: 'ShoppingCart',
      color: 'bg-cyan-500',
      count: null,
      path: '/admin/orders',
      priority: 'high'
    },
    {
      id: 'reviews',
      title: 'Модерация отзывов',
      description: 'Проверка отзывов и управление рейтингами',
      icon: 'Star',
      color: 'bg-yellow-500',
      count: null,
      path: '/admin/reviews',
      priority: 'normal'
    },
    {
      id: 'analytics',
      title: 'Аналитика и отчеты',
      description: 'Статистика и аналитические данные площадки',
      icon: 'TrendingUp',
      color: 'bg-teal-500',
      count: null,
      path: '/admin/analytics',
      priority: 'low'
    },
    {
      id: 'settings',
      title: 'Настройки системы',
      description: 'Конфигурация параметров торговой площадки',
      icon: 'Settings',
      color: 'bg-gray-500',
      count: null,
      path: '/admin/settings',
      priority: 'low'
    },
    {
      id: 'manage-admins',
      title: 'Управление администраторами',
      description: 'Добавление и удаление прав администратора',
      icon: 'Shield',
      color: 'bg-pink-500',
      count: null,
      path: '/admin/manage-admins',
      priority: 'low'
    }
  ];

  const quickStats = [
    {
      title: 'На модерации',
      value: stats.pendingVerifications,
      icon: 'Clock',
      color: 'text-orange-600',
      change: 'Требуется проверка'
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                  <Icon name="ShieldCheck" className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Административная панель</h1>
                  <p className="text-muted-foreground">Управление торговой площадкой ЕРТП</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate('/admin/change-password')}>
                <Icon name="Key" className="mr-2 h-4 w-4" />
                Сменить пароль
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                {quickStats.map((stat) => (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <Icon name={stat.icon as any} className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.change}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {stats.pendingVerifications > 0 && (
                <Alert className="mb-8 border-orange-200 bg-orange-50">
                  <Icon name="AlertCircle" className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold mb-1">
                          У вас {stats.pendingVerifications} {stats.pendingVerifications === 1 ? 'заявка' : 'заявок'} на верификацию
                        </div>
                        {stats.resubmittedVerifications > 0 && (
                          <div className="text-sm flex items-center gap-1">
                            <Icon name="RefreshCw" className="h-3 w-3" />
                            <span>Из них {stats.resubmittedVerifications} повторно поданных</span>
                          </div>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/admin/verifications')}
                        className="ml-4"
                      >
                        Перейти к заявкам
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Tabs defaultValue="all" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="all">Все функции</TabsTrigger>
                  <TabsTrigger value="moderation">Модерация</TabsTrigger>
                  <TabsTrigger value="management">Управление</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {adminSections.map((section) => (
                      <Card 
                        key={section.id}
                        className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
                        onClick={() => navigate(section.path)}
                      >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${section.color}`}>
                            <Icon name={section.icon as any} className="h-6 w-6 text-white" />
                          </div>
                          {section.count !== null && (
                            <Badge variant={section.priority === 'high' ? 'default' : 'secondary'} className="text-lg font-bold">
                              {section.count}
                            </Badge>
                          )}
                        </CardHeader>
                        <CardContent>
                          <CardTitle className="mb-2 text-lg">{section.title}</CardTitle>
                          <CardDescription>{section.description}</CardDescription>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="moderation" className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {adminSections
                      .filter(s => ['verifications', 'offers', 'requests', 'auctions', 'contracts', 'reviews'].includes(s.id))
                      .map((section) => (
                        <Card 
                          key={section.id}
                          className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
                          onClick={() => navigate(section.path)}
                        >
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${section.color}`}>
                              <Icon name={section.icon as any} className="h-6 w-6 text-white" />
                            </div>
                            {section.count !== null && (
                              <Badge variant={section.priority === 'high' ? 'default' : 'secondary'} className="text-lg font-bold">
                                {section.count}
                              </Badge>
                            )}
                          </CardHeader>
                          <CardContent>
                            <CardTitle className="mb-2 text-lg">{section.title}</CardTitle>
                            <CardDescription>{section.description}</CardDescription>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="management" className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {adminSections
                      .filter(s => ['users', 'analytics', 'settings', 'manage-admins'].includes(s.id))
                      .map((section) => (
                        <Card 
                          key={section.id}
                          className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
                          onClick={() => navigate(section.path)}
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
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}