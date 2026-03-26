import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import func2url from '../../backend/func2url.json';
import { CATEGORIES, UNITS } from '@/hooks/useContractData';

interface EditContractProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const CONTRACT_TYPE_OPTIONS = [
  { value: 'forward', label: 'Форвард (предложение)' },
  { value: 'forward-request', label: 'Запрос на закупку' },
  { value: 'barter', label: 'Бартер' },
];

const DELIVERY_METHODS = [
  'автомобильный транспорт',
  'железнодорожный транспорт',
  'авиадоставка',
  'морской транспорт',
  'самовывоз',
  'курьерская доставка',
];

export default function EditContract({ isAuthenticated, onLogout }: EditContractProps) {
  useScrollToTop();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const session = getSession();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [form, setForm] = useState({
    contractType: 'forward',
    title: '',
    description: '',
    category: 'other',
    productName: '',
    quantity: '',
    unit: 'т',
    pricePerUnit: '',
    deliveryDate: '',
    contractStartDate: '',
    contractEndDate: '',
    deliveryAddress: '',
    deliveryMethod: 'автомобильный транспорт',
    prepaymentPercent: '0',
    termsConditions: '',
    status: 'draft',
  });

  const totalAmount = (parseFloat(form.pricePerUnit) || 0) * (parseFloat(form.quantity) || 0);
  const prepaymentAmount = totalAmount * (parseFloat(form.prepaymentPercent) || 0) / 100;

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    loadContract();
  }, [id, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadContract = async () => {
    try {
      const userId = String(session?.userId || '');
      const res = await fetch(`${func2url['contracts-list']}?id=${id}`, {
        headers: { 'X-User-Id': userId },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const c = (data.contracts || []).find((x: { id: number }) => x.id === Number(id));
      if (!c) { toast({ title: 'Контракт не найден', variant: 'destructive' }); navigate(-1); return; }
      if (c.sellerId !== session?.userId) { toast({ title: 'Нет доступа', variant: 'destructive' }); navigate(-1); return; }
      setForm({
        contractType: c.contractType || 'forward',
        title: c.title || '',
        description: c.description || '',
        category: c.category || 'other',
        productName: c.productName || '',
        quantity: c.quantity ? String(c.quantity) : '',
        unit: c.unit || 'т',
        pricePerUnit: c.pricePerUnit ? String(c.pricePerUnit) : '',
        deliveryDate: c.deliveryDate && c.deliveryDate !== 'None' ? c.deliveryDate.split('T')[0] : '',
        contractStartDate: c.contractStartDate && c.contractStartDate !== 'None' ? c.contractStartDate.split('T')[0] : '',
        contractEndDate: c.contractEndDate && c.contractEndDate !== 'None' ? c.contractEndDate.split('T')[0] : '',
        deliveryAddress: c.deliveryAddress || '',
        deliveryMethod: c.deliveryMethod || 'автомобильный транспорт',
        prepaymentPercent: c.prepaymentPercent ? String(c.prepaymentPercent) : '0',
        termsConditions: c.termsConditions || '',
        status: c.status || 'draft',
      });
    } catch {
      toast({ title: 'Ошибка загрузки', variant: 'destructive' });
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const saveContract = async (publish = false) => {
    if (!form.productName.trim()) { toast({ title: 'Укажите название товара', variant: 'destructive' }); return; }
    if (publish) { setIsPublishing(true); } else { setIsSaving(true); }
    try {
      const userId = String(session?.userId || '');
      const res = await fetch(func2url['save-contract'], {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({
          contractId: Number(id),
          ...form,
          totalAmount,
          prepaymentAmount,
          publish,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: publish ? 'Контракт опубликован' : 'Изменения сохранены' });
        navigate(`/contract/${id}`);
      } else {
        toast({ title: 'Ошибка', description: data.error || 'Не удалось сохранить', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка сети', variant: 'destructive' });
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-3xl mx-auto space-y-6">

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/contract/${id}`)}>
              <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
              Назад
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Редактирование контракта</h1>
              <p className="text-sm text-muted-foreground">Вносите изменения и сохраняйте</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Основные данные</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Тип контракта</Label>
                  <Select value={form.contractType} onValueChange={v => set('contractType', v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRACT_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label>Название контракта</Label>
                  <Input className="mt-1" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Автоматически из товара и кол-ва" />
                </div>

                <div className="col-span-2">
                  <Label>Описание</Label>
                  <Textarea className="mt-1" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Дополнительное описание..." />
                </div>

                <div>
                  <Label>Категория</Label>
                  <Select value={form.category} onValueChange={v => set('category', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Товар / услуга</Label>
                  <Input className="mt-1" value={form.productName} onChange={e => set('productName', e.target.value)} placeholder="Название товара" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Количество и цена</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label>Количество</Label>
                  <Input className="mt-1" type="number" min="0" value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>Единица</Label>
                  <Select value={form.unit} onValueChange={v => set('unit', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Цена за единицу (₽)</Label>
                  <Input className="mt-1" type="number" min="0" value={form.pricePerUnit} onChange={e => set('pricePerUnit', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>Предоплата (%)</Label>
                  <Input className="mt-1" type="number" min="0" max="100" value={form.prepaymentPercent} onChange={e => set('prepaymentPercent', e.target.value)} placeholder="0" />
                </div>
                <div className="flex flex-col justify-end">
                  {totalAmount > 0 && (
                    <div className="text-sm">
                      <div className="text-muted-foreground">Сумма:</div>
                      <div className="font-semibold text-base">{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(totalAmount)}</div>
                      {prepaymentAmount > 0 && <div className="text-xs text-muted-foreground">Предоплата: {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(prepaymentAmount)}</div>}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Сроки и доставка</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Дата поставки</Label>
                  <Input className="mt-1" type="date" value={form.deliveryDate} onChange={e => set('deliveryDate', e.target.value)} />
                </div>
                <div>
                  <Label>Начало контракта</Label>
                  <Input className="mt-1" type="date" value={form.contractStartDate} onChange={e => set('contractStartDate', e.target.value)} />
                </div>
                <div>
                  <Label>Окончание контракта</Label>
                  <Input className="mt-1" type="date" value={form.contractEndDate} onChange={e => set('contractEndDate', e.target.value)} />
                </div>
                <div>
                  <Label>Способ доставки</Label>
                  <Select value={form.deliveryMethod} onValueChange={v => set('deliveryMethod', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DELIVERY_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Адрес доставки</Label>
                  <Input className="mt-1" value={form.deliveryAddress} onChange={e => set('deliveryAddress', e.target.value)} placeholder="Город, улица, дом" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Условия</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea rows={4} value={form.termsConditions} onChange={e => set('termsConditions', e.target.value)} placeholder="Особые условия, требования к качеству, порядок оплаты..." />
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end pb-6">
            <Button variant="outline" onClick={() => navigate(`/contract/${id}`)}>Отмена</Button>
            <Button variant="outline" disabled={isSaving} onClick={() => saveContract(false)} className="gap-2">
              {isSaving && <Icon name="Loader2" size={14} className="animate-spin" />}
              Сохранить черновик
            </Button>
            {form.status !== 'open' && (
              <Button disabled={isPublishing} onClick={() => saveContract(true)} className="gap-2">
                {isPublishing && <Icon name="Loader2" size={14} className="animate-spin" />}
                Опубликовать
              </Button>
            )}
            {form.status === 'open' && (
              <Button disabled={isSaving} onClick={() => saveContract(false)} className="gap-2">
                {isSaving && <Icon name="Loader2" size={14} className="animate-spin" />}
                Сохранить изменения
              </Button>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}