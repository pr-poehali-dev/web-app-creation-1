import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import func2url from '../../backend/func2url.json';

import ContractDetailInfo from '@/components/contract-detail/ContractDetailInfo';
import ContractDetailResponses from '@/components/contract-detail/ContractDetailResponses';
import ContractRespondDialog from '@/components/contract-detail/ContractRespondDialog';

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

          <ContractDetailInfo
            contract={contract}
            isBarter={isBarter}
            formatDate={formatDate}
            formatPrice={formatPrice}
          />

          <ContractDetailResponses
            responses={responses}
            isSeller={isSeller}
            contractStatus={contract.status}
          />

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
    </div>
  );
}
