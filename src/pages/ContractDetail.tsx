import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import func2url from '../../backend/func2url.json';

import ContractDetailInfo from '@/components/contract-detail/ContractDetailInfo';
import ContractDetailResponses from '@/components/contract-detail/ContractDetailResponses';
import ContractRespondDialog from '@/components/contract-detail/ContractRespondDialog';
import ContractNegotiationModal from '@/components/contract/ContractNegotiationModal';

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
  sellerCompanyName?: string;
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
  responseId?: number;
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
  const location = useLocation();
  const { toast } = useToast();
  const session = getSession();

  const locationState = location.state as { responseId?: number; alreadyResponded?: boolean } | null;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [respondOpen, setRespondOpen] = useState(false);
  const [respondComment, setRespondComment] = useState('');
  const [respondPrice, setRespondPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyResponded, setAlreadyResponded] = useState(locationState?.alreadyResponded ?? false);
  const [myResponseId, setMyResponseId] = useState<number | null>(locationState?.responseId ?? null);
  const [negotiationOpen, setNegotiationOpen] = useState(false);
  const negotiationResponseId = useRef<number | null>(locationState?.responseId ?? null);
  const [responses, setResponses] = useState<{id: number; firstName: string; lastName: string; phone: string; email: string; pricePerUnit: number; totalAmount: number; comment: string; status: string; createdAt: string}[]>([]);

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
          if (userId && found.sellerId === Number(userId)) {
            loadResponses(found.id, userId);
          } else if (userId && found.sellerId !== Number(userId)) {
            // responseId приходит прямо в объекте контракта (если бэкенд актуален)
            if (found.responseId) {
              setAlreadyResponded(true);
              setMyResponseId(found.responseId);
              negotiationResponseId.current = found.responseId;
            } else {
              // fallback: запрашиваем через отдельную надёжную функцию
              checkMyResponse(Number(id), userId);
            }
          }
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

  const checkMyResponse = async (contractId: number, userId: string): Promise<number | null> => {
    try {
      const res = await fetch(`${func2url['contract-response-id']}?contractId=${contractId}`, {
        headers: { 'X-User-Id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        const rid = data.responseId ?? null;
        if (rid) {
          setAlreadyResponded(true);
          setMyResponseId(rid);
          negotiationResponseId.current = rid;
        }
        return rid;
      }
    } catch {
      // тихо игнорируем
    }
    return null;
  };

  const loadResponses = async (contractId: number, userId: string) => {
    try {
      const res = await fetch(`${func2url['contracts-list']}?responses=true&contractId=${contractId}`, {
        headers: { 'X-User-Id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        setResponses(data.responses || []);
      }
    } catch {
      // тихо игнорируем
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
        const userType = data.userType;
        if (contract?.contractType === 'barter' && userType && ['individual', 'self-employed'].includes(userType)) {
          toast({ title: 'Участие в бартере недоступно', description: 'Участвовать в бартерных контрактах могут только ИП и юридические лица.', duration: 8000 });
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
      const qp = new URLSearchParams({
        action: 'respond',
        contractId: String(contract.id),
        pricePerUnit: String(price),
        totalAmount: String(total),
        comment: respondComment.trim(),
      });
      const res = await fetch(`${func2url['contracts-list']}?${qp.toString()}`, {
        method: 'GET',
        headers: { 'X-User-Id': userId },
      });
      const data = await res.json();
      if (res.ok) {
        setAlreadyResponded(true);
        setRespondOpen(false);
        setRespondComment('');
        toast({ title: 'Отклик отправлен', description: 'Переходим в раздел «Мои контракты» → «Мои отклики»' });
        setTimeout(() => navigate('/my-contracts?tab=responses'), 1500);
      } else if (res.status === 409) {
        setAlreadyResponded(true);
        setRespondOpen(false);
        toast({
          title: 'Вы уже откликнулись на этот контракт',
          description: 'Ваш отклик уже отправлен. Перейдите в «Мои контракты» → «Мои отклики».',
        });
        setTimeout(() => navigate('/my-contracts?tab=responses'), 2500);
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
            <div className="flex gap-2 shrink-0">
              {isSeller && ['draft', 'open'].includes(contract.status) && (
                <Button variant="outline" onClick={() => navigate(`/edit-contract/${contract.id}`)}>
                  <Icon name="Pencil" className="mr-2 h-4 w-4" />
                  Редактировать
                </Button>
              )}
              {!isSeller && contract.status === 'open' && (
                alreadyResponded ? (
                  <Button variant="default" onClick={async () => {
                    let rid = negotiationResponseId.current;
                    if (!rid) {
                      const userId = localStorage.getItem('userId');
                      if (userId) rid = await checkMyResponse(Number(id), userId);
                    }
                    if (rid) { negotiationResponseId.current = rid; setMyResponseId(rid); setNegotiationOpen(true); }
                    else toast({ title: 'Не удалось найти ваш отклик', variant: 'destructive' });
                  }}>
                    <Icon name="MessageSquare" className="mr-2 h-4 w-4" />
                    Переговоры
                  </Button>
                ) : (
                  <Button onClick={handleRespond}>
                    <Icon name="Send" className="mr-2 h-4 w-4" />
                    Откликнуться
                  </Button>
                )
              )}
            </div>
          </div>

          {isSeller ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="details" className="flex-1">
                  <Icon name="FileText" size={14} className="mr-1.5" />
                  Детали
                </TabsTrigger>
                <TabsTrigger value="responses" className="flex-1">
                  <Icon name="Users" size={14} className="mr-1.5" />
                  Отклики
                  {responses.length > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold min-w-[18px] h-[18px] px-1">
                      {responses.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4 space-y-6">
                <ContractDetailInfo
                  contract={contract}
                  isBarter={isBarter}
                  formatDate={formatDate}
                  formatPrice={formatPrice}
                />
              </TabsContent>

              <TabsContent value="responses" className="mt-4">
                <ContractDetailResponses
                  responses={responses}
                  isSeller={isSeller}
                  contractStatus={contract.status}
                  contractTitle={contract.title}
                  onRefresh={() => {
                    const userId = localStorage.getItem('userId');
                    if (userId && contract.sellerId === Number(userId)) {
                      loadResponses(contract.id, userId);
                    }
                  }}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <>
              <ContractDetailInfo
                contract={contract}
                isBarter={isBarter}
                formatDate={formatDate}
                formatPrice={formatPrice}
              />

              {/* Кнопка отклика снизу */}
              {contract.status === 'open' && (
                alreadyResponded ? (
                  <Button className="w-full" size="lg" onClick={async () => {
                    let rid = negotiationResponseId.current;
                    if (!rid) {
                      const userId = localStorage.getItem('userId');
                      if (userId) rid = await checkMyResponse(Number(id), userId);
                    }
                    if (rid) { negotiationResponseId.current = rid; setMyResponseId(rid); setNegotiationOpen(true); }
                    else toast({ title: 'Не удалось найти ваш отклик', variant: 'destructive' });
                  }}>
                    <Icon name="MessageSquare" className="mr-2 h-4 w-4" />
                    Перейти на переговоры
                  </Button>
                ) : (
                  <Button onClick={handleRespond} className="w-full" size="lg">
                    <Icon name="Send" className="mr-2 h-4 w-4" />
                    Откликнуться на контракт
                  </Button>
                )
              )}
            </>
          )}

        </div>
      </main>

      <Footer />

      <ContractRespondDialog
        open={respondOpen}
        onOpenChange={setRespondOpen}
        isBarter={isBarter}
        respondPrice={respondPrice}
        onRespondPriceChange={setRespondPrice}
        respondComment={respondComment}
        onRespondCommentChange={setRespondComment}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmitRespond}
        contractPricePerUnit={contract.pricePerUnit}
        contractQuantity={contract.quantity}
        formatPrice={formatPrice}
      />

      {negotiationOpen && negotiationResponseId.current && (
        <ContractNegotiationModal
          isOpen={true}
          onClose={() => setNegotiationOpen(false)}
          responseId={negotiationResponseId.current}
          contractTitle={contract.title || contract.productName || `Контракт #${contract.id}`}
          onStatusChange={loadContract}
        />
      )}
    </div>
  );
}