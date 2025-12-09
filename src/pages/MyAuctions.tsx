import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import type { Auction } from '@/types/auction';
import { useDistrict } from '@/contexts/DistrictContext';
import { auctionsAPI } from '@/services/api';
import MyAuctionCard from '@/components/myauctions/MyAuctionCard';
import MyAuctionsStats from '@/components/myauctions/MyAuctionsStats';
import MyAuctionsDialogs from '@/components/myauctions/MyAuctionsDialogs';
import { getTimeRemaining, getStatusBadge, canEdit, canReducePrice, canStop } from '@/components/myauctions/MyAuctionsHelpers';

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
  
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | Auction['status']>('all');
  const [auctionToDelete, setAuctionToDelete] = useState<string | null>(null);
  const [auctionToStop, setAuctionToStop] = useState<string | null>(null);
  const [priceReduceAuction, setPriceReduceAuction] = useState<{ id: string; currentPrice: number } | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadMyAuctions = async () => {
    setIsLoading(true);
    try {
      const loadedAuctions = await auctionsAPI.getMyAuctions();
      setAuctions(loadedAuctions);
    } catch (error) {
      console.error('Error loading auctions:', error);
      setAuctions([]);
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
  }, []);

  const filteredAuctions = filterStatus === 'all' 
    ? auctions 
    : auctions.filter(auction => auction.status === filterStatus);

  const handleDeleteAuction = async (auctionId: string) => {
    try {
      await auctionsAPI.deleteAuction(auctionId);
      setAuctions(auctions.filter(auction => auction.id !== auctionId));
      setAuctionToDelete(null);
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

  const getAuctionStats = () => {
    return {
      total: auctions.length,
      pending: auctions.filter(a => a.status === 'pending').length,
      active: auctions.filter(a => a.status === 'active').length,
      endingSoon: auctions.filter(a => a.status === 'ending-soon').length,
      upcoming: auctions.filter(a => a.status === 'upcoming').length,
      ended: auctions.filter(a => a.status === 'ended').length,
    };
  };

  const stats = getAuctionStats();

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

        <MyAuctionsStats stats={stats} onFilterChange={setFilterStatus} />

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-96 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : filteredAuctions.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="Gavel" className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-xl font-semibold mb-2">
              {filterStatus === 'all' ? 'У вас пока нет аукционов' : 'Нет аукционов с выбранным статусом'}
            </h3>
            <p className="text-muted-foreground mb-8">
              Создайте аукцион, чтобы продать товар по лучшей цене
            </p>
            <Button onClick={() => navigate('/create-auction')}>
              <Icon name="Plus" className="mr-2 h-4 w-4" />
              Создать аукцион
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Показано: <span className="font-semibold text-foreground">{filteredAuctions.length}</span>{' '}
                {filterStatus !== 'all' && `из ${stats.total}`}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAuctions.map((auction) => (
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
          </>
        )}
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
