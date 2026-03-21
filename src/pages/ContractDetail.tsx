import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import func2url from '../../backend/func2url.json';

interface ContractDetailProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface Contract {
  id: number;
  title: string;
  description: string;
  status: string;
  contractType: string;
  category: string;
  productName: string;
  productSpecs?: Record<string, string>;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
  currency: string;
  deliveryDate: string;
  contractStartDate: string;
  contractEndDate: string;
  deliveryAddress: string;
  deliveryMethod: string;
  prepaymentPercent: number;
  prepaymentAmount: number;
  termsConditions: string;
  sellerFirstName: string;
  sellerLastName: string;
  sellerRating: number;
  buyerFirstName?: string;
  buyerLastName?: string;
  sellerId: number;
  financingAvailable: boolean;
  discountPercent: number;
  viewsCount: number;
  createdAt: string;
  productImages?: string[];
  productVideoUrl?: string;
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Открыт',
  draft: 'Черновик',
  in_progress: 'В работе',
  completed: 'Завершён',
  cancelled: 'Отменён',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  open: 'default',
  draft: 'secondary',
  in_progress: 'secondary',
  completed: 'outline',
  cancelled: 'outline',
};

export default function ContractDetail({ isAuthenticated, onLogout }: ContractDetailProps) {
  useScrollToTop();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const session = getSession();

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [respondOpen, setRespondOpen] = useState(false);
  const [respondComment, setRespondComment] = useState('');
  const [respondPrice, setRespondPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyResponded, setAlreadyResponded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadContract();
  }, [id, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadContract = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      const res = await fetch(`${func2url['contracts-list']}?id=${id}`, {
        headers: { 'X-User-Id': userId || '' },
      });
      if (res.ok) {
        const data = await res.json();
        const found = (data.contracts || []).find((c: Contract) => c.id === Number(id));
        if (found) {
          setContract(found);
        } else {
          toast({ title: 'Контракт не найден', variant: 'destructive' });
          navigate('/trading');
        }
      }
    } catch {
      toast({ title: 'Ошибка загрузки', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('ru-RU') : '—';
  const formatPrice = (p: number) =>
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(p || 0);

  const handleRespond = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      toast({ title: 'Требуется авторизация', variant: 'destructive' });
      navigate('/login');
      return;
    }
    try {
      const res = await fetch(func2url['verification-status'], {
        headers: { 'X-User-Id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        const status = data.verificationStatus || data.verification_status;
        if (status === 'pending') {
          toast({ title: 'Верификация на рассмотрении', description: 'После одобрения верификации вам будет доступен отклик на контракты.', duration: 6000 });
          return;
        }
        if (status !== 'verified') {
          toast({ title: 'Необходима верификация', description: 'Для отклика на контракт необходимо пройти верификацию.', variant: 'destructive' });
          navigate('/verification');
          return;
        }
      }
    } catch {
      toast({ title: 'Ошибка проверки статуса', variant: 'destructive' });
      return;
    }
    if (contract) setRespondPrice(String(contract.pricePerUnit || ''));
    setRespondOpen(true);
  };

  const handleSubmitRespond = async () => {
    if (!contract) return;
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    setIsSubmitting(true);
    try {
      const price = parseFloat(respondPrice) || contract.pricePerUnit;
      const total = price * contract.quantity;
      const res = await fetch(func2url['contracts-list'], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({
          contractId: contract.id,
          comment: respondComment.trim(),
          pricePerUnit: price,
          totalAmount: total,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAlreadyResponded(true);
        setRespondOpen(false);
        setRespondComment('');
        toast({ title: 'Отклик отправлен', description: 'Автор контракта получит уведомление' });
      } else if (res.status === 409) {
        setAlreadyResponded(true);
        setRespondOpen(false);
        toast({ title: 'Вы уже откликнулись', description: 'Ваш отклик на этот контракт уже отправлен' });
      } else {
        toast({ title: 'Ошибка', description: data.error || 'Не удалось отправить отклик', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось отправить отклик', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
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

  if (!contract) return null;

  const isSeller = session?.id === contract.sellerId;
  const isBarter = contract.contractType === 'barter';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <BackButton />
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Заголовок */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{isBarter ? 'Бартер' : 'Форвард'}</Badge>
                <Badge variant={STATUS_VARIANTS[contract.status] || 'default'}>
                  {STATUS_LABELS[contract.status] || contract.status}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold">{contract.title}</h1>
              {contract.description && (
                <p className="text-muted-foreground mt-1">{contract.description}</p>
              )}
            </div>
            {!isSeller && contract.status === 'open' && (
              <Button onClick={handleRespond} className="shrink-0" disabled={alreadyResponded}>
                <Icon name={alreadyResponded ? 'Check' : 'Send'} className="mr-2 h-4 w-4" />
                {alreadyResponded ? 'Отклик отправлен' : 'Откликнуться'}
              </Button>
            )}
          </div>

          {/* Товар */}
          <Card>
            <CardHeader><CardTitle className="text-base">Товар</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Наименование</div>
                  <div className="font-medium">{contract.productName}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Количество</div>
                  <div className="font-medium">{contract.quantity} {contract.unit}</div>
                </div>
                {!isBarter && (
                  <>
                    <div>
                      <div className="text-muted-foreground">Цена за единицу</div>
                      <div className="font-medium">{formatPrice(contract.pricePerUnit)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Общая сумма</div>
                      <div className="font-bold text-lg">{formatPrice(contract.totalAmount)}</div>
                    </div>
                  </>
                )}
                {isBarter && contract.productSpecs && (
                  <>
                    <div>
                      <div className="text-muted-foreground">В обмен (Товар Б)</div>
                      <div className="font-medium">{contract.productSpecs.productNameB}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Кол-во Товара Б</div>
                      <div className="font-medium">{contract.productSpecs.quantityB} {contract.productSpecs.unitB}</div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Сроки и доставка */}
          <Card>
            <CardHeader><CardTitle className="text-base">Сроки и доставка</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Дата поставки</div>
                  <div className="font-medium">{formatDate(contract.deliveryDate)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Срок контракта</div>
                  <div className="font-medium">{formatDate(contract.contractStartDate)} — {formatDate(contract.contractEndDate)}</div>
                </div>
                {contract.deliveryAddress && (
                  <div className="col-span-2">
                    <div className="text-muted-foreground">Адрес доставки</div>
                    <div className="font-medium">{contract.deliveryAddress}</div>
                  </div>
                )}
                {contract.deliveryMethod && (
                  <div>
                    <div className="text-muted-foreground">Способ доставки</div>
                    <div className="font-medium">{contract.deliveryMethod}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Оплата */}
          {!isBarter && (contract.prepaymentPercent > 0 || contract.financingAvailable) && (
            <Card>
              <CardHeader><CardTitle className="text-base">Оплата</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {contract.prepaymentPercent > 0 && (
                    <>
                      <div>
                        <div className="text-muted-foreground">Предоплата</div>
                        <div className="font-medium">{contract.prepaymentPercent}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Сумма предоплаты</div>
                        <div className="font-medium">{formatPrice(contract.prepaymentAmount)}</div>
                      </div>
                    </>
                  )}
                  {contract.financingAvailable && (
                    <div className="col-span-2">
                      <Badge variant="secondary">
                        <Icon name="CreditCard" className="h-3 w-3 mr-1" />
                        Финансирование доступно
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Доп. условия */}
          {contract.termsConditions && (
            <Card>
              <CardHeader><CardTitle className="text-base">Дополнительные условия</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm">{contract.termsConditions}</p>
              </CardContent>
            </Card>
          )}

          {/* Продавец */}
          <Card>
            <CardHeader><CardTitle className="text-base">Поставщик</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Icon name="User" className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium">{contract.sellerFirstName} {contract.sellerLastName}</div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Icon name="Star" className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{(contract.sellerRating || 0).toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Кнопка отклика снизу */}
          {!isSeller && contract.status === 'open' && (
            <Button onClick={handleRespond} className="w-full" size="lg" disabled={alreadyResponded}>
              <Icon name={alreadyResponded ? 'Check' : 'Send'} className="mr-2 h-4 w-4" />
              {alreadyResponded ? 'Отклик отправлен' : 'Откликнуться на контракт'}
            </Button>
          )}

        </div>
      </main>

      <Footer />

      {/* Диалог отклика */}
      <Dialog open={respondOpen} onOpenChange={setRespondOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Отклик на контракт</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!isBarter && (
              <div className="space-y-1.5">
                <Label>Ваша цена за единицу, ₽</Label>
                <Input
                  type="number"
                  min={0}
                  value={respondPrice}
                  onChange={e => setRespondPrice(e.target.value)}
                  placeholder={String(contract?.pricePerUnit || '')}
                />
                {respondPrice && contract && (
                  <p className="text-xs text-muted-foreground">
                    Итого: {formatPrice(parseFloat(respondPrice) * contract.quantity)}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Комментарий <span className="text-muted-foreground">(необязательно)</span></Label>
              <Textarea
                value={respondComment}
                onChange={e => setRespondComment(e.target.value)}
                placeholder="Опишите условия, сроки, особенности вашего предложения..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRespondOpen(false)} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button onClick={handleSubmitRespond} disabled={isSubmitting}>
              {isSubmitting ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Отправка...</>
              ) : (
                <><Icon name="Send" className="mr-2 h-4 w-4" />Отправить отклик</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}