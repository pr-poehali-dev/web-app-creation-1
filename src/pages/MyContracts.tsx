import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import func2url from '../../backend/func2url.json';
import ContractNegotiationModal from '@/components/contract/ContractNegotiationModal';
import ContractCard, { Contract, CONTRACT_TYPE_LABELS, formatAmount, formatDate } from '@/components/contract/ContractCard';
import ResponseCard from '@/components/contract/ResponseCard';

const CONTRACTS_API = func2url['contracts-list'];
const RESPONSE_ID_API = func2url['contract-response-id'];

const ARCHIVED_RESPONSE_STATUSES = ['cancelled', 'rejected'];

interface MyContractsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function MyContracts({ isAuthenticated, onLogout }: MyContractsProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getSession();

  const [myContracts, setMyContracts] = useState<Contract[]>([]);
  const [respondedContracts, setRespondedContracts] = useState<Contract[]>([]);
  const [cancelledOwnerResponses, setCancelledOwnerResponses] = useState<CancelledOwnerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  interface CancelledOwnerItem {
    id: number;
    title: string;
    productName: string;
    contractType: string;
    status: string;
    totalAmount: number;
    currency: string;
    quantity: number;
    unit: string;
    contractStartDate: string;
    contractEndDate: string;
    sellerId: number;
    responseId: number;
    responseStatus: string;
    respondentFirstName: string;
    respondentLastName: string;
    respondentCompanyName: string;
    pricePerUnit: number;
    createdAt: string;
  }
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'active';
  });
  const [negotiationModal, setNegotiationModal] = useState<{ responseId: number; title: string } | null>(null);

  const getUserId = (): string => {
    const rawId =
      (currentUser as { id?: number; userId?: number })?.id ??
      (currentUser as { id?: number; userId?: number })?.userId ??
      (Number(localStorage.getItem('userId') || '0') || undefined);
    return rawId ? String(rawId) : '';
  };

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }
    loadAll();
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAll = async () => {
    setIsLoading(true);
    const userId = getUserId();
    if (!userId) { setIsLoading(false); return; }

    try {
      const [ownResp, myRespResp, cancelledResp] = await Promise.all([
        fetch(`${CONTRACTS_API}?user_id=${userId}`, { headers: { 'X-User-Id': userId } }),
        fetch(`${CONTRACTS_API}?my_responses=true`, { headers: { 'X-User-Id': userId } }),
        fetch(`${CONTRACTS_API}?cancelled_responses=true`, { headers: { 'X-User-Id': userId } }),
      ]);

      if (ownResp.ok) {
        const d = await ownResp.json();
        setMyContracts(d.contracts || []);
      }
      if (myRespResp.ok) {
        const d = await myRespResp.json();
        setRespondedContracts(d.contracts || []);
      }
      if (cancelledResp.ok) {
        const d = await cancelledResp.json();
        setCancelledOwnerResponses(d.contracts || []);
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Ошибка загрузки контрактов', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const currentUserId = Number(getUserId() || '0');

  const handleDeleteContract = async (contractId: number) => {
    if (!window.confirm('Удалить контракт? Это действие нельзя отменить.')) return;
    const userId = getUserId();
    try {
      const res = await fetch(CONTRACTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ action: 'deleteContract', contractId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'Контракт удалён' });
        loadAll();
      } else {
        toast({ title: data.error || 'Ошибка удаления', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка соединения', variant: 'destructive' });
    }
  };

  const openNegotiation = async (c: Contract) => {
    const userId = getUserId();
    const res = await fetch(`${RESPONSE_ID_API}?contractId=${c.id}`, { headers: { 'X-User-Id': userId } });
    if (res.ok) {
      const data = await res.json();
      if (data.responseId) {
        setNegotiationModal({ responseId: data.responseId, title: c.title || c.productName || `Контракт #${c.id}` });
        return;
      }
    }
    toast({ title: 'Не удалось найти отклик', variant: 'destructive' });
  };

  // ── Фильтрация ──────────────────────────────────────────────────
  // Мои контракты (я — продавец)
  const ownContracts = myContracts.filter(c => Number(c.sellerId) === currentUserId);

  // Активные собственные
  const activeOwn = ownContracts.filter(c => ['open', 'signed', 'in_progress', 'draft'].includes(c.status));
  const activeRequests = activeOwn.filter(c => c.contractType === 'forward-request');
  const activeForwards = activeOwn.filter(c => c.contractType !== 'forward-request');

  // Завершённые/отменённые собственные → в Архив
  const closedOwn = ownContracts.filter(c => ['completed', 'cancelled'].includes(c.status));

  // Мои отклики: активные (не cancelled/rejected)
  const activeResponded = respondedContracts.filter(
    c => !ARCHIVED_RESPONSE_STATUSES.includes(c.myResponseStatus || '')
  );
  // Мои отклики: отменённые → в Архив
  const archivedResponded = respondedContracts.filter(
    c => ARCHIVED_RESPONSE_STATUSES.includes(c.myResponseStatus || '')
  );

  const activeCount = activeOwn.length;
  const archiveCount = archivedResponded.length + closedOwn.length + cancelledOwnerResponses.length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-2">
            <Icon name="ArrowLeft" className="h-4 w-4" />
          </Button>
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
              <TabsTrigger value="responses">
                Мои отклики {activeResponded.length > 0 && <span className="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 rounded-full">{activeResponded.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="archive">
                Архив {archiveCount > 0 && <span className="ml-1.5 text-xs bg-muted px-1.5 rounded-full">{archiveCount}</span>}
              </TabsTrigger>
            </TabsList>

            {/* ── Активные ── */}
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
                      {activeRequests.map(c => (
                        <ContractCard key={c.id} contract={c} currentUserId={currentUserId}
                          onClick={() => navigate(`/contract/${c.id}`)}
                          onDelete={() => handleDeleteContract(c.id)} />
                      ))}
                    </div>
                  )}
                  {activeForwards.length > 0 && (
                    <div className="space-y-3">
                      {activeRequests.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Icon name="TrendingUp" size={14} className="text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Форварды и бартер</span>
                          <span className="text-xs bg-muted px-1.5 rounded-full">{activeForwards.length}</span>
                        </div>
                      )}
                      {activeForwards.map(c => (
                        <ContractCard key={c.id} contract={c} currentUserId={currentUserId}
                          onClick={() => navigate(`/contract/${c.id}`)}
                          onDelete={() => handleDeleteContract(c.id)} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* ── Мои отклики (только активные) ── */}
            <TabsContent value="responses" className="space-y-3">
              {activeResponded.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Нет активных откликов на контракты</p>
              ) : (
                activeResponded.map(c => (
                  <ResponseCard
                    key={c.id}
                    contract={c}
                    onClick={() => navigate(`/contract/${c.id}`)}
                    onNegotiate={() => openNegotiation(c)}
                  />
                ))
              )}
            </TabsContent>

            {/* ── Архив ── */}
            <TabsContent value="archive" className="space-y-4">
              {archiveCount === 0 ? (
                <p className="text-center text-muted-foreground py-8">Архив пуст</p>
              ) : (
                <>
                  {/* Мои отменённые/отклонённые отклики */}
                  {archivedResponded.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Icon name="XCircle" size={14} className="text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Отменённые отклики</span>
                        <span className="text-xs bg-muted px-1.5 rounded-full">{archivedResponded.length}</span>
                      </div>
                      {archivedResponded.map(c => (
                        <ResponseCard key={`arch-${c.id}`} contract={c} onClick={() => navigate(`/contract/${c.id}`)} />
                      ))}
                    </div>
                  )}

                  {/* Отменённые отклики участников на мои контракты */}
                  {cancelledOwnerResponses.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Icon name="UserX" size={14} className="text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Отменённые отклики на мои контракты</span>
                        <span className="text-xs bg-muted px-1.5 rounded-full">{cancelledOwnerResponses.length}</span>
                      </div>
                      {cancelledOwnerResponses.map(item => (
                        <Card key={`cor-${item.responseId}`} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/contract/${item.id}`)}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="font-medium text-sm truncate">{item.title || item.productName || `Контракт #${item.id}`}</span>
                                  <Badge variant="destructive" className="text-xs shrink-0">Отменён</Badge>
                                  {item.contractType && CONTRACT_TYPE_LABELS[item.contractType] && (
                                    <Badge variant="outline" className="text-xs shrink-0">{CONTRACT_TYPE_LABELS[item.contractType]}</Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                                  <span className="flex items-center gap-1">
                                    <Icon name="User" size={12} />
                                    {`${item.respondentFirstName || ''} ${item.respondentLastName || ''}`.trim() || item.respondentCompanyName || 'Участник'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Icon name="Package" size={12} />
                                    {item.quantity} {item.unit}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Icon name="Calendar" size={12} />
                                    с {formatDate(item.contractStartDate)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Icon name="Calendar" size={12} />
                                    по {formatDate(item.contractEndDate)}
                                  </span>
                                </div>
                                {item.pricePerUnit > 0 && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Цена отклика: {formatAmount(item.pricePerUnit, item.currency)} / ед.
                                  </p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-semibold text-sm">
                                  {item.totalAmount ? formatAmount(item.totalAmount, item.currency) : 'Договорная'}
                                </div>
                                <div className="text-xs text-muted-foreground">Инициатор</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Завершённые/отменённые собственные контракты */}
                  {closedOwn.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Icon name="Archive" size={14} className="text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Завершённые контракты</span>
                        <span className="text-xs bg-muted px-1.5 rounded-full">{closedOwn.length}</span>
                      </div>
                      {closedOwn.map(c => (
                        <ContractCard key={c.id} contract={c} currentUserId={currentUserId}
                          onClick={() => navigate(`/contract/${c.id}`)} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        )}

        {!isLoading && myContracts.length === 0 && respondedContracts.length === 0 && (
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
          onStatusChange={loadAll}
        />
      )}
    </div>
  );
}