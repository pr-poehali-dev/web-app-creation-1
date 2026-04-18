import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useState, useEffect } from 'react';

const STATS_API = 'https://functions.poehali.dev/a764d5ef-b512-4cbd-b25b-36a52baa08b7';
const TRACK_API = 'https://functions.poehali.dev/d6fc7d3f-1215-492d-943f-d1cbf3a44bcf';

interface TopSeller { name: string; deals: number; revenue: number; }
interface TopCategory { name: string; count: number; percentage: number; }

interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  activeOffers: number;
  activeRequests: number;
  activeAuctions: number;
  completedOrders: number;
  pendingVerifications: number;
  topSellers: TopSeller[];
  topCategories: TopCategory[];
}

interface VisitStats {
  totals: { today: number; today_uniq: number; week: number; week_uniq: number; month: number; month_uniq: number; total: number; total_uniq: number; };
  daily: { day: string; visits: number; unique_visitors: number }[];
  topPages: { page: string; visits: number }[];
}

interface AdminAnalyticsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  goods: 'Товары', services: 'Услуги', transport: 'Транспорт', auto: 'Авто',
  essentials: 'Продукты питания', 'raw-materials': 'Сырьё', Другое: 'Другое',
};

export default function AdminAnalytics({ isAuthenticated, onLogout }: AdminAnalyticsProps) {
  const navigate = useNavigate();
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [visitStats, setVisitStats] = useState<VisitStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(STATS_API).then(r => r.json()).catch(() => null),
      fetch(`${TRACK_API}?action=stats`).then(r => r.json()).catch(() => null),
    ]).then(([platform, visits]) => {
      if (platform) setPlatformStats(platform);
      if (visits) setVisitStats(visits);
    }).finally(() => setLoading(false));
  }, []);

  const statCards = platformStats ? [
    { title: 'Всего пользователей', value: platformStats.totalUsers, icon: 'Users', color: 'text-blue-500' },
    { title: 'Активных предложений', value: platformStats.activeOffers, icon: 'Package', color: 'text-purple-500' },
    { title: 'Активных запросов', value: platformStats.activeRequests, icon: 'FileText', color: 'text-orange-500' },
    { title: 'Активных аукционов', value: platformStats.activeAuctions, icon: 'Gavel', color: 'text-yellow-500' },
    { title: 'Завершённых сделок', value: platformStats.completedOrders, icon: 'CheckCircle', color: 'text-green-500' },
    { title: 'Верифицированных', value: platformStats.verifiedUsers, icon: 'ShieldCheck', color: 'text-teal-500' },
    { title: 'Ожидают верификации', value: platformStats.pendingVerifications, icon: 'Clock', color: 'text-red-500' },
    { title: 'Активных пользователей', value: platformStats.activeUsers, icon: 'UserCheck', color: 'text-indigo-500' },
  ] : [];

  const formatRevenue = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}М ₽`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}К ₽`;
    return `${v.toLocaleString('ru-RU')} ₽`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
              <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
              Назад
            </Button>
            <h1 className="text-3xl font-bold">Аналитика площадки</h1>
            <p className="text-muted-foreground">Реальные данные о работе платформы</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <Icon name="Loader2" className="animate-spin mr-2" /> Загрузка данных...
            </div>
          ) : (
            <>
              {/* Основные показатели */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                {statCards.map((stat, i) => (
                  <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                      <Icon name={stat.icon} className={`h-5 w-5 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value?.toLocaleString('ru-RU') ?? '—'}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Топ продавцов и категории */}
              <div className="grid gap-6 md:grid-cols-2 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Топ продавцов</CardTitle>
                    <CardDescription>По количеству завершённых сделок</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!platformStats?.topSellers?.length ? (
                      <p className="text-sm text-muted-foreground">Нет завершённых сделок</p>
                    ) : (
                      <div className="space-y-4">
                        {platformStats.topSellers.map((seller, i) => (
                          <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                <span className="text-sm font-bold text-primary">{i + 1}</span>
                              </div>
                              <div>
                                <p className="font-medium">{seller.name}</p>
                                <p className="text-sm text-muted-foreground">{seller.deals} сделок</p>
                              </div>
                            </div>
                            <span className="font-bold text-primary">{formatRevenue(seller.revenue)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Популярные категории</CardTitle>
                    <CardDescription>По завершённым сделкам</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!platformStats?.topCategories?.length ? (
                      <p className="text-sm text-muted-foreground">Нет данных</p>
                    ) : (
                      <div className="space-y-4">
                        {platformStats.topCategories.map((cat, i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{CATEGORY_LABELS[cat.name] || cat.name}</span>
                              <span className="text-sm text-muted-foreground">{cat.count}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                              <div className="h-full bg-primary transition-all" style={{ width: `${cat.percentage}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Посещаемость */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Eye" className="h-5 w-5 text-blue-500" />
                Посещаемость сайта
              </CardTitle>
              <CardDescription>Визиты и уникальные посетители</CardDescription>
            </CardHeader>
            <CardContent>
              {!visitStats ? (
                <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">Нет данных</div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Сегодня', value: visitStats.totals.today, sub: `${visitStats.totals.today_uniq} уник.` },
                      { label: 'За 7 дней', value: visitStats.totals.week, sub: `${visitStats.totals.week_uniq} уник.` },
                      { label: 'За 30 дней', value: visitStats.totals.month, sub: `${visitStats.totals.month_uniq} уник.` },
                      { label: 'Всего', value: visitStats.totals.total, sub: `${visitStats.totals.total_uniq} уник.` },
                    ].map((item, i) => (
                      <div key={i} className="rounded-lg border p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{item.value}</div>
                        <div className="text-xs font-medium mt-1">{item.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{item.sub}</div>
                      </div>
                    ))}
                  </div>

                  {visitStats.daily.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-3">По дням (30 дней)</p>
                      <div className="overflow-x-auto">
                        <div className="flex gap-1 items-end min-w-max pb-4">
                          {visitStats.daily.map((d, i) => {
                            const maxV = Math.max(...visitStats.daily.map(x => x.visits), 1);
                            const h = Math.max(4, Math.round((d.visits / maxV) * 80));
                            return (
                              <div key={i} className="flex flex-col items-center gap-1" title={`${d.day}: ${d.visits} визитов`}>
                                <div className="w-5 bg-primary rounded-t" style={{ height: `${h}px` }} />
                                {i % 5 === 0 && <span className="text-[9px] text-muted-foreground">{d.day.slice(5)}</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

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
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
