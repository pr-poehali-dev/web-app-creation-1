import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import type { Auction } from '@/types/auction';
import { useDistrict } from '@/contexts/DistrictContext';
import { auctionsAPI } from '@/services/api';
import MyAuctionCard from '@/components/myauctions/MyAuctionCard';
import MyAuctionsDialogs from '@/components/myauctions/MyAuctionsDialogs';
import { getTimeRemaining, getStatusBadge, canEdit, canReducePrice, canStop } from '@/components/myauctions/MyAuctionsHelpers';
import { dataSync } from '@/utils/dataSync';

interface MyAuctionsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function MyAuctions({ isAuthenticated, onLogout }: MyAuctionsProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { districts } = useDistrict();
  const currentUser = getSession();
  
  const [myAuctions, setMyAuctions] = useState<Auction[]>([]);
  const [participatingAuctions, setParticipatingAuctions] = useState<Auction[]>([]);
  const [activeTab, setActiveTab] = useState('participating');
  const [auctionToDelete, setAuctionToDelete] = useState<string | null>(null);
  const [auctionToStop, setAuctionToStop] = useState<string | null>(null);
  const [priceReduceAuction, setPriceReduceAuction] = useState<{ id: string; currentPrice: number } | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadMyAuctions = async () => {
    setIsLoading(true);
    try {
      const loadedAuctions = await auctionsAPI.getMyAuctions();
      setMyAuctions(loadedAuctions);
      
      const participating = loadedAuctions.filter(auction => 
        auction.bids && auction.bids.some(bid => bid.userId === currentUser?.userId)
      );
      setParticipatingAuctions(participating);
    } catch (error) {
      console.error('Error loading auctions:', error);
      setMyAuctions([]);
      setParticipatingAuctions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }

    loadMyAuctions();
    
    const unsubscribe = dataSync.subscribe('auction_updated', () => {
      console.log('Auction updated, reloading my auctions...');
      loadMyAuctions();
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  const activeAuctions = myAuctions.filter(a => 
    a.status === 'active' || a.status === 'upcoming' || a.status === 'pending'
  );
  const completedAuctions = myAuctions.filter(a => a.status === 'ended');
  const archivedAuctions = myAuctions.filter(a => a.status === 'ended');

  const handleDeleteAuction = async (auctionId: string) => {
    try {
      await auctionsAPI.deleteAuction(auctionId);
      setMyAuctions(myAuctions.filter(auction => auction.id !== auctionId));
      setAuctionToDelete(null);
      dataSync.notifyAuctionUpdated(auctionId);
      toast({
        title: 'Успешно',
        description: 'Аукцион удален',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить аукцион',
        variant: 'destructive',
      });
    }
  };

  const handleStopAuction = async (auctionId: string) => {
    try {
      await auctionsAPI.updateAuction({ auctionId, action: 'stop' });
      await loadMyAuctions();
      setAuctionToStop(null);
      dataSync.notifyAuctionUpdated(auctionId);
      toast({
        title: 'Успешно',
        description: 'Аукцион остановлен',
      });
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось остановить аукцион',
        variant: 'destructive',
      });
    }
  };

  const handleReducePrice = async () => {
    if (!priceReduceAuction || !newPrice) return;

    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректную цену',
        variant: 'destructive',
      });
      return;
    }

    if (price >= priceReduceAuction.currentPrice) {
      toast({
        title: 'Ошибка',
        description: 'Новая цена должна быть ниже текущей',
        variant: 'destructive',
      });
      return;
    }

    try {
      await auctionsAPI.updateAuction({ 
        auctionId: priceReduceAuction.id, 
        action: 'reduce-price',
        newPrice: price
      });
      await loadMyAuctions();
      setPriceReduceAuction(null);
      setNewPrice('');
      dataSync.notifyAuctionUpdated(priceReduceAuction.id);
      toast({
        title: 'Успешно',
        description: 'Цена снижена',
      });
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось снизить цену',
        variant: 'destructive',
      });
    }
  };

  if (!isAuthenticated || !currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
            Назад
          </Button>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Мои аукционы</h1>
              <p className="text-muted-foreground mt-1">
                Управляйте своими аукционами
              </p>
            </div>
            <Button onClick={() => navigate('/create-auction')}>
              <Icon name="Plus" className="mr-2 h-4 w-4" />
              Создать аукцион
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" defaultValue="participating">
          <TabsList className="grid w-full grid-cols-4 mb-8 gap-2 p-2 bg-transparent h-auto">
            <TabsTrigger value="participating" className="border-2 data-[state=active]:border-primary data-[state=active]:bg-primary/10 flex-col h-auto py-2 px-1 whitespace-normal">
              <div className="flex flex-col items-center gap-0.5">
                <Icon name="Gavel" className="h-4 w-4 shrink-0" />
                <span className="text-[10px] sm:text-xs leading-tight text-center">Участие</span>
                {participatingAuctions.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-[10px] font-semibold">
                    {participatingAuctions.length}
                  </span>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger value="active" className="border-2 data-[state=active]:border-primary data-[state=active]:bg-primary/10 flex-col h-auto py-2 px-1 whitespace-normal">
              <div className="flex flex-col items-center gap-0.5">
                <Icon name="Play" className="h-4 w-4 shrink-0" />
                <span className="text-[10px] sm:text-xs leading-tight text-center">Мои</span>
                {activeAuctions.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-[10px] font-semibold">
                    {activeAuctions.length}
                  </span>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger value="completed" className="border-2 data-[state=active]:border-primary data-[state=active]:bg-primary/10 flex-col h-auto py-2 px-1 whitespace-normal">
              <div className="flex flex-col items-center gap-0.5">
                <Icon name="CheckCircle" className="h-4 w-4 shrink-0" />
                <span className="text-[10px] sm:text-xs leading-tight text-center">Завер-<br/>шенные</span>
                {completedAuctions.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-[10px] font-semibold">
                    {completedAuctions.length}
                  </span>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger value="archived" className="border-2 data-[state=active]:border-primary data-[state=active]:bg-primary/10 flex-col h-auto py-2 px-1 whitespace-normal">
              <div className="flex flex-col items-center gap-0.5">
                <Icon name="Archive" className="h-4 w-4 shrink-0" />
                <span className="text-[10px] sm:text-xs leading-tight text-center">Архив</span>
                {archivedAuctions.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-[10px] font-semibold">
                    {archivedAuctions.length}
                  </span>
                )}
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="participating">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-96 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : participatingAuctions.length === 0 ? (
              <div className="text-center py-20">
                <Icon name="Gavel" className="h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Вы не участвуете в аукционах</h3>
                <p className="text-muted-foreground">Сделайте ставку на любой активный аукцион</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {participatingAuctions.map((auction) => (
                  <div key={auction.id} onClick={() => navigate(`/auction/${auction.id}`)} className="cursor-pointer">
                    <MyAuctionCard
                      auction={auction}
                      districtName={districts.find(d => d.id === auction.district)?.name}
                      canEdit={false}
                      canReducePrice={false}
                      canStop={false}
                      onDelete={() => {}}
                      onStop={() => {}}
                      onReducePrice={() => {}}
                      getStatusBadge={getStatusBadge}
                      getTimeRemaining={getTimeRemaining}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-96 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : activeAuctions.length === 0 ? (
              <div className="text-center py-20">
                <Icon name="Play" className="h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Нет активных аукционов</h3>
                <p className="text-muted-foreground mb-8">Создайте аукцион, чтобы продать товар</p>
                <Button onClick={() => navigate('/create-auction')}>
                  <Icon name="Plus" className="mr-2 h-4 w-4" />
                  Создать аукцион
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeAuctions.map((auction) => (
                  <MyAuctionCard
                    key={auction.id}
                    auction={auction}
                    districtName={districts.find(d => d.id === auction.district)?.name}
                    canEdit={canEdit(auction)}
                    canReducePrice={canReducePrice(auction)}
                    canStop={canStop(auction)}
                    onDelete={setAuctionToDelete}
                    onStop={setAuctionToStop}
                    onReducePrice={(id, price) => setPriceReduceAuction({ id, currentPrice: price })}
                    getStatusBadge={getStatusBadge}
                    getTimeRemaining={getTimeRemaining}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-96 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : completedAuctions.length === 0 ? (
              <div className="text-center py-20">
                <Icon name="CheckCircle" className="h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Нет завершенных аукционов</h3>
                <p className="text-muted-foreground">Здесь будут отображаться завершенные аукционы</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {completedAuctions.map((auction) => (
                  <MyAuctionCard
                    key={auction.id}
                    auction={auction}
                    districtName={districts.find(d => d.id === auction.district)?.name}
                    canEdit={canEdit(auction)}
                    canReducePrice={false}
                    canStop={false}
                    onDelete={setAuctionToDelete}
                    onStop={() => {}}
                    onReducePrice={() => {}}
                    getStatusBadge={getStatusBadge}
                    getTimeRemaining={getTimeRemaining}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="archived">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-96 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : archivedAuctions.length === 0 ? (
              <div className="text-center py-20">
                <Icon name="Archive" className="h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Архив пуст</h3>
                <p className="text-muted-foreground">Здесь будут отображаться архивные аукционы</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {archivedAuctions.map((auction) => (
                  <MyAuctionCard
                    key={auction.id}
                    auction={auction}
                    districtName={districts.find(d => d.id === auction.district)?.name}
                    canEdit={false}
                    canReducePrice={false}
                    canStop={false}
                    onDelete={setAuctionToDelete}
                    onStop={() => {}}
                    onReducePrice={() => {}}
                    getStatusBadge={getStatusBadge}
                    getTimeRemaining={getTimeRemaining}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <MyAuctionsDialogs
        auctionToDelete={auctionToDelete}
        auctionToStop={auctionToStop}
        priceReduceAuction={priceReduceAuction}
        newPrice={newPrice}
        onDeleteConfirm={handleDeleteAuction}
        onDeleteCancel={() => setAuctionToDelete(null)}
        onStopConfirm={handleStopAuction}
        onStopCancel={() => setAuctionToStop(null)}
        onReducePriceConfirm={handleReducePrice}
        onReducePriceCancel={() => { setPriceReduceAuction(null); setNewPrice(''); }}
        onNewPriceChange={setNewPrice}
      />

      <Footer />
    </div>
  );
}