import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import type { Auction, AuctionBid } from '@/types/auction';
import { notifyAuctionWinner, notifyAuctionSeller } from '@/utils/notifications';

export function useAuctionData(id: string | undefined) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [auction, setAuction] = useState<Auction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bids, setBids] = useState<AuctionBid[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [timeUntilStart, setTimeUntilStart] = useState('');
  const bidsRef = useRef<HTMLDivElement>(null);
  const notificationSentRef = useRef<boolean>(false);

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
      if (document.hidden) return;
      
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
            const previousStatus = auction?.status;
            const newBids = data.bids.map((bid: any) => ({
              ...bid,
              timestamp: new Date(bid.timestamp)
            }));
            
            setBids(newBids);
            
            setAuction(prev => prev ? {
              ...prev,
              currentBid: data.currentBid,
              bidCount: data.bidCount,
              status: data.status
            } : null);

            if (previousStatus !== 'ended' && data.status === 'ended' && newBids.length > 0 && !notificationSentRef.current) {
              notificationSentRef.current = true;
              const winner = newBids[0];
              
              notifyAuctionWinner(
                winner.userId,
                auction?.title || 'Аукцион',
                winner.amount,
                id || ''
              );
              
              if (auction?.userId) {
                notifyAuctionSeller(
                  auction.userId,
                  auction.title,
                  winner.userName,
                  winner.amount,
                  id || ''
                );
              }
            }

            if (newBids.length > previousBidsCount) {
              try {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=');
                audio.volume = 0.5;
                audio.load();
                
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                  playPromise.catch(err => {
                    console.log('Audio play prevented:', err);
                  });
                }
              } catch (error) {
                console.log('Audio error:', error);
              }
              
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

    const getTimeRemaining = (endTime: Date) => {
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) return 'Завершен';

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) return `${days}д ${hours}ч ${minutes}м`;
      if (hours > 0) return `${hours}ч ${minutes}м ${seconds}с`;
      if (minutes > 0) return `${minutes}м ${seconds}с`;
      return `${seconds}с`;
    };

    const updateTimer = () => {
      setTimeRemaining(getTimeRemaining(auction.endDate));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [auction?.endDate]);

  useEffect(() => {
    if (!auction?.startDate || auction.status !== 'upcoming') return;

    const getTimeUntilStart = (startTime: Date) => {
      const now = new Date();
      const diff = startTime.getTime() - now.getTime();

      if (diff <= 0) return 'Начался';

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) return `${days}д ${hours}ч ${minutes}м`;
      if (hours > 0) return `${hours}ч ${minutes}м ${seconds}с`;
      if (minutes > 0) return `${minutes}м ${seconds}с`;
      return `${seconds}с`;
    };

    const updateTimer = () => {
      setTimeUntilStart(getTimeUntilStart(auction.startDate));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [auction?.startDate, auction?.status]);

  const updateBids = (newBids: AuctionBid[], newCurrentBid: number) => {
    setBids(newBids);
    setAuction(prev => prev ? { 
      ...prev, 
      currentBid: newCurrentBid, 
      bidCount: (prev.bidCount || 0) + 1 
    } : null);
  };

  return {
    auction,
    isLoading,
    bids,
    isRefreshing,
    timeRemaining,
    timeUntilStart,
    bidsRef,
    updateBids
  };
}