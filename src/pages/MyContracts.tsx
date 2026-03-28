import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import func2url from '../../backend/func2url.json';
import ContractNegotiationModal from '@/components/contract/ContractNegotiationModal';
import ContractCard, { Contract } from '@/components/contract/ContractCard';
import ResponseCard from '@/components/contract/ResponseCard';

const CONTRACTS_API = func2url['contracts-list'];
const RESPONSE_ID_API = func2url['contract-response-id'];

interface MyContractsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function MyContracts({ isAuthenticated, onLogout }: MyContractsProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getSession();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [respondedContracts, setRespondedContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
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
      const rawId = (currentUser as { id?: number; userId?: number })?.id ?? (currentUser as { id?: number; userId?: number })?.userId ?? (Number(localStorage.getItem('userId') || '0') || undefined);
      const userId = rawId ? String(rawId) : '';
      if (!userId) {
        setIsLoading(false);
        return;
      }
      const resp = await fetch(`${CONTRACTS_API}?user_id=${userId}`, {
        headers: { 'X-User-Id': userId },
      });
      if (!resp.ok) throw new Error('Ошибка загрузки');
      const data = await resp.json();
      const allContracts: Contract[] = data.contracts || [];
      setContracts(allContracts);

      const myResponsesResp = await fetch(`${CONTRACTS_API}?my_responses=true`, {
        headers: { 'X-User-Id': userId },
      }).catch(() => null);
      if (myResponsesResp) {
        if (myResponsesResp.ok) {
          const myRespData = await myResponsesResp.json();
          setRespondedContracts(myRespData.contracts || []);
        } else {
          console.error('myResponses error:', myResponsesResp.status, await myResponsesResp.text().catch(() => ''));
        }
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Ошибка', description: 'Не удалось загрузить контракты', variant: 'destructive' });
      setContracts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const rawCurrentId = (currentUser as { id?: number; userId?: number })?.id ?? (currentUser as { id?: number; userId?: number })?.userId ?? (Number(localStorage.getItem('userId') || '0') || undefined);
  const currentUserId = Number(rawCurrentId ?? 0);

  const myOwnContracts = contracts.filter(c => Number(c.sellerId) === currentUserId);
  const allActiveContracts = myOwnContracts.filter(c => ['open', 'signed', 'in_progress', 'draft'].includes(c.status));
  const activeRequests = allActiveContracts.filter(c => c.contractType === 'forward-request');
  const activeContracts = allActiveContracts.filter(c => c.contractType !== 'forward-request');
  const closedContracts = myOwnContracts.filter(c => ['completed', 'cancelled'].includes(c.status));
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
              <TabsTrigger value="responses">
                Мои отклики {respondedContracts.length > 0 && <span className="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 rounded-full">{respondedContracts.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="closed">
                Завершённые {closedContracts.length > 0 && <span className="ml-1.5 text-xs bg-muted px-1.5 rounded-full">{closedContracts.length}</span>}
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
                    key={c.id}
                    contract={c}
                    onClick={() => {
                      navigate(`/contract/${c.id}`, { state: { alreadyResponded: true } });
                    }}
                    onNegotiate={async () => {
                      const userId = String((currentUser as {id?:number;userId?:number})?.id ?? (currentUser as {id?:number;userId?:number})?.userId ?? localStorage.getItem('userId') ?? '');
                      const res = await fetch(`${RESPONSE_ID_API}?contractId=${c.id}`, { headers: { 'X-User-Id': userId } });
                      if (res.ok) {
                        const data = await res.json();
                        if (data.responseId) {
                          setNegotiationModal({ responseId: data.responseId, title: c.title || c.productName || `Контракт #${c.id}` });
                          return;
                        }
                      }
                      toast({ title: 'Не удалось найти отклик', variant: 'destructive' });
                    }}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
        {!isLoading && allCount === 0 && respondedContracts.length === 0 && activeTab !== 'responses' && (
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