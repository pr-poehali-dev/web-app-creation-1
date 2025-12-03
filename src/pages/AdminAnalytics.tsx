import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

interface AdminAnalyticsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function AdminAnalytics({ isAuthenticated, onLogout }: AdminAnalyticsProps) {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('month');

  const stats = [
    {
      title: 'Всего пользователей',
      value: '1,245',
      change: '+12%',
      trend: 'up',
      icon: 'Users',
      color: 'text-blue-500'
    },
    {
      title: 'Активных предложений',
      value: '367',
      change: '+8%',
      trend: 'up',
      icon: 'Package',
      color: 'text-purple-500'
    },
    {
      title: 'Активных запросов',
      value: '289',
      change: '+15%',
      trend: 'up',
      icon: 'FileText',
      color: 'text-orange-500'
    },
    {
      title: 'Завершенных сделок',
      value: '156',
      change: '+23%',
      trend: 'up',
      icon: 'CheckCircle',
      color: 'text-green-500'
    },
    {
      title: 'Общий объем сделок',
      value: '12.5М ₽',
      change: '+18%',
      trend: 'up',
      icon: 'TrendingUp',
      color: 'text-teal-500'
    },
    {
      title: 'Новых верификаций',
      value: '23',
      change: '+5%',
      trend: 'up',
      icon: 'ShieldCheck',
      color: 'text-indigo-500'
    },
  ];

  const topUsers = [
    { name: 'ООО "СтройМатериалы"', deals: 45, revenue: '2.3М ₽' },
    { name: 'ИП Петров А.С.', deals: 38, revenue: '1.8М ₽' },
    { name: 'ПАО "ГорСтрой"', deals: 32, revenue: '1.5М ₽' },
  ];

  const topCategories = [
    { name: 'Строительные материалы', count: 156, percentage: 42 },
    { name: 'Металлопрокат', count: 98, percentage: 26 },
    { name: 'Инструменты', count: 67, percentage: 18 },
    { name: 'Техника', count: 52, percentage: 14 },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} className="mb-2">
                <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
                Назад к панели
              </Button>
              <h1 className="text-3xl font-bold">Аналитика площадки</h1>
              <p className="text-muted-foreground">Статистика и показатели эффективности</p>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Неделя</SelectItem>
                <SelectItem value="month">Месяц</SelectItem>
                <SelectItem value="quarter">Квартал</SelectItem>
                <SelectItem value="year">Год</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon name={stat.icon as any} className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="text-green-500">{stat.change}</span> за период
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Топ продавцов</CardTitle>
                <CardDescription>По количеству завершенных сделок</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topUsers.map((user, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-sm font-bold text-primary">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.deals} сделок</p>
                        </div>
                      </div>
                      <span className="font-bold text-primary">{user.revenue}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Популярные категории</CardTitle>
                <CardDescription>Распределение по категориям товаров</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCategories.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{category.name}</span>
                        <span className="text-sm text-muted-foreground">{category.count}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>График активности</CardTitle>
              <CardDescription>Динамика создания предложений и запросов</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-[300px] items-center justify-center border-2 border-dashed rounded-lg">
                <div className="text-center">
                  <Icon name="BarChart" className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">График будет подключен к реальным данным</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
