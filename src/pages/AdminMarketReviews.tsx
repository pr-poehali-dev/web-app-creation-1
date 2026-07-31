import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface AdminMarketReviewsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface PurchaseRecord {
  id: number;
  user_id: number;
  ticker: string;
  amount: number;
  status: string;
  order_id: string | null;
  has_review: boolean;
  created_at: string | null;
  updated_at: string | null;
  email: string | null;
  name: string;
}

const TBANK_URL = 'https://functions.poehali.dev/f2a339e0-68a2-42ba-b5eb-55be5d543b5e';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Ожидает оплаты', className: 'bg-amber-100 text-amber-700' },
  paid: { label: 'Оплачено', className: 'bg-green-100 text-green-700' },
  failed: { label: 'Ошибка оплаты', className: 'bg-red-100 text-red-700' },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatRub(kopeks: number) {
  return (kopeks / 100).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AdminMarketReviews({ isAuthenticated, onLogout }: AdminMarketReviewsProps) {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [needKey, setNeedKey] = useState(false);
  const [keyInput, setKeyInput] = useState('');

  const [priceKopeks, setPriceKopeks] = useState<number>(1500);
  const [priceInput, setPriceInput] = useState('15.00');
  const [savingPrice, setSavingPrice] = useState(false);

  const fetchData = useCallback(async (key?: string) => {
    setLoading(true);
    const k = key || localStorage.getItem('adminKey') || '';
    if (!k) {
      setNeedKey(true);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${TBANK_URL}?action=admin-market-reviews`, {
        headers: { 'X-Admin-Key': k },
      });
      if (res.status === 403) {
        setNeedKey(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.ok) {
        setPurchases(data.purchases || []);
        setPriceKopeks(data.priceKopeks || 1500);
        setPriceInput(((data.priceKopeks || 1500) / 100).toFixed(2));
        setNeedKey(false);
      } else {
        toast.error('Ошибка загрузки покупок');
      }
    } catch {
      toast.error('Ошибка сети');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleKeySubmit = () => {
    if (!keyInput.trim()) return;
    localStorage.setItem('adminKey', keyInput.trim());
    fetchData(keyInput.trim());
  };

  const handleSavePrice = async () => {
    const rub = parseFloat(priceInput.replace(',', '.'));
    if (isNaN(rub) || rub <= 0) {
      toast.error('Введите корректную сумму больше 0');
      return;
    }
    const newKopeks = Math.round(rub * 100);
    setSavingPrice(true);
    const k = localStorage.getItem('adminKey') || '';
    try {
      const res = await fetch(`${TBANK_URL}?action=admin-market-reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': k },
        body: JSON.stringify({ priceKopeks: newKopeks }),
      });
      const data = await res.json();
      if (data.ok) {
        setPriceKopeks(data.priceKopeks);
        toast.success(`Цена обзора обновлена: ${formatRub(data.priceKopeks)} ₽`);
      } else {
        toast.error(data.error || 'Ошибка сохранения');
      }
    } catch {
      toast.error('Ошибка сети');
    }
    setSavingPrice(false);
  };

  const paidCount = purchases.filter(p => p.status === 'paid').length;
  const pendingCount = purchases.filter(p => p.status === 'pending').length;
  const totalRevenueKopeks = purchases.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);

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
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h1 className="text-3xl font-bold">ИИ-обзоры рынка</h1>
                <p className="text-muted-foreground">Покупки платного обзора в разделе «Рынок»</p>
              </div>
              <Button variant="outline" onClick={() => fetchData()} size="sm" className="gap-2">
                <Icon name="RefreshCw" size={15} />
                Обновить
              </Button>
            </div>
          </div>

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

          {!needKey && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                <Card>
                  <CardContent className="pt-5">
                    <div className="text-2xl font-bold">{paidCount}</div>
                    <div className="text-sm text-muted-foreground">Оплачено</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5">
                    <div className="text-2xl font-bold">{pendingCount}</div>
                    <div className="text-sm text-muted-foreground">Ожидают оплаты</div>
                  </CardContent>
                </Card>
                <Card className="col-span-2 sm:col-span-1">
                  <CardContent className="pt-5">
                    <div className="text-2xl font-bold text-green-600">{formatRub(totalRevenueKopeks)} ₽</div>
                    <div className="text-sm text-muted-foreground">Выручка</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon name="Settings" size={18} />
                    Цена ИИ-обзора
                  </CardTitle>
                  <CardDescription>
                    Стоимость, которую платит пользователь за один обзор. Сейчас: <strong>{formatRub(priceKopeks)} ₽</strong>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-3 flex-wrap">
                    <div className="space-y-1.5">
                      <Label htmlFor="review-price">Новая цена, ₽</Label>
                      <Input
                        id="review-price"
                        value={priceInput}
                        onChange={e => setPriceInput(e.target.value)}
                        placeholder="15.00"
                        className="w-40"
                        inputMode="decimal"
                      />
                    </div>
                    <Button onClick={handleSavePrice} disabled={savingPrice} className="gap-2">
                      {savingPrice ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Check" size={16} />}
                      Сохранить
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">История покупок</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
                    </div>
                  ) : purchases.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Icon name="Inbox" size={32} className="mx-auto mb-2 opacity-40" />
                      Покупок пока нет
                    </div>
                  ) : (
                    <div className="divide-y">
                      {purchases.map(p => {
                        const statusInfo = STATUS_LABELS[p.status] || { label: p.status, className: 'bg-gray-100 text-gray-700' };
                        return (
                          <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 flex-wrap">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-sm font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">{p.ticker}</span>
                                <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                                {p.has_review && (
                                  <Badge variant="outline" className="gap-1">
                                    <Icon name="Sparkles" size={11} />
                                    Обзор готов
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground mt-0.5 truncate">
                                {p.name || p.email || `Пользователь #${p.user_id}`}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-semibold">{formatRub(p.amount)} ₽</div>
                              <div className="text-xs text-muted-foreground">{formatDate(p.created_at)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
