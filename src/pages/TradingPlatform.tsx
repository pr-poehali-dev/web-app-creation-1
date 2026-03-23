import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

import { getSession, saveSession } from '@/utils/auth';
import func2url from '../../backend/func2url.json';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import TradingPlatformFilters from '@/components/trading/TradingPlatformFilters';
import ContractCard from '@/components/trading/ContractCard';
import PullToRefresh from '@/components/PullToRefresh';

interface TradingPlatformProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface Contract {
  id: number;
  contractType: string;
  title: string;
  description: string;
  category: string;
  productName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
  deliveryDate: string;
  status: string;
  sellerFirstName: string;
  sellerLastName: string;
  sellerCompanyName?: string;
  sellerRating: number;
  discountPercent: number;
  financingAvailable: boolean;
  viewsCount: number;
  createdAt: string;
  productImages?: string[];
  productVideoUrl?: string;
}

export default function TradingPlatform({ isAuthenticated, onLogout }: TradingPlatformProps) {
  const navigate = useNavigate();
  useScrollToTop();
  const { toast } = useToast();
  
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [showForwardInfo, setShowForwardInfo] = useState(false);
  const [showBarterInfo, setShowBarterInfo] = useState(false);
  const [currentUser, setCurrentUser] = useState(getSession());

  const loadContracts = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      const response = await fetch(`${func2url['contracts-list']}?status=open`, {
        headers: { 'X-User-Id': userId || '' },
      });
      if (response.ok) {
        const data = await response.json();
        setContracts(data.contracts || []);
      }
    } catch (error) {
      console.error('Failed to load contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadContracts();
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const getContractTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      forward: 'Форвардные предложения',
      'forward-request': 'Форвардные запросы',
      barter: 'Бартер',
    };
    return labels[type] || 'Контракт';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      open: 'default',
      in_progress: 'secondary',
      completed: 'outline',
      cancelled: 'outline',
    };

    const labels: Record<string, string> = {
      open: 'Открыт',
      in_progress: 'В работе',
      completed: 'Завершен',
      cancelled: 'Отменен',
    };

    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = searchQuery === '' ||
      contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.productName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || contract.category === selectedCategory;
    const matchesType = selectedType === 'all' || contract.contractType === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const handleCreateContract = async () => {
    let verificationStatus = currentUser?.verificationStatus;
    
    const userId = localStorage.getItem('userId');
    if (userId) {
      try {
        const res = await fetch(func2url['verification-status'], {
          headers: { 'X-User-Id': userId },
        });
        const data = await res.json();
        const status = data.verificationStatus || data.verification_status;
        if (status) {
          verificationStatus = status;
          const updated = { ...getSession(), verificationStatus };
          saveSession(updated);
          setCurrentUser(updated);
        }
      } catch (e) { /* network unavailable, use cached status */ }
    }

    if (verificationStatus === 'pending') {
      toast({
        title: 'Верификация на рассмотрении',
        description: 'Верификация вашей учётной записи на рассмотрении. После одобрения верификации или отказа вы получите соответствующее уведомление. После успешной верификации вам будут доступны все возможности на ЕРТТП.',
        duration: 8000,
      });
      return;
    }
    if (verificationStatus !== 'verified') {
      setShowVerificationDialog(true);
      return;
    }
    navigate('/create-contract');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <PullToRefresh onRefresh={loadContracts}>
      <main className="container mx-auto px-4 py-8 flex-1">
        <BackButton />
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Торговая площадка</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-muted-foreground">
                    {selectedType === 'barter' ? 'Бартерные контракты для верифицированных участников' : selectedType === 'forward' ? 'Форвардные контракты для верифицированных участников' : selectedType === 'forward-request' ? 'Запросы на закупку для верифицированных участников' : 'Форвардные контракты для верифицированных участников'}
                  </p>
                  {selectedType === 'barter' ? (
                    <button
                      onClick={() => setShowBarterInfo(true)}
                      className="flex items-center gap-1 text-sm text-primary hover:underline underline-offset-2 shrink-0"
                    >
                      <Icon name="BookOpen" size={14} />
                      Что такое бартерные контракты?
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowForwardInfo(true)}
                      className="flex items-center gap-1 text-sm text-primary hover:underline underline-offset-2 shrink-0"
                    >
                      <Icon name="BookOpen" size={14} />
                      Что такое форвардные контракты?
                    </button>
                  )}
                </div>
              </div>
              <Button onClick={handleCreateContract} size="lg">
                <Icon name="Plus" className="mr-2 h-4 w-4" />
                Создать контракт
              </Button>
            </div>

            <TradingPlatformFilters
              searchQuery={searchQuery}
              selectedType={selectedType}
              selectedCategory={selectedCategory}
              onSearchChange={setSearchQuery}
              onTypeChange={setSelectedType}
              onCategoryChange={setSelectedCategory}
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredContracts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Icon name="Package" className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Контракты не найдены</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContracts.map((contract) => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  onCardClick={(id) => navigate(`/contract/${id}`)}
                  getContractTypeLabel={getContractTypeLabel}
                  getStatusBadge={getStatusBadge}
                  formatDate={formatDate}
                  formatPrice={formatPrice}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      </PullToRefresh>

      <Footer />

      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Требуется верификация</DialogTitle>
            <DialogDescription>
              Для создания контрактов необходимо пройти верификацию. Это позволяет подтвердить
              вашу надежность как участника торговой площадки.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowVerificationDialog(false)}>
              Отмена
            </Button>
            <Button onClick={() => { setShowVerificationDialog(false); navigate('/verification'); }}>
              Пройти верификацию
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Модальное окно: что такое форвардные контракты */}
      <Dialog open={showForwardInfo} onOpenChange={setShowForwardInfo}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Icon name="BookOpen" size={20} className="text-primary" />
              Форвардные контракты на ЕРТТП
            </DialogTitle>
            <DialogDescription>
              Инструмент для верифицированных участников — ИП и юридических лиц
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2 text-sm leading-relaxed">

            <p>
              <strong>Форвардный контракт</strong> — это соглашение, по которому продавец обязуется поставить определённый актив (товар, сырьё, продукцию) в будущем, а покупатель — оплатить его заранее или частично до момента поставки. Цена, объём, дата поставки и другие условия фиксируются в момент заключения контракта. Такой инструмент позволяет обеим сторонам снизить риски, связанные с колебаниями рынка, и планировать свою деятельность, защититься от неопределённости, снизить финансовую нагрузку от использования кредитных средств и издержки на маркетинг.
            </p>

            <div>
              <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                <Icon name="Settings" size={16} className="text-primary" />
                Как работает механизм
              </h3>
              <ol className="space-y-2 list-none">
                {[
                  ['Заключение контракта', 'Стороны договариваются о конкретных условиях: каком активе, в каком объёме, по какой цене и срок поставки. В договоре также прописываются условия предоплаты (размер, сроки внесения и т. д.).'],
                  ['Внесение предоплаты', 'Покупатель перечисляет полную сумму или часть суммы продавцу до момента поставки. Это может быть фиксированная сумма с дисконтом (со скидкой) от общей стоимости контракта или иной согласованный вариант.'],
                  ['Исполнение обязательств', 'В оговорённую дату продавец поставляет товар, а покупатель оплачивает оставшуюся часть суммы (если предоплата была частичной).'],
                ].map(([title, text], i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold mt-0.5">{i + 1}</span>
                    <div><span className="font-medium">{title}.</span> {text}</div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <h3 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                  <Icon name="TrendingUp" size={15} className="text-emerald-600" />
                  Преимущества для поставщика
                </h3>
                <ul className="space-y-1.5 text-emerald-900">
                  {[
                    ['Гарантированный доход', 'Предоплата обеспечивает денежный поток до момента поставки.'],
                    ['Гарантированный сбыт', 'Продукт будет реализован по заранее оговорённой цене и объёме.'],
                    ['Планирование', 'Точный расчёт затрат и объёмов производства заранее.'],
                    ['Снижение риска неплатежа', 'Предоплата снижает вероятность отказа покупателя от сделки.'],
                  ].map(([title, text], i) => (
                    <li key={i} className="flex gap-2 text-xs">
                      <Icon name="Check" size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span><span className="font-medium">{title}.</span> {text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Icon name="ShoppingCart" size={15} className="text-blue-600" />
                  Преимущества для покупателя
                </h3>
                <ul className="space-y-1.5 text-blue-900">
                  {[
                    ['Фиксация цены', 'Защита от роста стоимости товара к моменту поставки.'],
                    ['Гарантированная поставка', 'Уверенность в получении товара в оговорённый срок.'],
                    ['Планирование бюджета', 'Заранее известные условия позволяют точнее прогнозировать расходы.'],
                    ['Стабильность поставок', 'Особенно важно для дефицитных или сезонных товаров.'],
                  ].map(([title, text], i) => (
                    <li key={i} className="flex gap-2 text-xs">
                      <Icon name="Check" size={13} className="text-blue-500 mt-0.5 shrink-0" />
                      <span><span className="font-medium">{title}.</span> {text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                <Icon name="Lightbulb" size={16} className="text-amber-500" />
                Примеры
              </h3>
              <div className="space-y-3">
                <div className="rounded-lg border bg-muted/40 p-4">
                  <p className="font-medium mb-1">Пример 1. Картофель</p>
                  <p className="text-muted-foreground mb-2">Фермер заключает с перерабатывающим предприятием форвардный контракт на поставку 10 тонн картофеля через три месяца по цене 50 руб./кг. Покупатель вносит предоплату 30% (150 000 ₽), остальное — после поставки.</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="font-medium text-emerald-700">Выгода фермера:</span> получает 150 000 ₽ сразу для финансирования выращивания; защищён от падения цен; гарантирован сбыт.</div>
                    <div><span className="font-medium text-blue-700">Выгода покупателя:</span> фиксирует цену; гарантирует поставку необходимого сырья в нужное время.</div>
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/40 p-4">
                  <p className="font-medium mb-1">Пример 2. Говядина</p>
                  <p className="text-muted-foreground mb-2">Фермер заключает контракт с 70% предоплатой в мае на поставку говядины в ноябре по дисконтной цене 800 руб./кг на 300 кг (240 000 ₽). В мае получает 70% — 168 000 ₽.</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="font-medium text-emerald-700">Выгода фермера:</span> решает финансовые затруднения без кредита; точно знает объём производства.</div>
                    <div><span className="font-medium text-blue-700">Выгода покупателя:</span> фиксирует цену со скидкой; гарантия получения товара в срок.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <h3 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                <Icon name="AlertTriangle" size={15} className="text-orange-600" />
                Риски
              </h3>
              <ul className="space-y-1.5 text-orange-900 text-xs">
                <li className="flex gap-2"><Icon name="AlertCircle" size={13} className="shrink-0 mt-0.5 text-orange-500" /><span><span className="font-medium">Для поставщика:</span> если рыночная цена товара резко вырастет, он потеряет потенциальную прибыль.</span></li>
                <li className="flex gap-2"><Icon name="AlertCircle" size={13} className="shrink-0 mt-0.5 text-orange-500" /><span><span className="font-medium">Для покупателя:</span> если рыночная цена упадёт, он заплатит больше, чем мог бы на открытом рынке.</span></li>
                <li className="flex gap-2"><Icon name="AlertCircle" size={13} className="shrink-0 mt-0.5 text-orange-500" /><span><span className="font-medium">Для обеих сторон:</span> риск неисполнения обязательств контрагентом. Важно обращать внимание на срок деятельности на рынке и надёжность контрагента, прописывать условия ответственности и учитывать возможные изменения рыночных условий.</span></li>
              </ul>
            </div>

            <p className="text-muted-foreground italic border-t pt-4">
              Таким образом, поставочные форвардные контракты с предоплатой на локальном рынке — это инструмент, который помогает сторонам снизить финансовые нагрузки и риски, а также запланировать деятельность и объём производства, но требует внимательного подхода к выбору условий сделки и анализу контрагентов.
            </p>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowForwardInfo(false)}>Понятно</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Модальное окно: что такое бартерные контракты */}
      <Dialog open={showBarterInfo} onOpenChange={setShowBarterInfo}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Icon name="ArrowLeftRight" size={20} className="text-primary" />
              Бартерные контракты на ЕРТТП
            </DialogTitle>
            <DialogDescription>
              Обмен товарами, работами или услугами без денег
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2 text-sm leading-relaxed">

            <p>
              <strong>Бартер</strong> — это обмен товарами, работами или услугами без денег.
            </p>

            <div>
              <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                <Icon name="Calculator" size={16} className="text-primary" />
                Как учитывать бартер на упрощёнке
              </h3>
              <div className="space-y-3">
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="font-medium mb-1">УСН «Доходы»</p>
                  <p className="text-muted-foreground">Налог считают с рыночной стоимости полученных товаров, работ или услуг. Например, предприниматель получил товары на 100 000 ₽ и оказал услуги на ту же сумму — он платит 6%, то есть 6 000 ₽.</p>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="font-medium mb-1">УСН «Доходы минус расходы»</p>
                  <p className="text-muted-foreground">Налог платят с разницы между выручкой и затратами. При равноценном обмене (100 000 ₽ ↔ 100 000 ₽) налог не возникает. Без первичных документов налоговая не примет расходы, доначислит налоги и оштрафует.</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                <Icon name="BookOpen" size={16} className="text-primary" />
                Нужно ли делать записи в КУДиР
              </h3>
              <p className="text-muted-foreground mb-2">Бартерные операции — хозяйственные, поэтому в КУДиР делают соответствующие записи.</p>
              <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1">
                <p className="font-medium">Пример записей за 10 июня:</p>
                <p>📥 10.06.2025: получение товара от ООО «Партнёр» по договору бартера №7 от 08.06.2025. Сумма дохода: 50 000 ₽.</p>
                <p>📤 10.06.2025: оказание услуг по договору бартера №7 от 08.06.2025. Сумма расхода: 50 000 ₽.</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                <Icon name="FileText" size={16} className="text-primary" />
                Как оформлять документы для бартера
              </h3>
              <p className="text-muted-foreground mb-2">Если обмениваетесь товарами — договор мены. Если в сделку включены работы или услуги — бартерное соглашение или договор поставки с указанием натуральной формы расчётов.</p>
              <ul className="space-y-1 text-xs">
                {['Наименование обмениваемых товаров, работ или услуг', 'Количество и объём; цены за единицу и общую стоимость', 'Порядок обмена и сроки исполнения', 'Условие о равноценности или порядок денежной доплаты'].map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <Icon name="Check" size={13} className="text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                <Icon name="TrendingUp" size={16} className="text-primary" />
                Как оценивать стоимость при бартере
              </h3>
              <p className="text-muted-foreground mb-2">Товары, работы и услуги оцениваются по рыночной стоимости (п. 3 ст. 105.3 НК РФ). Для подтверждения стоимости используйте прайс-листы, коммерческие предложения, данные Росстата.</p>
              <div className="rounded-lg border bg-muted/40 p-3 text-xs">
                <p className="font-medium mb-1">Пример неравноценного бартера:</p>
                <p className="text-muted-foreground">Фермер поставляет мясо говядины в ноябре на 110 000 ₽ в обмен на строительные материалы на 100 000 ₽. Разницу магазин обосновывает доставкой за свой счёт (10 000 ₽).</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                <Icon name="Settings" size={16} className="text-primary" />
                Как учитывать бартер на общем режиме (ОСНО)
              </h3>
              <p className="text-muted-foreground mb-3">Доходом признаётся стоимость полученного, расходом — стоимость отданного. Разница — налоговая база для налога на прибыль или НДФЛ.</p>
              <div className="space-y-2">
                {[
                  ['Компания по кондиционерам', 'Ремонт (150 000 ₽) меняет на мебель (140 000 ₽). Налог с разницы 10 000 ₽.'],
                  ['СПХ и дорожная компания', 'Мясо в ноябре (300 000 ₽) в обмен на ремонт дороги (300 000 ₽). Доход = расход, налог не возникает.'],
                  ['ИП «Столяр»', '10 стульев (35 000 ₽) в обмен на 2 куба пиломатериалов (40 000 ₽). НДФЛ с разницы 5 000 ₽.'],
                ].map(([title, text], i) => (
                  <div key={i} className="rounded-lg border bg-muted/40 p-3 text-xs">
                    <p className="font-medium mb-0.5">{title}</p>
                    <p className="text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                <Icon name="Receipt" size={16} className="text-primary" />
                Как исчислять НДС при бартере
              </h3>
              <p className="text-muted-foreground mb-2">Бартерные сделки облагаются НДС в общем порядке с рыночной стоимости без НДС и акцизов.</p>
              <div className="rounded-lg border bg-muted/40 p-3 text-xs">
                <p className="font-medium mb-1">Пример:</p>
                <p className="text-muted-foreground">Ремонт (120 000 ₽) меняют на мебель (120 000 ₽). Исходящий НДС 22% = 26 400 ₽. Входящий НДС = 26 400 ₽. Обязательств перед бюджетом нет.</p>
              </div>
            </div>

            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <h3 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                <Icon name="AlertTriangle" size={15} className="text-orange-600" />
                Нюансы и риски
              </h3>
              <ul className="space-y-1.5 text-orange-900 text-xs">
                {[
                  'Налоговая внимательно контролирует бартер. Если оформить неправильно — доначислит налоги и оштрафует.',
                  'Бартер на крупные суммы с недавно зарегистрированной фирмой без сотрудников и офиса вызовет подозрения.',
                  'Если стоимость отличается от рыночной на 20–30% и более, обмен могут признать фиктивным.',
                  'Сделки между взаимозависимыми лицами — под особым контролем. Заранее готовьте прайс-листы и обоснования.',
                  'Если у контрагента нет офиса, сайта, сотрудников и отзывов — откажитесь от сделки.',
                ].map((text, i) => (
                  <li key={i} className="flex gap-2">
                    <Icon name="AlertCircle" size={13} className="shrink-0 mt-0.5 text-orange-500" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          <DialogFooter>
            <Button onClick={() => setShowBarterInfo(false)}>Понятно</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}