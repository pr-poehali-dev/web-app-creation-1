import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import type { Auction, AuctionBid } from '@/types/auction';
import { CATEGORIES } from '@/data/categories';
import { useDistrict } from '@/contexts/DistrictContext';
import { getSession } from '@/utils/auth';
import BidHistoryTabs from '@/components/auction/BidHistoryTabs';

interface AuctionDetailProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function AuctionDetail({ isAuthenticated, onLogout }: AuctionDetailProps) {
  useScrollToTop();
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { districts } = useDistrict();
  const currentUser = getSession();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [bids, setBids] = useState<AuctionBid[]>([]);
  const [bidAmount, setBidAmount] = useState('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [searchParams] = useSearchParams();
  const bidsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadAuction = async () => {
      setIsLoading(true);
      try {
        const userId = localStorage.getItem('userId');
        console.log('Loading auction:', id, 'userId:', userId);

        const response = await fetch(`https://functions.poehali.dev/9fd62fb3-48c7-4d72-8bf2-05f33093f80f?id=${id}`, {
          headers: userId ? {
            'X-User-Id': userId,
          } : {},
        });

        console.log('Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Auction data:', data);
          if (data) {
            setAuction({
              ...data,
              startDate: new Date(data.startDate),
              endDate: new Date(data.endDate),
              createdAt: new Date(data.createdAt),
            });
            
            if (data.bids && Array.isArray(data.bids)) {
              setBids(data.bids.map((bid: any) => ({
                ...bid,
                timestamp: new Date(bid.timestamp)
              })));
            }
          } else {
            console.error('No auction data received');
            toast({
              title: 'Ошибка',
              description: 'Аукцион не найден',
              variant: 'destructive'
            });
            navigate('/auction');
          }
        } else {
          console.error('Response not ok:', response.status);
          toast({
            title: 'Ошибка',
            description: 'Не удалось загрузить аукцион',
            variant: 'destructive'
          });
          navigate('/auction');
        }
      } catch (error) {
        console.error('Fetch error:', error);
        toast({
          title: 'Ошибка соединения',
          description: 'Проверьте подключение к интернету',
          variant: 'destructive'
        });
        navigate('/auction');
      } finally {
        setIsLoading(false);
      }
    };

    loadAuction();
  }, [id, navigate, toast]);

  useEffect(() => {
    if (searchParams.get('scrollTo') === 'bids' && bidsRef.current) {
      setTimeout(() => {
        bidsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [searchParams, isLoading]);

  useEffect(() => {
    if (!auction || auction.status !== 'active') return;

    const refreshBids = async () => {
      try {
        setIsRefreshing(true);
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        const response = await fetch(`https://functions.poehali.dev/9fd62fb3-48c7-4d72-8bf2-05f33093f80f?id=${id}`, {
          headers: {
            'X-User-Id': userId,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.bids && Array.isArray(data.bids)) {
            const previousBidsCount = bids.length;
            const newBids = data.bids.map((bid: any) => ({
              ...bid,
              timestamp: new Date(bid.timestamp)
            }));
            
            setBids(newBids);
            
            setAuction(prev => prev ? {
              ...prev,
              currentBid: data.currentBid,
              bidCount: data.bidCount
            } : null);

            if (newBids.length > previousBidsCount) {
              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=');
              audio.volume = 0.3;
              audio.play().catch(() => {});
              
              toast({
                title: 'Новая ставка!',
                description: `Текущая цена: ${data.currentBid?.toLocaleString()} ₽`,
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to refresh bids:', error);
      } finally {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    };

    const interval = setInterval(refreshBids, 5000);

    return () => clearInterval(interval);
  }, [auction?.status, id, bids.length, toast]);

  useEffect(() => {
    if (!auction?.endDate) return;

    const updateTimer = () => {
      setTimeRemaining(getTimeRemaining(auction.endDate));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [auction?.endDate]);

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

  const getTimeRemaining = (endTime: Date) => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();

    if (diff <= 0) return 'Завершен';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} дн. ${hours} ч.`;
    if (hours > 0) return `${hours} ч. ${minutes} мин.`;
    return `${minutes} мин.`;
  };

  const handlePlaceBid = async () => {
    if (!bidAmount || !auction || !currentUser) return;

    const amount = parseFloat(bidAmount);
    const minNextBid = (auction.currentBid || auction.startingPrice || 0) + (auction.minBidStep || 0);

    if (amount < minNextBid) {
      toast({
        title: 'Недостаточная ставка',
        description: `Минимальная ставка: ${minNextBid.toLocaleString()} ₽`,
        variant: 'destructive',
      });
      return;
    }

    setIsPlacingBid(true);
    try {
      const newBid: AuctionBid = {
        id: crypto.randomUUID(),
        userId: currentUser.userId,
        userName: currentUser.name || 'Участник',
        amount,
        timestamp: new Date(),
        isWinning: true,
      };

      const updatedBids = [...bids, newBid];
      setBids(updatedBids);
      setAuction(prev => prev ? { ...prev, currentBid: amount, bidCount: (prev.bidCount || 0) + 1 } : null);
      setBidAmount('');

      toast({
        title: 'Ставка размещена',
        description: `Ваша ставка ${amount.toLocaleString()} ₽ принята`,
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось разместить ставку',
        variant: 'destructive',
      });
    } finally {
      setIsPlacingBid(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="container mx-auto px-3 py-6 flex-1">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!auction) {
    return null;
  }

  const category = CATEGORIES.find(c => c.id === auction.category);
  const districtName = districts.find(d => d.id === auction.district)?.name;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-3 py-6 flex-1">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              {auction.images.length > 0 ? (
                <img
                  src={auction.images[selectedImageIndex].url}
                  alt={auction.images[selectedImageIndex].alt}
                  className="w-full h-full object-cover"
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
            </div>

            {auction.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {auction.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-video rounded overflow-hidden border-2 ${
                      selectedImageIndex === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-3xl font-bold">{auction.title}</h1>
                {getStatusBadge(auction.status)}
              </div>
              {category && (
                <Badge variant="secondary">{category.name}</Badge>
              )}
              {auction.isPremium && (
                <Badge className="bg-primary ml-2">
                  <Icon name="Star" className="h-3 w-3 mr-1" />
                  Премиум
                </Badge>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Стартовая цена:</span>
                <span className="text-xl font-medium">{auction.startingPrice.toLocaleString()} ₽</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Текущая ставка:</span>
                <span className="text-3xl font-bold text-primary">{auction.currentBid.toLocaleString()} ₽</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Минимальный шаг:</span>
                <span className="font-medium">{auction.minBidStep.toLocaleString()} ₽</span>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon name="Users" className="h-4 w-4" />
                  <span className="text-sm">Количество ставок</span>
                </div>
                <p className="text-2xl font-bold">{auction.bidCount}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon name="Clock" className="h-4 w-4" />
                  <span className="text-sm">Осталось времени</span>
                </div>
                <p className="text-2xl font-bold">{timeRemaining || getTimeRemaining(auction.endDate)}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon name="MapPin" className="h-4 w-4" />
                <span>{districtName}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon name="Calendar" className="h-4 w-4" />
                <span>Начало: {auction.startDate.toLocaleString('ru-RU')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon name="CalendarX" className="h-4 w-4" />
                <span>Завершение: {auction.endDate.toLocaleString('ru-RU')}</span>
              </div>
            </div>

            {auction.status === 'active' && (
              <>
                <Separator />
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={() => {
                    bidsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  <Icon name="Gavel" className="h-5 w-5 mr-2" />
                  Сделать ставку
                </Button>
              </>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Описание</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-line">
              {auction.description}
            </p>
          </CardContent>
        </Card>

        <div className="mt-6 space-y-6" ref={bidsRef}>
          {auction.status === 'active' && (
            <Card>
              <CardHeader>
                <CardTitle>Сделать ставку</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentUser ? (
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bidAmount">Сумма ставки (₽)</Label>
                      <Input
                        id="bidAmount"
                        type="number"
                        placeholder={`Минимум ${((auction.currentBid || auction.startingPrice || 0) + (auction.minBidStep || 0)).toLocaleString()} ₽`}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        min={(auction.currentBid || auction.startingPrice || 0) + (auction.minBidStep || 0)}
                      />
                    </div>
                    <Button 
                      onClick={handlePlaceBid} 
                      disabled={isPlacingBid || !bidAmount}
                      className="w-full"
                    >
                      <Icon name="Gavel" className="h-4 w-4 mr-2" />
                      {isPlacingBid ? 'Размещение...' : 'Разместить ставку'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Icon name="Lock" className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-4">Войдите, чтобы сделать ставку</p>
                    <Button onClick={() => navigate('/login')}>
                      Войти
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="relative">
            {auction.status === 'active' && (
              <div className="absolute -top-8 right-0 flex items-center gap-2 text-xs text-muted-foreground">
                <div className={`h-2 w-2 rounded-full ${isRefreshing ? 'bg-green-500 animate-pulse' : 'bg-green-500'}`} />
                <span>Обновление каждые 5 сек</span>
              </div>
            )}
            <BidHistoryTabs 
              bids={bids}
              categoryName={category?.name || 'Аукцион'}
              auctionNumber={parseInt(auction.id.slice(-4), 16) % 1000}
              currentUserId={currentUser?.userId}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}