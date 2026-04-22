import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import func2url from '../../../backend/func2url.json';

export interface Contract {
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
  priceType?: string;
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

export interface ResponseItem {
  id: number;
  firstName: string;
  lastName: string;
  companyName?: string;
  userType?: string;
  phone: string;
  email: string;
  pricePerUnit: number;
  totalAmount: number;
  comment: string;
  status: string;
  createdAt: string;
}

export function useContractDetail(id: string | undefined) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

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
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [respondVerifDialog, setRespondVerifDialog] = useState<{ open: boolean; mode: 'not-verified' | 'pending' | 'barter-restricted' }>({ open: false, mode: 'not-verified' });

  const loadContract = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      const res = await fetch(`${func2url['contracts-list']}?id=${id}`, {
        headers: { 'X-User-Id': userId || '' },
      });
      if (res.ok) {
        const data = await res.json();
        const contracts = data.contracts || [];
        const found = contracts.find((c: Contract) => String(c.id) === String(id)) || contracts[0] || null;
        console.log('[ContractDetail] loadContract', { id, userId, found_sellerId: found?.sellerId, found_id: found?.id, total: contracts.length });
        if (found) {
          setContract(found);
          if (userId && String(found.sellerId) === String(userId)) {
            loadResponses(found.id, userId);
          } else if (userId && String(found.sellerId) !== String(userId)) {
            if (found.responseId) {
              setAlreadyResponded(true);
              setMyResponseId(found.responseId);
              negotiationResponseId.current = found.responseId;
            } else {
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
      const data = await res.json();
      console.log('[ContractDetail] loadResponses', { contractId, userId, status: res.status, data });
      if (res.ok) {
        setResponses(data.responses || []);
      }
    } catch (e) {
      console.error('[ContractDetail] loadResponses error', e);
    }
  };

  const handleRespond = async (contractData: Contract) => {
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
          setRespondVerifDialog({ open: true, mode: 'pending' });
          return;
        }
        if (status !== 'verified') {
          setRespondVerifDialog({ open: true, mode: 'not-verified' });
          return;
        }
        const userType = data.userType;
        if (contractData.contractType === 'barter' && userType && ['individual', 'self-employed'].includes(userType)) {
          setRespondVerifDialog({ open: true, mode: 'barter-restricted' });
          return;
        }
      }
    } catch {
      toast({ title: 'Ошибка проверки статуса', variant: 'destructive' });
      return;
    }
    setRespondPrice(String(contractData.pricePerUnit || ''));
    setRespondOpen(true);
  };

  const handleSubmitRespond = async (contractData: Contract) => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    setIsSubmitting(true);
    try {
      const price = parseFloat(respondPrice) || contractData.pricePerUnit;
      const total = price * contractData.quantity;
      const qp = new URLSearchParams({
        action: 'respond',
        contractId: String(contractData.id),
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

  const handleDeleteContract = async (contractData: Contract) => {
    if (!window.confirm('Удалить контракт? Это действие нельзя отменить.')) return;
    const userId = localStorage.getItem('userId') || '';
    try {
      const res = await fetch(func2url['contracts-list'], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ action: 'deleteContract', contractId: contractData.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'Контракт удалён' });
        navigate('/my-contracts');
      } else {
        toast({ title: data.error || 'Ошибка удаления', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка соединения', variant: 'destructive' });
    }
  };

  return {
    contract,
    loading,
    activeTab, setActiveTab,
    respondOpen, setRespondOpen,
    respondComment, setRespondComment,
    respondPrice, setRespondPrice,
    isSubmitting,
    alreadyResponded,
    myResponseId,
    negotiationOpen, setNegotiationOpen,
    negotiationResponseId,
    responses,
    showGuestDialog, setShowGuestDialog,
    respondVerifDialog, setRespondVerifDialog,
    loadContract,
    loadResponses,
    checkMyResponse,
    handleRespond,
    handleSubmitRespond,
    handleDeleteContract,
  };
}
