import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { notifyContractUpdated } from '@/utils/dataSync';
import func2url from '../../backend/func2url.json';
import { generateContractHtml, printContractAsPdf } from '@/utils/contractGenerator';

interface CreateContractProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const CATEGORIES = [
  { value: 'dairy',        label: 'Молочная продукция' },
  { value: 'food',         label: 'Продукты питания' },
  { value: 'agriculture',  label: 'Сельхозпродукция (зерновые, овощи, фрукты)' },
  { value: 'construction', label: 'Стройматериалы' },
  { value: 'durable',      label: 'Товары длительного пользования' },
  { value: 'local',        label: 'Местная продукция' },
  { value: 'other',        label: 'Прочее' },
];

// Ключевые слова для автоопределения категории
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  dairy:        ['молок', 'творог', 'кефир', 'сметан', 'сыр', 'масл', 'ряженк', 'йогурт', 'сливк', 'простоквашн'],
  food:         ['хлеб', 'мука', 'мясо', 'говядин', 'свинин', 'птиц', 'курин', 'рыб', 'яйц', 'сахар', 'соль', 'масло', 'овощ', 'фрукт', 'картоф', 'помидор', 'огурц', 'морков', 'свекл', 'лук', 'крупа', 'рис', 'гречк', 'макарон'],
  agriculture:  ['зерн', 'пшениц', 'ячмен', 'овес', 'кукуруз', 'подсолнечник', 'рапс', 'соя', 'сено', 'силос', 'комбикорм', 'семен'],
  construction: ['кирпич', 'цемент', 'бетон', 'песок', 'щебен', 'арматур', 'металл', 'труб', 'профил', 'плит', 'ламинат', 'паркет', 'обои', 'краск', 'стекл', 'пенобло', 'газобло', 'брус', 'доск', 'пиломатер'],
  durable:      ['техник', 'оборудован', 'станок', 'трактор', 'комбайн', 'автомобил', 'прицеп', 'насос', 'генератор', 'холодильник', 'морозильник', 'мебел'],
};

function detectCategory(productName: string): string {
  const lower = productName.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return cat;
  }
  return '';
}

const UNITS = ['т', 'кг', 'л', 'м³', 'м²', 'шт', 'упак', 'пал', 'услуга'];

export default function CreateContract({ isAuthenticated, onLogout }: CreateContractProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isCheckingVerification, setIsCheckingVerification] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedDocx, setGeneratedDocx] = useState<{ base64: string; url: string; filename: string } | null>(null);
  const [contractHtml, setContractHtml] = useState<string>('');
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [sellerProfile, setSellerProfile] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    contractType: 'forward',
    category: '',
    title: '',
    description: '',
    productName: '',
    quantity: '',
    unit: 'т',
    pricePerUnit: '',
    deliveryDate: '',
    contractStartDate: new Date().toISOString().split('T')[0],
    contractEndDate: '',
    deliveryAddress: '',
    deliveryMethod: 'автомобильный транспорт',
    prepaymentPercent: '0',
    termsConditions: '',
    // Бартер — товар Б
    productNameB: '',
    quantityB: '',
    unitB: 'т',
    categoryB: '',
    // Контрагент (покупатель)
    counterpartyName: '',
    counterpartyCompany: '',
    counterpartyInn: '',
    counterpartyCity: '',
    counterpartyPhone: '',
    counterpartyEmail: '',
    counterpartyType: 'individual',
  });

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    checkVerification();
    loadProfile();
  }, [isAuthenticated]);

  const loadProfile = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;
      const res = await fetch(func2url['admin-users'] + `?id=${userId}`, { headers: { 'X-User-Id': userId } });
      if (res.ok) {
        const data = await res.json();
        const u = data.user || data;
        setSellerProfile({
          id: String(u.id || userId),
          firstName: u.firstName || u.first_name || '',
          lastName: u.lastName || u.last_name || '',
          middleName: u.middleName || u.middle_name || '',
          email: u.email || '',
          phone: u.phone || '',
          userType: u.userType || u.user_type || 'individual',
          companyName: u.companyName || u.company_name || '',
          inn: u.inn || '',
          ogrnip: u.ogrnip || '',
          ogrn: u.ogrn || '',
          legalAddress: u.legalAddress || u.legal_address || '',
          city: u.city || '',
          region: u.region || '',
          directorName: u.directorName || u.director_name || '',
        });
      }
    } catch (e) { console.error(e); }
  };

  const checkVerification = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) { setIsCheckingVerification(false); return; }
      const res = await fetch(func2url['verification-status'], { headers: { 'X-User-Id': userId } });
      if (res.ok) {
        const data = await res.json();
        const status = data.verificationStatus || data.verification_status;
        if (status === 'pending') {
          toast({ title: 'Верификация на рассмотрении', description: 'После одобрения вам будут доступны все возможности.', duration: 6000 });
          navigate('/trading');
          return;
        }
        if (status !== 'verified') {
          toast({ title: 'Требуется верификация', description: 'Для создания контрактов необходимо пройти верификацию.', variant: 'destructive' });
          navigate('/verification');
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    setIsCheckingVerification(false);
  };

  const set = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleProductNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      productName: value,
      category: prev.category || detectCategory(value),
      title: prev.title || (value ? `Поставка: ${value}` : ''),
    }));
  };

  const handleProductNameBChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      productNameB: value,
      categoryB: prev.categoryB || detectCategory(value),
    }));
  };

  const totalAmount = formData.quantity && formData.pricePerUnit
    ? parseFloat(formData.quantity) * parseFloat(formData.pricePerUnit)
    : 0;

  const prepaymentAmount = totalAmount * (parseFloat(formData.prepaymentPercent || '0') / 100);

  const validate = () => {
    if (!formData.productName) { toast({ title: 'Ошибка', description: 'Укажите название товара', variant: 'destructive' }); return false; }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) { toast({ title: 'Ошибка', description: 'Укажите количество товара', variant: 'destructive' }); return false; }
    if (formData.contractType === 'forward' && (!formData.pricePerUnit || parseFloat(formData.pricePerUnit) <= 0)) {
      toast({ title: 'Ошибка', description: 'Укажите цену за единицу', variant: 'destructive' }); return false;
    }
    if (formData.contractType === 'barter' && !formData.productNameB) {
      toast({ title: 'Ошибка', description: 'Укажите товар для обмена (Товар Б)', variant: 'destructive' }); return false;
    }
    if (!formData.deliveryDate) { toast({ title: 'Ошибка', description: 'Укажите дату поставки', variant: 'destructive' }); return false; }
    if (!formData.category) { toast({ title: 'Ошибка', description: 'Выберите категорию товара', variant: 'destructive' }); return false; }
    return true;
  };

  const handleGenerate = () => {
    if (!validate()) return;
    setIsGenerating(true);

    const buyer = {
      firstName: formData.counterpartyName,
      lastName: '',
      companyName: formData.counterpartyCompany,
      inn: formData.counterpartyInn,
      city: formData.counterpartyCity,
      phone: formData.counterpartyPhone,
      email: formData.counterpartyEmail,
      userType: formData.counterpartyType,
    };

    const html = generateContractHtml(
      { ...formData, totalAmount, prepaymentAmount, totalAmountB: totalAmount },
      sellerProfile,
      buyer,
    );
    setContractHtml(html);

    // Попробуем также получить DOCX через backend (если уже задеплоен)
    const backendUrl = (func2url as Record<string, string>)['generate-contract'];
    if (backendUrl) {
      const userId = localStorage.getItem('userId');
      fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId || '' },
        body: JSON.stringify({ data: { ...formData, totalAmount, prepaymentAmount, totalAmountB: totalAmount } }),
      })
        .then(r => r.json())
        .then(data => { if (data.success) setGeneratedDocx({ base64: data.docxBase64, url: data.docxUrl, filename: data.filename }); })
        .catch(() => {});
    }

    setStep('preview');
    setIsGenerating(false);
  };

  const downloadPdf = () => {
    if (contractHtml) printContractAsPdf(contractHtml);
  };

  const downloadDocx = () => {
    if (!generatedDocx) {
      toast({ title: 'DOCX недоступен', description: 'Скачайте PDF через кнопку «Скачать PDF (печать)»', duration: 4000 });
      return;
    }
    const blob = new Blob([Uint8Array.from(atob(generatedDocx.base64), c => c.charCodeAt(0))], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generatedDocx.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveToContracts = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const userId = localStorage.getItem('userId');
      const contractUrl = '1eb3dd30-04c6-4570-97ff-73c5403573f5';
      const res = await fetch(`https://functions.poehali.dev/${contractUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId || '' },
        body: JSON.stringify({
          ...formData,
          totalAmount,
          prepaymentAmount,
          documentUrl: generatedDocx?.url || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        notifyContractUpdated(data.contractId);
        toast({ title: 'Контракт сохранён', description: 'Контракт добавлен в раздел «Мои контракты»' });
        navigate('/trading');
      } else {
        toast({ title: 'Ошибка', description: data.error || 'Не удалось сохранить контракт', variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Ошибка', description: 'Не удалось сохранить контракт', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingVerification) {
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

  const isBarter = formData.contractType === 'barter';
  const categoryLabel = CATEGORIES.find(c => c.value === formData.category)?.label || '';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto space-y-6">

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => step === 'preview' ? setStep('form') : navigate(-1)}>
              <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
              {step === 'preview' ? 'К форме' : 'Назад'}
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Создание контракта</h1>
              <p className="text-sm text-muted-foreground">
                {step === 'form' ? 'Заполните данные — документ сформируется автоматически по ГК РФ' : 'Документ сформирован — скачайте и подпишите'}
              </p>
            </div>
          </div>

          {step === 'form' && (
            <div className="space-y-6">
              {/* Тип контракта */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon name="FileText" size={18} />
                    Тип договора
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { value: 'forward', label: 'Форвардный контракт', desc: 'Поставка товара в будущем по фиксированной цене (ГК РФ ст. 454–524)', icon: 'TrendingUp' },
                      { value: 'barter', label: 'Договор на бартер (мену)', desc: 'Обмен товарами без денежного расчёта (ГК РФ ст. 567–571)', icon: 'ArrowLeftRight' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => set('contractType', opt.value)}
                        className={`text-left p-4 rounded-lg border-2 transition-all ${formData.contractType === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon name={opt.icon as 'TrendingUp'} size={16} className={formData.contractType === opt.value ? 'text-primary' : 'text-muted-foreground'} />
                          <span className="font-semibold text-sm">{opt.label}</span>
                          {formData.contractType === opt.value && <Badge variant="default" className="ml-auto text-xs">Выбран</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Товар А */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon name="Package" size={18} />
                    {isBarter ? 'Товар А (ваш товар)' : 'Товар и условия поставки'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Название товара *</Label>
                      <Input
                        value={formData.productName}
                        onChange={e => handleProductNameChange(e.target.value)}
                        placeholder="Молоко цельное, пшеница 3 кл., кирпич М150..."
                      />
                      {formData.category && (
                        <p className="text-xs text-primary flex items-center gap-1">
                          <Icon name="Sparkles" size={12} />
                          Категория определена автоматически: {categoryLabel}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label>Категория товара *</Label>
                      <Select value={formData.category} onValueChange={v => set('category', v)}>
                        <SelectTrigger><SelectValue placeholder="Выберите категорию" /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label>Количество *</Label>
                      <Input type="number" step="0.001" min="0" value={formData.quantity} onChange={e => set('quantity', e.target.value)} placeholder="100" />
                    </div>
                    <div className="space-y-1">
                      <Label>Единица</Label>
                      <Select value={formData.unit} onValueChange={v => set('unit', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    {!isBarter && (
                      <>
                        <div className="space-y-1">
                          <Label>Цена за {formData.unit} (₽) *</Label>
                          <Input type="number" step="0.01" min="0" value={formData.pricePerUnit} onChange={e => set('pricePerUnit', e.target.value)} placeholder="15000" />
                        </div>
                        <div className="space-y-1">
                          <Label>Итого (₽)</Label>
                          <Input value={totalAmount ? totalAmount.toLocaleString('ru-RU', { maximumFractionDigits: 2 }) : '0'} disabled />
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Товар Б (только бартер) */}
              {isBarter && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="PackageOpen" size={18} />
                      Товар Б (товар контрагента)
                    </CardTitle>
                    <CardDescription>Что вы получаете в обмен</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Название товара Б *</Label>
                        <Input
                          value={formData.productNameB}
                          onChange={e => handleProductNameBChange(e.target.value)}
                          placeholder="Название товара для обмена..."
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Категория товара Б</Label>
                        <Select value={formData.categoryB} onValueChange={v => set('categoryB', v)}>
                          <SelectTrigger><SelectValue placeholder="Выберите категорию" /></SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Количество Б *</Label>
                        <Input type="number" step="0.001" min="0" value={formData.quantityB} onChange={e => set('quantityB', e.target.value)} placeholder="100" />
                      </div>
                      <div className="space-y-1">
                        <Label>Единица Б</Label>
                        <Select value={formData.unitB} onValueChange={v => set('unitB', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Оценочная стоимость товара А (₽) — для раздела доплаты</Label>
                      <Input type="number" step="0.01" min="0" value={formData.pricePerUnit} onChange={e => set('pricePerUnit', e.target.value)} placeholder="500000" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Сроки */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon name="Calendar" size={18} />
                    Сроки
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label>Дата начала контракта</Label>
                      <Input type="date" value={formData.contractStartDate} onChange={e => set('contractStartDate', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Дата поставки / обмена *</Label>
                      <Input type="date" value={formData.deliveryDate} onChange={e => set('deliveryDate', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Дата окончания контракта</Label>
                      <Input type="date" value={formData.contractEndDate} onChange={e => set('contractEndDate', e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Доставка и предоплата */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon name="Truck" size={18} />
                    Доставка и оплата
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Адрес доставки</Label>
                      <Input value={formData.deliveryAddress} onChange={e => set('deliveryAddress', e.target.value)} placeholder="г. Москва, ул. Промышленная, 1" />
                    </div>
                    <div className="space-y-1">
                      <Label>Способ доставки</Label>
                      <Select value={formData.deliveryMethod} onValueChange={v => set('deliveryMethod', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="автомобильный транспорт">Автомобильный транспорт</SelectItem>
                          <SelectItem value="железнодорожный транспорт">Железнодорожный транспорт</SelectItem>
                          <SelectItem value="самовывоз">Самовывоз</SelectItem>
                          <SelectItem value="авиатранспорт">Авиатранспорт</SelectItem>
                          <SelectItem value="морской/речной транспорт">Морской / речной транспорт</SelectItem>
                          <SelectItem value="смешанная перевозка">Смешанная перевозка</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {!isBarter && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Предоплата (%)</Label>
                        <Input type="number" step="1" min="0" max="100" value={formData.prepaymentPercent} onChange={e => set('prepaymentPercent', e.target.value)} placeholder="30" />
                      </div>
                      <div className="space-y-1">
                        <Label>Сумма предоплаты (₽)</Label>
                        <Input value={prepaymentAmount ? prepaymentAmount.toLocaleString('ru-RU', { maximumFractionDigits: 2 }) : '0'} disabled />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Контрагент */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon name="Users" size={18} />
                    Контрагент ({isBarter ? 'Сторона 2' : 'Покупатель'})
                  </CardTitle>
                  <CardDescription>Заполните, если контрагент уже известен. Можно оставить пустым — поля будут для ручного заполнения.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>ФИО / Наименование</Label>
                      <Input value={formData.counterpartyName} onChange={e => set('counterpartyName', e.target.value)} placeholder="Иванов Иван Иванович / ООО «Ромашка»" />
                    </div>
                    <div className="space-y-1">
                      <Label>ИНН</Label>
                      <Input value={formData.counterpartyInn} onChange={e => set('counterpartyInn', e.target.value)} placeholder="7701234567" />
                    </div>
                    <div className="space-y-1">
                      <Label>Телефон</Label>
                      <Input value={formData.counterpartyPhone} onChange={e => set('counterpartyPhone', e.target.value)} placeholder="+7 (900) 123-45-67" />
                    </div>
                    <div className="space-y-1">
                      <Label>Email</Label>
                      <Input type="email" value={formData.counterpartyEmail} onChange={e => set('counterpartyEmail', e.target.value)} placeholder="partner@example.com" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Доп. условия */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon name="ClipboardList" size={18} />
                    Название и дополнительные условия
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label>Название контракта (для «Моих контрактов»)</Label>
                    <Input value={formData.title} onChange={e => set('title', e.target.value)} placeholder="Например: Поставка молока, октябрь 2026" />
                  </div>
                  <div className="space-y-1">
                    <Label>Дополнительные условия (будут добавлены в контракт)</Label>
                    <Textarea value={formData.termsConditions} onChange={e => set('termsConditions', e.target.value)} rows={3} placeholder="Особые требования к качеству, упаковке, документации..." />
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 pb-4">
                <Button onClick={handleGenerate} disabled={isGenerating} className="flex-1">
                  {isGenerating ? (
                    <><Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />Формирую документ...</>
                  ) : (
                    <><Icon name="FileDown" className="mr-2 h-4 w-4" />Сформировать контракт</>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/trading')}>Отмена</Button>
              </div>
            </div>
          )}

          {step === 'preview' && contractHtml && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="CheckCircle" size={20} className="text-green-500" />
                  Документ сформирован
                </CardTitle>
                <CardDescription>
                  {isBarter ? 'Договор мены (бартера)' : 'Форвардный контракт'} по ГК РФ готов.
                  Распечатайте/скачайте, подпишите и сохраните в «Мои контракты».
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon name="Info" size={14} />
                    <span>Документ составлен по шаблону ГК РФ с вашими данными из профиля</span>
                  </div>
                  <div><span className="font-medium">Тип:</span> {isBarter ? 'Договор мены (бартер)' : 'Форвардный контракт'}</div>
                  <div><span className="font-medium">Товар:</span> {formData.productName} — {formData.quantity} {formData.unit}</div>
                  {isBarter && <div><span className="font-medium">В обмен:</span> {formData.productNameB} — {formData.quantityB} {formData.unitB}</div>}
                  {!isBarter && <div><span className="font-medium">Сумма:</span> {totalAmount.toLocaleString('ru-RU')} ₽</div>}
                  <div><span className="font-medium">Дата поставки:</span> {formData.deliveryDate}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button onClick={downloadPdf} className="w-full">
                    <Icon name="Printer" className="mr-2 h-4 w-4" />
                    Скачать / Распечатать PDF
                  </Button>
                  <Button onClick={downloadDocx} variant="outline" className="w-full" disabled={!generatedDocx}>
                    <Icon name="FileDown" className="mr-2 h-4 w-4" />
                    {generatedDocx ? 'Скачать DOCX (Word)' : 'DOCX формируется...'}
                  </Button>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm text-muted-foreground">После подписания сохраните контракт в систему для обмена с контрагентом:</p>
                  <div className="flex gap-3">
                    <Button onClick={handleSaveToContracts} disabled={isSubmitting} className="flex-1">
                      {isSubmitting ? (
                        <><Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />Сохраняю...</>
                      ) : (
                        <><Icon name="Save" className="mr-2 h-4 w-4" />Сохранить в Мои контракты</>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setStep('form')}>
                      <Icon name="Pencil" className="mr-2 h-4 w-4" />
                      Изменить данные
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}