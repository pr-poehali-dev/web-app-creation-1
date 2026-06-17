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
  trial: '7 дней бесплатно',
  week: 'Неделя',
  month: 'Месяц',
  year: 'Год',
};

function getDaysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function DaysLeftBadge({ sub }: { sub: SubRecord }) {
  const days = getDaysLeft(sub.expires_at);
  if (!sub.is_active || days === null) return null;

  const isTrial = sub.plan === 'trial';
  const isUrgent = days <= 2;
  const isWarning = days <= 5;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
      isUrgent
        ? 'bg-red-100 text-red-600'
        : isWarning
        ? 'bg-amber-100 text-amber-600'
        : isTrial
        ? 'bg-blue-100 text-blue-600'
        : 'bg-green-100 text-green-600'
    }`}>
      <Icon name="Clock" size={10} />
      {days === 0 ? 'Истекает сегодня' : `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`}
    </span>
  );
}

export default function AdminSubscriptions({ isAuthenticated, onLogout }: AdminSubscriptionsProps) {
  const navigate = useNavigate();
  const [subs, setSubs] = useState<SubRecord[]>([]);
  const [filtered, setFiltered] = useState<SubRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [needKey, setNeedKey] = useState(false);
  const [keyInput, setKeyInput] = useState('');

  const [grantDialog, setGrantDialog] = useState(false);
  const [grantUser, setGrantUser] = useState<SubRecord | null>(null);
  const [grantPlan, setGrantPlan] = useState('month');
  const [grantLoading, setGrantLoading] = useState(false);

  const fetchSubs = useCallback(async (key?: string) => {
    setLoading(true);
    const k = key || localStorage.getItem('adminKey') || '';
    if (!k) {
      setNeedKey(true);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${SUB_URL}?action=admin-list`, {
        headers: { 'X-Admin-Key': k },
      });
      if (res.status === 403) {
        setNeedKey(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.ok) {
        setSubs(data.subscriptions || []);
        setNeedKey(false);
      } else {
        toast.error('Ошибка загрузки подписок');
      }
    } catch {
      toast.error('Ошибка сети');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  const handleKeySubmit = () => {
    if (!keyInput.trim()) return;
    localStorage.setItem('adminKey', keyInput.trim());
    fetchSubs(keyInput.trim());
  };

  useEffect(() => {
    let result = [...subs];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.email.toLowerCase().includes(q) ||
        (s.name || '').toLowerCase().includes(q)
      );
    }
    if (filterStatus === 'active') result = result.filter(s => s.is_active);
    else if (filterStatus === 'trial') result = result.filter(s => s.plan === 'trial');
    else if (filterStatus === 'paid') result = result.filter(s => s.plan !== 'trial' && s.is_active);
    else if (filterStatus === 'expired') result = result.filter(s => !s.is_active);
    setFiltered(result);
  }, [subs, search, filterStatus]);

  const handleRevoke = async (sub: SubRecord) => {
    const k = localStorage.getItem('adminKey') || '';
    const res = await fetch(`${SUB_URL}?action=admin-revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': k },
      body: JSON.stringify({ user_id: sub.user_id }),
    });
    const data = await res.json();
    if (data.ok) {
      toast.success(`Подписка отозвана: ${sub.name || sub.email}`);
      fetchSubs(k);
    } else {
      toast.error(data.error || 'Ошибка');
    }
  };

  const handleGrant = async () => {
    if (!grantUser) return;
    setGrantLoading(true);
    const k = localStorage.getItem('adminKey') || '';
    const res = await fetch(`${SUB_URL}?action=admin-grant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': k },
      body: JSON.stringify({ user_id: grantUser.user_id, plan: grantPlan }),
    });
    const data = await res.json();
    if (data.ok) {
      const label = grantPlan === 'week' ? 'неделя' : grantPlan === 'month' ? 'месяц' : 'год';
      toast.success(`Подписка (${label}) выдана: ${grantUser.name || grantUser.email}`);
      setGrantDialog(false);
      fetchSubs(k);
    } else {
      toast.error(data.error || 'Ошибка');
    }
    setGrantLoading(false);
  };

  const activeCount = subs.filter(s => s.is_active).length;
  const trialCount = subs.filter(s => s.plan === 'trial' && s.is_active).length;
  const paidCount = subs.filter(s => s.plan !== 'trial' && s.is_active).length;
  const expiredCount = subs.filter(s => !s.is_active).length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-5xl">

          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2 -ml-2">
              <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
              Назад
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Подписки Нейро-звук</h1>
                <p className="text-muted-foreground">Управление подписками BrainBooster</p>
              </div>
              <Button variant="outline" onClick={() => fetchSubs()} size="sm" className="gap-2">
                <Icon name="RefreshCw" size={15} />
                Обновить
              </Button>
            </div>
          </div>

          {/* Ввод ключа */}
          {needKey && (
            <Card className="mb-6 border-amber-300 bg-amber-50">
              <CardContent className="pt-5">
                <div className="flex items-start gap-3 mb-3">
                  <Icon name="Key" size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800">Введите ключ администратора</p>
                    <p className="text-sm text-amber-700">Значение секрета ADMIN_CLEANUP_KEY из настроек проекта</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={keyInput}
                    onChange={e => setKeyInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleKeySubmit()}
                    placeholder="Введите ключ..."
                    type="password"
                    className="flex-1"
                    autoFocus
                  />
                  <Button onClick={handleKeySubmit} disabled={!keyInput.trim()}>
                    Войти
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Статистика */}
          {!needKey && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setFilterStatus('all')}>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground mb-1">Всего записей</p>
                    <p className="text-2xl font-bold">{subs.length}</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:border-blue-400 transition-colors" onClick={() => setFilterStatus('trial')}>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground mb-1">Триал активен</p>
                    <p className="text-2xl font-bold text-blue-600">{trialCount}</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:border-green-400 transition-colors" onClick={() => setFilterStatus('paid')}>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground mb-1">Платных активных</p>
                    <p className="text-2xl font-bold text-green-600">{paidCount}</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:border-red-300 transition-colors" onClick={() => setFilterStatus('expired')}>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground mb-1">Истекших</p>
                    <p className="text-2xl font-bold text-muted-foreground">{expiredCount}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Список подписок</CardTitle>
                  <CardDescription>Пользователи с активным или истёкшим доступом к Нейро-звуку</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3 mb-4">
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
                        <SelectItem value="active">Все активные</SelectItem>
                        <SelectItem value="trial">Только триал</SelectItem>
                        <SelectItem value="paid">Только платные</SelectItem>
                        <SelectItem value="expired">Истекшие</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {loading ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <Icon name="Loader2" size={24} className="animate-spin mx-auto mb-2" />
                      Загрузка...
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <Icon name="Users" size={32} className="mx-auto mb-3 opacity-30" />
                      <p>Подписки не найдены</p>
                    </div>
                  ) : (
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                          <tr>
                            <th className="text-left px-4 py-3 font-medium">Пользователь</th>
                            <th className="text-left px-4 py-3 font-medium">Тип</th>
                            <th className="text-left px-4 py-3 font-medium">Статус</th>
                            <th className="text-left px-4 py-3 font-medium">Остаток</th>
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
                                <Badge variant="outline" className={
                                  sub.plan === 'trial'
                                    ? 'border-blue-300 text-blue-700 bg-blue-50'
                                    : 'border-purple-300 text-purple-700 bg-purple-50'
                                }>
                                  {PLAN_LABELS[sub.plan] || sub.plan}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                {sub.is_active ? (
                                  <Badge className="bg-green-500 text-white gap-1">
                                    <Icon name="CheckCircle" size={11} />
                                    Активна
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="gap-1">
                                    <Icon name="XCircle" size={11} />
                                    Истекла
                                  </Badge>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <DaysLeftBadge sub={sub} />
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                                {sub.expires_at
                                  ? new Date(sub.expires_at).toLocaleDateString('ru-RU', {
                                      day: '2-digit', month: '2-digit', year: 'numeric'
                                    })
                                  : '—'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => { setGrantUser(sub); setGrantPlan('month'); setGrantDialog(true); }}
                                    className="border-purple-400 text-purple-600 hover:bg-purple-50 gap-1"
                                  >
                                    <Icon name="Zap" size={13} />
                                    Выдать
                                  </Button>
                                  {sub.is_active && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleRevoke(sub)}
                                      className="border-red-400 text-red-600 hover:bg-red-50 gap-1"
                                    >
                                      <Icon name="ZapOff" size={13} />
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
            </>
          )}
        </div>
      </main>

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
              <SelectTrigger><SelectValue /></SelectTrigger>
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
              {grantLoading ? 'Выдаём...' : 'Выдать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
