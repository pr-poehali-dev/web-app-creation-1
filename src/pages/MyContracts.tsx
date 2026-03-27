import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import func2url from '../../backend/func2url.json';
import ContractNegotiationModal from '@/components/contract/ContractNegotiationModal';

const CONTRACTS_API = func2url['contracts-list'];

interface Respondent {
  id: number;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  pricePerUnit?: number;
  totalAmount?: number;
  comment?: string;
  status: string;
  createdAt: string;
  sellerConfirmed?: boolean;
  buyerConfirmed?: boolean;
}

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
  responsesCount?: number;
  recentRespondents?: Respondent[];
  // поля для откликов
  responseId?: number;
  respondentFirstName?: string;
  respondentLastName?: string;
  myResponseStatus?: string;
  sellerConfirmed?: boolean;
  buyerConfirmed?: boolean;
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

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  forward: 'Предложение',
  'forward-request': 'Запрос на закупку',
  barter: 'Бартер',
};

function ContractCard({ contract, currentUserId, onClick }: { contract: Contract; currentUserId: number; onClick: () => void }) {
  const isSeller = contract.sellerId === currentUserId;
  const isRequest = contract.contractType === 'forward-request';
  const counterparty = isSeller
    ? `${contract.buyerFirstName || ''} ${contract.buyerLastName || ''}`.trim() || (isRequest ? 'Поставщик' : 'Покупатель')
    : `${contract.sellerFirstName || ''} ${contract.sellerLastName || ''}`.trim() || (isRequest ? 'Покупатель' : 'Продавец');

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
              {contract.contractType && CONTRACT_TYPE_LABELS[contract.contractType] && (
                <Badge variant="outline" className="text-xs shrink-0">
                  {CONTRACT_TYPE_LABELS[contract.contractType]}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{contract.description || '—'}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Icon name="User" size={12} />
                {isSeller ? (isRequest ? 'Поставщик' : 'Покупатель') : (isRequest ? 'Покупатель' : 'Продавец')}: {counterparty}
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
            <div className="font-semibold text-sm">{contract.totalAmount ? formatAmount(contract.totalAmount, contract.currency) : 'Договорная'}</div>
            <div className="text-xs text-muted-foreground mt-1">{isSeller ? (isRequest ? 'Инициатор' : 'Продавец') : (isRequest ? 'Поставщик' : 'Покупатель')}</div>
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
  const [incomingResponses, setIncomingResponses] = useState<Record<number, Respondent[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    // Если пришли с параметром ?tab=responses — открыть вкладку откликов
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'active';
  });
  const [negotiationModal, setNegotiationModal] = useState<{ responseId: number; title: string } | null>(null);

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
      const rawId = (currentUser as { id?: number; userId?: number })?.id ?? (currentUser as { id?: number; userId?: number })?.userId ?? Number(localStorage.getItem('userId') || '0') || undefined;
      const userId = rawId ? String(rawId) : '';
      if (!userId) {
        setIsLoading(false);
        return;
      }
      const numUserId = Number(userId);
      // Мои контракты (я автор)
      const resp = await fetch(`${CONTRACTS_API}?user_id=${userId}`, {
        headers: { 'X-User-Id': userId },
      });
      if (!resp.ok) throw new Error('Ошибка загрузки');
      const data = await resp.json();
      const allContracts: Contract[] = data.contracts || [];
      setContracts(allContracts);

      // Загружаем детальные отклики для контрактов где я автор и есть отклики
      const contractsWithR = allContracts.filter(
        c => Number(c.sellerId) === numUserId && (c.responsesCount ?? 0) > 0
      );
      if (contractsWithR.length > 0) {
        const responsesMap: Record<number, Respondent[]> = {};
        await Promise.all(contractsWithR.map(async c => {
          const r = await fetch(`${CONTRACTS_API}?responses=true&contractId=${c.id}`, {
            headers: { 'X-User-Id': userId },
          }).catch(() => null);
          if (r && r.ok) {
            const d = await r.json();
            responsesMap[c.id] = d.responses || [];
          }
        }));
        setIncomingResponses(responsesMap);
      }

      // Контракты на которые я сам откликнулся
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

  const rawCurrentId = (currentUser as { id?: number; userId?: number })?.id ?? (currentUser as { id?: number; userId?: number })?.userId ?? Number(localStorage.getItem('userId') || '0') || undefined;
  const currentUserId = Number(rawCurrentId ?? 0);
  // Мои контракты — только те где я автор (seller)
  const myOwnContracts = contracts.filter(c => Number(c.sellerId) === currentUserId);
  const allActiveContracts = myOwnContracts.filter(c => ['open', 'signed', 'in_progress', 'draft'].includes(c.status));
  const activeRequests = allActiveContracts.filter(c => c.contractType === 'forward-request');
  const activeContracts = allActiveContracts.filter(c => c.contractType !== 'forward-request');
  const closedContracts = myOwnContracts.filter(c => ['completed', 'cancelled'].includes(c.status));
  // Мои контракты с откликами (я автор, кто-то откликнулся)
  const contractsWithResponses = myOwnContracts.filter(c => (c.responsesCount ?? 0) > 0);
  const totalResponsesCount = contractsWithResponses.reduce((sum, c) => sum + (c.responsesCount ?? 0), 0);
  const allCount = myOwnContracts.length + respondedContracts.length;
  const activeCount = allActiveContracts.length;

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
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 flex-wrap h-auto gap-1">
              <TabsTrigger value="active">
                Активные {activeCount > 0 && <span className="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 rounded-full">{activeCount}</span>}
              </TabsTrigger>
              <TabsTrigger value="incoming">
                Отклики {totalResponsesCount > 0 && <span className="ml-1.5 text-xs bg-orange-100 text-orange-700 px-1.5 rounded-full">{totalResponsesCount}</span>}
              </TabsTrigger>
              <TabsTrigger value="closed">
                Завершённые {closedContracts.length > 0 && <span className="ml-1.5 text-xs bg-muted px-1.5 rounded-full">{closedContracts.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="responses">
                Мои отклики {respondedContracts.length > 0 && <span className="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 rounded-full">{respondedContracts.length}</span>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeCount === 0 ? (
                <p className="text-center text-muted-foreground py-8">Нет активных контрактов</p>
              ) : (
                <>
                  {activeRequests.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Icon name="ShoppingCart" size={14} className="text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Запросы на закупку</span>
                        <span className="text-xs bg-muted px-1.5 rounded-full">{activeRequests.length}</span>
                      </div>
                      {activeRequests.map(c => <ContractCard key={c.id} contract={c} currentUserId={currentUserId} onClick={() => navigate(`/contract/${c.id}`)} />)}
                    </div>
                  )}
                  {activeContracts.length > 0 && (
                    <div className="space-y-3">
                      {activeRequests.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Icon name="TrendingUp" size={14} className="text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Форварды и бартер</span>
                          <span className="text-xs bg-muted px-1.5 rounded-full">{activeContracts.length}</span>
                        </div>
                      )}
                      {activeContracts.map(c => <ContractCard key={c.id} contract={c} currentUserId={currentUserId} onClick={() => navigate(`/contract/${c.id}`)} />)}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="incoming" className="space-y-4">
              {contractsWithResponses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon name="Inbox" className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>Откликов на ваши контракты пока нет</p>
                </div>
              ) : (
                contractsWithResponses.map(c => {
                  const responses = incomingResponses[c.id] || [];
                  return (
                    <Card key={c.id}>
                      <CardContent className="p-4 space-y-3">
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => navigate(`/contract/${c.id}`)}
                        >
                          <span className="font-medium text-sm">{c.title || c.productName || `Контракт #${c.id}`}</span>
                          <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 bg-orange-50 shrink-0">
                            <Icon name="Users" size={10} className="mr-1" />
                            {c.responsesCount} {(c.responsesCount ?? 0) === 1 ? 'отклик' : (c.responsesCount ?? 0) < 5 ? 'отклика' : 'откликов'}
                          </Badge>
                        </div>
                        {responses.length > 0 ? (
                          <div className="space-y-2">
                            {responses.map(r => {
                              const isConfirmed = r.status === 'confirmed';
                              const isCancelled = r.status === 'cancelled' || r.status === 'rejected';
                              return (
                                <div key={r.id} className="border rounded-lg p-3 space-y-1.5 text-sm">
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{r.firstName} {r.lastName}</span>
                                      <Badge
                                        variant={isConfirmed ? 'default' : isCancelled ? 'destructive' : 'outline'}
                                        className={`text-xs ${isConfirmed ? 'bg-green-100 text-green-700 border-green-200' : ''}`}
                                      >
                                        {RESPONSE_STATUS_LABELS[r.status] ?? r.status}
                                      </Badge>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString('ru-RU')}</span>
                                  </div>
                                  {(r.pricePerUnit ?? 0) > 0 && (
                                    <div className="text-muted-foreground">
                                      <span>Цена: </span><span className="font-medium text-foreground">{formatAmount(r.pricePerUnit!, c.currency)}</span>
                                      <span className="ml-2">Итого: </span><span className="font-medium text-foreground">{formatAmount(r.totalAmount!, c.currency)}</span>
                                    </div>
                                  )}
                                  {r.comment && <p className="text-muted-foreground">{r.comment}</p>}
                                  <div className="flex items-center justify-between pt-1">
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                      {r.phone && <span className="flex items-center gap-1"><Icon name="Phone" size={12} />{r.phone}</span>}
                                    </div>
                                    {!isCancelled && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1.5 h-7 text-xs"
                                        onClick={() => setNegotiationModal({ responseId: r.id, title: c.title || c.productName || `Контракт #${c.id}` })}
                                      >
                                        <Icon name="MessageSquare" size={12} />
                                        Переговоры
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground text-center py-2">Загрузка откликов...</div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
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
                  <ResponseCard
                    key={c.responseId ?? c.id}
                    contract={c}
                    onClick={() => {
                      if (c.responseId) {
                        setNegotiationModal({ responseId: c.responseId, title: c.title || c.productName || `Контракт #${c.id}` });
                      } else {
                        navigate(`/contract/${c.id}`);
                      }
                    }}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
        {!isLoading && allCount === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Icon name="FileSignature" className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Контрактов пока нет</p>
            <p className="text-sm mt-1">Здесь будут отображаться все ваши контракты</p>
          </div>
        )}
      </main>
      <Footer />

      {negotiationModal && (
        <ContractNegotiationModal
          isOpen={true}
          onClose={() => setNegotiationModal(null)}
          responseId={negotiationModal.responseId}
          contractTitle={negotiationModal.title}
          onStatusChange={loadContracts}
        />
      )}
    </div>
  );
}

const RESPONSE_STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  confirmed: 'Заключён',
  cancelled: 'Отменён',
  rejected: 'Отклонён',
};

const RESPONSE_STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  confirmed: 'default',
  cancelled: 'destructive',
  rejected: 'destructive',
};

function IncomingResponsesCard({ contract: c, onClick }: { contract: Contract; onClick: () => void }) {
  const respondents = c.recentRespondents || [];
  const count = c.responsesCount ?? 0;
  const statusLabels: Record<string, string> = { pending: 'Ожидает', confirmed: 'Заключён', cancelled: 'Отменён', rejected: 'Отклонён' };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer border-orange-200" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="font-medium text-sm truncate">{c.title || c.productName || `Контракт #${c.id}`}</span>
              <Badge variant="outline" className="text-xs shrink-0 border-orange-300 text-orange-700 bg-orange-50">
                <Icon name="Users" size={10} className="mr-1" />
                {count} {count === 1 ? 'отклик' : count < 5 ? 'отклика' : 'откликов'}
              </Badge>
              {c.contractType && CONTRACT_TYPE_LABELS[c.contractType] && (
                <Badge variant="outline" className="text-xs shrink-0">{CONTRACT_TYPE_LABELS[c.contractType]}</Badge>
              )}
            </div>
            {respondents.length > 0 && (
              <div className="space-y-1">
                {respondents.slice(0, 3).map(r => (
                  <div key={r.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon name="User" size={11} />
                    <span>{r.firstName} {r.lastName}</span>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{statusLabels[r.status] ?? r.status}</span>
                  </div>
                ))}
                {count > 3 && <p className="text-xs text-muted-foreground">и ещё {count - 3}...</p>}
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="font-semibold text-sm">{c.totalAmount ? formatAmount(c.totalAmount, c.currency) : 'Договорная'}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Icon name="ChevronRight" size={12} />
              Смотреть
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ResponseCard({ contract: c, onClick }: { contract: Contract; onClick: () => void }) {
  const sellerName = `${c.sellerFirstName || ''} ${c.sellerLastName || ''}`.trim() || 'Продавец';
  const myName = `${c.respondentFirstName || ''} ${c.respondentLastName || ''}`.trim() || 'Вы';
  const rStatus = c.myResponseStatus || 'pending';
  const isConfirmed = rStatus === 'confirmed';

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-medium text-sm truncate">{c.title || c.productName || `Контракт #${c.id}`}</span>
              <Badge variant={RESPONSE_STATUS_VARIANTS[rStatus] ?? 'outline'} className="text-xs shrink-0">
                {RESPONSE_STATUS_LABELS[rStatus] ?? rStatus}
              </Badge>
              {isConfirmed && (
                <Badge className="text-xs shrink-0 bg-green-100 text-green-700 border-green-200">
                  <Icon name="ShieldCheck" size={10} className="mr-1" />
                  Согласован
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Icon name="User" size={12} />
                Вы: {myName}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="Store" size={12} />
                Продавец: {sellerName}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="Package" size={12} />
                {c.quantity} {c.unit}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="MessageSquare" size={12} />
                {c.responseId ? 'Нажмите для переговоров' : 'Открыть контракт'}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-semibold text-sm">{c.totalAmount ? formatAmount(c.totalAmount, c.currency) : 'Договорная'}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {isConfirmed
                ? (c.sellerConfirmed && c.buyerConfirmed ? '✓ Оба подтвердили' : '○ Ожидание')
                : 'Покупатель'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}