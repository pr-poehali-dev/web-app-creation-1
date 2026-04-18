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
import { useState, useEffect } from 'react';

const TRACK_API = 'https://functions.poehali.dev/d6fc7d3f-1215-492d-943f-d1cbf3a44bcf';

interface VisitStats {
  totals: {
    today: number; today_uniq: number;
    week: number; week_uniq: number;
    month: number; month_uniq: number;
    total: number; total_uniq: number;
  };
  daily: { day: string; visits: number; unique_visitors: number }[];
  topPages: { page: string; visits: number }[];
}

interface AdminAnalyticsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function AdminAnalytics({ isAuthenticated, onLogout }: AdminAnalyticsProps) {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('month');
  const [visitStats, setVisitStats] = useState<VisitStats | null>(null);
  const [visitLoading, setVisitLoading] = useState(true);

  useEffect(() => {
    fetch(`${TRACK_API}?action=stats`)
      .then(r => r.json())
      .then(d => setVisitStats(d))
      .catch(() => { /* ignore */ })
      .finally(() => setVisitLoading(false));
  }, []);

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
              <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
                <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
                Назад
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
                  <Icon name={stat.icon} className={`h-5 w-5 ${stat.color}`} />
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

          {/* Посещаемость сайта */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Eye" className="h-5 w-5 text-blue-500" />
                Посещаемость сайта
              </CardTitle>
              <CardDescription>Реальные данные о визитах посетителей</CardDescription>
            </CardHeader>
            <CardContent>
              {visitLoading ? (
                <div className="flex items-center justify-center h-24 text-muted-foreground">
                  <Icon name="Loader2" className="animate-spin mr-2" /> Загрузка...
                </div>
              ) : visitStats ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Сегодня (визиты)', value: visitStats.totals.today, sub: `${visitStats.totals.today_uniq} уникальных` },
                      { label: 'За 7 дней', value: visitStats.totals.week, sub: `${visitStats.totals.week_uniq} уникальных` },
                      { label: 'За 30 дней', value: visitStats.totals.month, sub: `${visitStats.totals.month_uniq} уникальных` },
                      { label: 'Всего', value: visitStats.totals.total, sub: `${visitStats.totals.total_uniq} уникальных` },
                    ].map((item, i) => (
                      <div key={i} className="rounded-lg border p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{item.value}</div>
                        <div className="text-xs font-medium mt-1">{item.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{item.sub}</div>
                      </div>
                    ))}
                  </div>
                  {visitStats.topPages.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-3">Топ страниц за 7 дней</p>
                      <div className="space-y-2">
                        {visitStats.topPages.map((p, i) => (
                          <div key={i} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                            <span className="text-muted-foreground font-mono">{p.page || '/'}</span>
                            <span className="font-semibold">{p.visits} визитов</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {visitStats.daily.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-3">Последние 30 дней (по дням)</p>
                      <div className="overflow-x-auto">
                        <div className="flex gap-1 items-end min-w-max">
                          {visitStats.daily.map((d, i) => {
                            const maxV = Math.max(...visitStats.daily.map(x => x.visits), 1);
                            const h = Math.max(4, Math.round((d.visits / maxV) * 80));
                            return (
                              <div key={i} className="flex flex-col items-center gap-1" title={`${d.day}: ${d.visits} визитов`}>
                                <div className="w-5 bg-primary rounded-t" style={{ height: `${h}px` }} />
                                {i % 7 === 0 && <span className="text-[9px] text-muted-foreground rotate-45">{d.day.slice(5)}</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Нет данных</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}