import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import type { Auction } from '@/types/auction';
import { CATEGORIES } from '@/data/categories';
import { useDistrict } from '@/contexts/DistrictContext';
import { auctionsAPI } from '@/services/api';

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

  const canEdit = (auction: Auction) => {
    if (!auction.startDate) return false;
    const start = new Date(auction.startDate);
    const now = new Date();
    return start > now;
  };

  const canReducePrice = (auction: Auction) => {
    return auction.status === 'active' || auction.status === 'ending-soon';
  };

  const canStop = (auction: Auction) => {
    return auction.status === 'active' || auction.status === 'ending-soon' || auction.status === 'upcoming';
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

  const getTimeRemaining = (endTime: Date) => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();

    if (diff <= 0) return 'Завершен';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}д ${hours}ч`;
    if (hours > 0) return `${hours}ч ${minutes}м`;
    return `${minutes}м`;
  };

  const getStatusBadge = (status: Auction['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500"><Icon name="Clock" className="h-3 w-3 mr-1" />Ожидает публикации</Badge>;
      case 'active':
        return <Badge className="bg-green-500"><Icon name="Play" className="h-3 w-3 mr-1" />Активен</Badge>;
      case 'ending-soon':
        return <Badge className="bg-orange-500"><Icon name="Clock" className="h-3 w-3 mr-1" />Скоро завершится</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-500"><Icon name="Calendar" className="h-3 w-3 mr-1" />Предстоящий</Badge>;
      case 'ended':
        return <Badge variant="secondary"><Icon name="CheckCircle" className="h-3 w-3 mr-1" />Завершен</Badge>;
      default:
        return null;
    }
  };

  const stats = getAuctionStats();

  const AuctionCard = ({ auction }: { auction: Auction }) => {
    const category = CATEGORIES.find(c => c.id === auction.category);
    const districtName = districts.find(d => d.id === auction.district)?.name;

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="p-0">
          <div className="relative aspect-video bg-muted overflow-hidden">
            {auction.images.length > 0 ? (
              <img
                key={auction.images[0].url}
                src={auction.images[0].url}
                alt={auction.images[0].alt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <div className="flex items-center space-x-2 opacity-30">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary">
                    <Icon name="Building2" className="h-10 w-10 text-white" />
                  </div>
                  <span className="text-4xl font-bold text-primary">ЕРТТП</span>
                </div>
              </div>
            )}
            <div className="absolute top-2 right-2">
              {getStatusBadge(auction.status)}
            </div>
            {auction.isPremium && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-primary">
                  <Icon name="Star" className="h-3 w-3 mr-1" />
                  Премиум
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-2">{auction.title}</h3>
          </div>

          {category && (
            <Badge variant="secondary">{category.name}</Badge>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Стартовая цена:</span>
              <span className="font-medium">{auction.startingPrice?.toLocaleString() ?? '0'} ₽</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Текущая ставка:</span>
              <span className="font-bold text-primary text-lg">
                {auction.currentBid?.toLocaleString() ?? '0'} ₽
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t text-sm">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Icon name="Users" className="h-4 w-4" />
                <span>{auction.bidCount}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Ставок</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Icon name="Clock" className="h-4 w-4" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {auction.status === 'ended' ? 'Завершен' : getTimeRemaining(auction.endDate)}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Icon name="MapPin" className="h-4 w-4" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{districtName}</p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/auction/${auction.id}`)}
          >
            <Icon name="Eye" className="mr-2 h-4 w-4" />
            Просмотр
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Icon name="MoreVertical" className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit(auction) && (
                <DropdownMenuItem onClick={() => navigate(`/edit-auction/${auction.id}`)}>
                  <Icon name="Edit" className="mr-2 h-4 w-4" />
                  Редактировать
                </DropdownMenuItem>
              )}
              {canEdit(auction) && (
                <DropdownMenuItem 
                  onClick={() => setAuctionToDelete(auction.id)}
                  className="text-destructive"
                >
                  <Icon name="Trash2" className="mr-2 h-4 w-4" />
                  Удалить
                </DropdownMenuItem>
              )}
              {canReducePrice(auction) && (
                <DropdownMenuItem onClick={() => setPriceReduceAuction({ id: auction.id, currentPrice: auction.currentBid || auction.startingPrice || 0 })}>
                  <Icon name="TrendingDown" className="mr-2 h-4 w-4" />
                  Снизить цену
                </DropdownMenuItem>
              )}
              {canStop(auction) && (
                <DropdownMenuItem 
                  onClick={() => setAuctionToStop(auction.id)}
                  className="text-orange-600"
                >
                  <Icon name="StopCircle" className="mr-2 h-4 w-4" />
                  Остановить
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>
    );
  };

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
            <Button onClick={() => navigate('/create-auction')} disabled>
              <Icon name="Plus" className="mr-2 h-4 w-4" />
              Создать аукцион
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('all')}>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary">{stats.total}</div>
              <p className="text-sm text-muted-foreground mt-1">Всего</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('pending')}>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-yellow-500">{stats.pending}</div>
              <p className="text-sm text-muted-foreground mt-1">Ожидают</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('active')}>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-green-500">{stats.active}</div>
              <p className="text-sm text-muted-foreground mt-1">Активных</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('ending-soon')}>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-orange-500">{stats.endingSoon}</div>
              <p className="text-sm text-muted-foreground mt-1">Заверш. скоро</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('upcoming')}>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-blue-500">{stats.upcoming}</div>
              <p className="text-sm text-muted-foreground mt-1">Предстоящие</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('ended')}>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-slate-500">{stats.ended}</div>
              <p className="text-sm text-muted-foreground mt-1">Завершенные</p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <Card key={index} className="h-96 animate-pulse bg-muted" />
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
            <Button disabled>
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
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          </>
        )}
      </main>

      <AlertDialog open={!!auctionToDelete} onOpenChange={() => setAuctionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить аукцион?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Аукцион будет удален безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => auctionToDelete && handleDeleteAuction(auctionToDelete)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!auctionToStop} onOpenChange={() => setAuctionToStop(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Остановить аукцион?</AlertDialogTitle>
            <AlertDialogDescription>
              Аукцион будет завершен досрочно. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => auctionToStop && handleStopAuction(auctionToStop)}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              Остановить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!priceReduceAuction} onOpenChange={() => { setPriceReduceAuction(null); setNewPrice(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Снизить цену</AlertDialogTitle>
            <AlertDialogDescription>
              Текущая цена: {priceReduceAuction?.currentPrice.toLocaleString('ru-RU')} ₽
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Новая цена (ниже текущей):</label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Введите новую цену"
                  min="0"
                  step="1"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setPriceReduceAuction(null); setNewPrice(''); }}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReducePrice}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Снизить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}