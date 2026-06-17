import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface AdminSubscriptionsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface SubRecord {
  user_id: number;
  email: string;
  name: string;
  plan: string;
  status: string;
  expires_at: string | null;
  is_active: boolean;
}

const SUB_URL = 'https://functions.poehali.dev/f2a339e0-68a2-42ba-b5eb-55be5d543b5e';

const PLAN_LABELS: Record<string, string> = {
  trial: 'Триал (7 дней)',
  week: 'Неделя',
  month: 'Месяц',
  year: 'Год',
};

const getAdminKey = () => localStorage.getItem('adminKey') || '';

const saveAdminKey = (key: string) => localStorage.setItem('adminKey', key);

async function askKey(): Promise<string | null> {
  const k = prompt('Введите ключ администратора (ADMIN_CLEANUP_KEY):');
  if (k) { saveAdminKey(k); return k; }
  return null;
}

export default function AdminSubscriptions({ isAuthenticated, onLogout }: AdminSubscriptionsProps) {
  const navigate = useNavigate();
  const [subs, setSubs] = useState<SubRecord[]>([]);
  const [filtered, setFiltered] = useState<SubRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Диалог выдачи
  const [grantDialog, setGrantDialog] = useState(false);
  const [grantUser, setGrantUser] = useState<SubRecord | null>(null);
  const [grantPlan, setGrantPlan] = useState('month');
  const [grantLoading, setGrantLoading] = useState(false);

  const fetchSubs = useCallback(async (key?: string) => {
    setLoading(true);
    const k = key || getAdminKey();
    try {
      const res = await fetch(`${SUB_URL}?action=admin-list`, {
        headers: { 'X-Admin-Key': k },
      });
      if (res.status === 403) {
        const newKey = await askKey();
        if (newKey) return fetchSubs(newKey);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.ok) {
        setSubs(data.subscriptions || []);
      } else {
        toast.error('Ошибка загрузки подписок');
      }
    } catch {
      toast.error('Ошибка сети');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  useEffect(() => {
    let result = [...subs];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s => s.email.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }
    if (filterStatus !== 'all') {
      result = result.filter(s => filterStatus === 'active' ? s.is_active : !s.is_active);
    }
    setFiltered(result);
  }, [subs, search, filterStatus]);

  const handleRevoke = async (sub: SubRecord) => {
    const key = getAdminKey();
    const doRevoke = async (k: string) => {
      const res = await fetch(`${SUB_URL}?action=admin-revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': k },
        body: JSON.stringify({ user_id: sub.user_id }),
      });
      if (res.status === 403) {
        const newKey = await askKey();
        if (newKey) return doRevoke(newKey);
        return;
      }
      const data = await res.json();
      if (data.ok) {
        toast.success(`Подписка отозвана: ${sub.name || sub.email}`);
        fetchSubs(k);
      } else {
        toast.error(data.error || 'Ошибка');
      }
    };
    await doRevoke(key);
  };

  const handleGrant = async () => {
    if (!grantUser) return;
    setGrantLoading(true);
    const key = getAdminKey();
    const doGrant = async (k: string) => {
      const res = await fetch(`${SUB_URL}?action=admin-grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': k },
        body: JSON.stringify({ user_id: grantUser.user_id, plan: grantPlan }),
      });
      if (res.status === 403) {
        const newKey = await askKey();
        if (newKey) return doGrant(newKey);
        return;
      }
      const data = await res.json();
      if (data.ok) {
        toast.success(`Подписка выдана: ${grantUser.name || grantUser.email}`);
        setGrantDialog(false);
        fetchSubs(k);
      } else {
        toast.error(data.error || 'Ошибка');
      }
    };
    await doGrant(key);
    setGrantLoading(false);
  };

  const openGrant = (sub: SubRecord) => {
    setGrantUser(sub);
    setGrantPlan('month');
    setGrantDialog(true);
  };

  const activeCount = subs.filter(s => s.is_active).length;
  const expiredCount = subs.filter(s => !s.is_active).length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-5xl">

          {/* Заголовок */}
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2 -ml-2">
              <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
              Назад
            </Button>
            <h1 className="text-3xl font-bold">Подписки Нейро-звук</h1>
            <p className="text-muted-foreground">Управление подписками пользователей BrainBooster</p>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-sm text-muted-foreground">Всего</p>
                <p className="text-3xl font-bold">{subs.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-sm text-muted-foreground">Активных</p>
                <p className="text-3xl font-bold text-green-600">{activeCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-sm text-muted-foreground">Истекших</p>
                <p className="text-3xl font-bold text-muted-foreground">{expiredCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Таблица */}
          <Card>
            <CardHeader>
              <CardTitle>Список подписок</CardTitle>
              <CardDescription>Пользователи с активным или истёкшим доступом</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Фильтры */}
              <div className="flex gap-3 mb-5">
                <Input
                  placeholder="Поиск по имени или email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все</SelectItem>
                    <SelectItem value="active">Активные</SelectItem>
                    <SelectItem value="expired">Истекшие</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => fetchSubs()} size="icon" title="Обновить">
                  <Icon name="RefreshCw" size={16} />
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Подписки не найдены</div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium">Пользователь</th>
                        <th className="text-left px-4 py-3 font-medium">Тариф</th>
                        <th className="text-left px-4 py-3 font-medium">Статус</th>
                        <th className="text-left px-4 py-3 font-medium">Истекает</th>
                        <th className="text-right px-4 py-3 font-medium">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filtered.map(sub => (
                        <tr key={sub.user_id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium">{sub.name || '—'}</p>
                            <p className="text-xs text-muted-foreground">{sub.email}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm">{PLAN_LABELS[sub.plan] || sub.plan}</span>
                          </td>
                          <td className="px-4 py-3">
                            {sub.is_active ? (
                              <Badge className="bg-green-500 text-white">
                                <Icon name="CheckCircle" size={11} className="mr-1" />
                                Активна
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-muted-foreground">
                                <Icon name="Clock" size={11} className="mr-1" />
                                Истекла
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {sub.expires_at
                              ? new Date(sub.expires_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
                              : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openGrant(sub)}
                                title="Выдать / продлить подписку"
                                className="border-purple-400 text-purple-600 hover:bg-purple-50"
                              >
                                <Icon name="Zap" size={14} className="mr-1" />
                                Выдать
                              </Button>
                              {sub.is_active && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRevoke(sub)}
                                  title="Отозвать подписку"
                                  className="border-red-400 text-red-600 hover:bg-red-50"
                                >
                                  <Icon name="ZapOff" size={14} className="mr-1" />
                                  Отозвать
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Диалог выдачи подписки */}
      <Dialog open={grantDialog} onOpenChange={setGrantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Выдать / продлить подписку</DialogTitle>
            <DialogDescription>
              Пользователь: <strong>{grantUser?.name || grantUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-sm font-medium">Тариф</label>
            <Select value={grantPlan} onValueChange={setGrantPlan}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Неделя (7 дней)</SelectItem>
                <SelectItem value="month">Месяц (30 дней)</SelectItem>
                <SelectItem value="year">Год (365 дней)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Если подписка уже активна — срок будет продлён от текущей даты окончания.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantDialog(false)}>Отмена</Button>
            <Button onClick={handleGrant} disabled={grantLoading} className="gap-2">
              <Icon name="Zap" size={15} />
              {grantLoading ? 'Выдаём...' : 'Выдать подписку'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
