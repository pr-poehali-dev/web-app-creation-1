import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import func2url from '../../backend/func2url.json';

const CONTRACTS_API = func2url['contracts-list'];

interface Contract {
  id: number;
  title: string;
  description: string;
  status: string;
  contractType: string;
  category: string;
  productName: string;
  totalAmount: number;
  currency: string;
  quantity: number;
  unit: string;
  contractStartDate: string;
  contractEndDate: string;
  sellerId: number;
  buyerId: number;
  sellerFirstName: string;
  sellerLastName: string;
  buyerFirstName: string;
  buyerLastName: string;
  createdAt: string;
}

interface MyContractsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Открыт',
  draft: 'Черновик',
  signed: 'Подписан',
  in_progress: 'В работе',
  completed: 'Завершён',
  cancelled: 'Отменён',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'default',
  draft: 'outline',
  signed: 'default',
  in_progress: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
};

function formatAmount(amount: number, currency = 'RUB') {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string) {
  if (!dateStr || dateStr === 'None' || dateStr === 'null') return '—';
  try {
    return new Date(dateStr).toLocaleDateString('ru-RU');
  } catch {
    return '—';
  }
}

function ContractCard({ contract, currentUserId, onClick }: { contract: Contract; currentUserId: number; onClick: () => void }) {
  const isSeller = contract.sellerId === currentUserId;
  const counterparty = isSeller
    ? `${contract.buyerFirstName || ''} ${contract.buyerLastName || ''}`.trim() || 'Покупатель'
    : `${contract.sellerFirstName || ''} ${contract.sellerLastName || ''}`.trim() || 'Продавец';

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-medium text-sm truncate">{contract.title || contract.productName || `Контракт #${contract.id}`}</span>
              <Badge variant={STATUS_VARIANTS[contract.status] ?? 'outline'} className="text-xs shrink-0">
                {STATUS_LABELS[contract.status] ?? contract.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{contract.description || '—'}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Icon name="User" size={12} />
                {isSeller ? 'Покупатель' : 'Продавец'}: {counterparty}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="Package" size={12} />
                {contract.quantity} {contract.unit}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="Calendar" size={12} />
                с {formatDate(contract.contractStartDate)}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="Calendar" size={12} />
                по {formatDate(contract.contractEndDate)}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-semibold text-sm">{formatAmount(contract.totalAmount, contract.currency)}</div>
            <div className="text-xs text-muted-foreground mt-1">{isSeller ? 'Продавец' : 'Покупатель'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyContracts({ isAuthenticated, onLogout }: MyContractsProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getSession();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [respondedContracts, setRespondedContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }
    loadContracts();
  }, [isAuthenticated]);

  const loadContracts = async () => {
    setIsLoading(true);
    try {
      const userId = String(currentUser!.userId);
      // Мои контракты (я автор)
      const resp = await fetch(`${CONTRACTS_API}?user_id=${userId}`, {
        headers: { 'X-User-Id': userId },
      });
      if (!resp.ok) throw new Error('Ошибка загрузки');
      const data = await resp.json();
      setContracts(data.contracts || []);

      // Контракты на которые я откликнулся — загружаем отклики и потом сами контракты
      const respResp = await fetch(`${CONTRACTS_API}?responses=true&contractId=all`, {
        headers: { 'X-User-Id': userId },
      }).catch(() => null);
      // responses=true&contractId=all не поддерживается — используем user_responses
      // Получаем все открытые контракты и фильтруем по наличию моего отклика
      // Более простой способ: бэкенд вернёт контракты где user_id = buyer_id через user_responses
      const myResponsesResp = await fetch(`${CONTRACTS_API}?myResponses=true`, {
        headers: { 'X-User-Id': userId },
      }).catch(() => null);
      if (myResponsesResp && myResponsesResp.ok) {
        const myRespData = await myResponsesResp.json();
        setRespondedContracts(myRespData.contracts || []);
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Ошибка', description: 'Не удалось загрузить контракты', variant: 'destructive' });
      setContracts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const activeContracts = contracts.filter(c => ['open', 'signed', 'in_progress', 'draft'].includes(c.status));
  const closedContracts = contracts.filter(c => ['completed', 'cancelled'].includes(c.status));
  const currentUserId = currentUser?.userId ?? 0;
  const allCount = contracts.length + respondedContracts.length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Icon name="FileSignature" className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Мои контракты</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Icon name="Loader2" className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : allCount === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Icon name="FileSignature" className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Контрактов пока нет</p>
            <p className="text-sm mt-1">Здесь будут отображаться все ваши контракты</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="active">
                Активные {activeContracts.length > 0 && <span className="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 rounded-full">{activeContracts.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="closed">
                Завершённые {closedContracts.length > 0 && <span className="ml-1.5 text-xs bg-muted px-1.5 rounded-full">{closedContracts.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="responses">
                Мои отклики {respondedContracts.length > 0 && <span className="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 rounded-full">{respondedContracts.length}</span>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-3">
              {activeContracts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Нет активных контрактов</p>
              ) : (
                activeContracts.map(c => <ContractCard key={c.id} contract={c} currentUserId={currentUserId} onClick={() => navigate(`/contract/${c.id}`)} />)
              )}
            </TabsContent>

            <TabsContent value="closed" className="space-y-3">
              {closedContracts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Нет завершённых контрактов</p>
              ) : (
                closedContracts.map(c => <ContractCard key={c.id} contract={c} currentUserId={currentUserId} onClick={() => navigate(`/contract/${c.id}`)} />)
              )}
            </TabsContent>

            <TabsContent value="responses" className="space-y-3">
              {respondedContracts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Вы ещё не откликались на контракты</p>
              ) : (
                respondedContracts.map(c => (
                  <ContractCard key={c.id} contract={c} currentUserId={currentUserId} onClick={() => navigate(`/contract/${c.id}`)} />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
      <Footer />
    </div>
  );
}