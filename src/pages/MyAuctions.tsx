import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { MOCK_AUCTIONS } from '@/data/mockAuctions';
import { CATEGORIES } from '@/data/categories';
import { useDistrict } from '@/contexts/DistrictContext';
import { useVerificationStatus } from '@/hooks/useVerificationStatus';

interface MyAuctionsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function MyAuctions({ isAuthenticated, onLogout }: MyAuctionsProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { districts } = useDistrict();
  const currentUser = getSession();
  const { verificationStatus } = useVerificationStatus();
  
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | Auction['status']>('all');
  const [auctionToDelete, setAuctionToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }

    setTimeout(() => {
      setAuctions(MOCK_AUCTIONS.slice(0, 2));
      setIsLoading(false);
    }, 800);
  }, [isAuthenticated, currentUser, navigate]);

  const filteredAuctions = filterStatus === 'all' 
    ? auctions 
    : auctions.filter(auction => auction.status === filterStatus);

  const handleDeleteAuction = (auctionId: string) => {
    setAuctions(auctions.filter(auction => auction.id !== auctionId));
    setAuctionToDelete(null);
    toast({
      title: 'Успешно',
      description: 'Аукцион удален',
    });
  };

  const getAuctionStats = () => {
    return {
      total: auctions.length,
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
      case 'active':
        return <Badge className="bg-green-500"><Icon name="Play" className="h-3 w-3 mr-1" />Активен</Badge>;
      case 'ending-soon':
        return <Badge className="bg-orange-500"><Icon name="Clock" className="h-3 w-3 mr-1" />Скоро завершится</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-500"><Icon name="Calendar" className="h-3 w-3 mr-1" />Предстоящий</Badge>;
      case 'ended':
        return <Badge variant="secondary"><Icon name="CheckCircle" className="h-3 w-3 mr-1" />Завершен</Badge>;
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
                src={auction.images[0].url}
                alt={auction.images[0].alt}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icon name="Gavel" className="h-12 w-12 text-muted-foreground" />
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
              <span className="font-medium">{auction.startingPrice.toLocaleString()} ₽</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Текущая ставка:</span>
              <span className="font-bold text-primary text-lg">
                {auction.currentPrice.toLocaleString()} ₽
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t text-sm">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Icon name="Users" className="h-4 w-4" />
                <span>{auction.bidsCount}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Ставок</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Icon name="Clock" className="h-4 w-4" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {auction.status === 'ended' ? 'Завершен' : getTimeRemaining(auction.endTime)}
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
              <DropdownMenuItem disabled>
                <Icon name="Pencil" className="mr-2 h-4 w-4" />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Icon name="Users" className="mr-2 h-4 w-4" />
                Список ставок
              </DropdownMenuItem>
              {auction.status === 'ended' && (
                <DropdownMenuItem disabled>
                  <Icon name="Trophy" className="mr-2 h-4 w-4" />
                  Выбрать победителя
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setAuctionToDelete(auction.id)}
              >
                <Icon name="Trash2" className="mr-2 h-4 w-4" />
                Удалить
              </DropdownMenuItem>
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
            <Button onClick={() => {
              if (verificationStatus !== 'verified') {
                navigate('/verification');
              } else {
                navigate('/create-auction');
              }
            }} disabled>
              <Icon name="Plus" className="mr-2 h-4 w-4" />
              Создать аукцион
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('all')}>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary">{stats.total}</div>
              <p className="text-sm text-muted-foreground mt-1">Всего</p>
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

      <Footer />
    </div>
  );
}