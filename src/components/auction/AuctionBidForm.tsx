import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import type { Auction, AuctionBid } from '@/types/auction';

interface AuctionBidFormProps {
  auction: Auction;
  currentUser: any;
  bids: AuctionBid[];
  onBidPlaced: (bids: AuctionBid[], newCurrentBid: number) => void;
}

export default function AuctionBidForm({ auction, currentUser, bids, onBidPlaced }: AuctionBidFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const minNextBid = (auction.currentBid || auction.startingPrice || 0) + (auction.minBidStep || 0);
  const [bidAmount, setBidAmount] = useState(minNextBid.toString());
  const [isPlacingBid, setIsPlacingBid] = useState(false);

  const handleIncrease = () => {
    const current = parseFloat(bidAmount) || minNextBid;
    setBidAmount((current + (auction.minBidStep || 1000)).toString());
  };

  const handleDecrease = () => {
    const current = parseFloat(bidAmount) || minNextBid;
    const newAmount = current - (auction.minBidStep || 1000);
    if (newAmount >= minNextBid) {
      setBidAmount(newAmount.toString());
    }
  };

  const handlePlaceBid = async () => {
    if (!bidAmount || !auction || !currentUser) return;

    const amount = parseFloat(bidAmount);

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
      const userId = localStorage.getItem('userId');
      const response = await fetch('https://functions.poehali.dev/4f5819a8-90ce-4cf8-8bee-cbb08e81da8b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || '',
        },
        body: JSON.stringify({
          auctionId: auction.id,
          amount: amount,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newBid: AuctionBid = {
          id: data.bid.id,
          userId: data.bid.userId,
          userName: data.bid.userName,
          amount: data.bid.amount,
          timestamp: new Date(data.bid.timestamp),
          isWinning: data.bid.isWinning,
        };

        const updatedBids = [...bids, newBid];
        onBidPlaced(updatedBids, amount);
        setBidAmount('');

        toast({
          title: 'Ставка размещена',
          description: `Ваша ставка ${amount.toLocaleString()} ₽ принята`,
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось разместить ставку',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Place bid error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось разместить ставку',
        variant: 'destructive',
      });
    } finally {
      setIsPlacingBid(false);
    }
  };

  if (auction.status !== 'active') {
    return null;
  }

  return (
    <Card>
      <CardHeader className="py-2 md:py-3">
        <CardTitle className="text-sm md:text-base">Сделать ставку</CardTitle>
      </CardHeader>
      <CardContent className="py-2 md:py-3">
        {currentUser ? (
          <div className="space-y-2">
            <Label htmlFor="bidAmount" className="text-xs md:text-sm">Сумма ставки (₽)</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleDecrease}
                disabled={isPlacingBid || parseFloat(bidAmount) <= minNextBid}
                className="h-10 w-10 shrink-0 bg-red-500 hover:bg-red-600 text-white border-red-600 disabled:bg-red-300 disabled:border-red-300"
              >
                <Icon name="ChevronDown" className="h-5 w-5" />
              </Button>
              <Input
                id="bidAmount"
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                min={minNextBid}
                className="text-center font-bold text-base md:text-lg h-10"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleIncrease}
                disabled={isPlacingBid}
                className="h-10 w-10 shrink-0 bg-green-500 hover:bg-green-600 text-white border-green-600 disabled:bg-green-300 disabled:border-green-300"
              >
                <Icon name="ChevronUp" className="h-5 w-5" />
              </Button>
              <Button 
                onClick={handlePlaceBid} 
                disabled={isPlacingBid || !bidAmount}
                className="h-10 shrink-0"
              >
                <Icon name="Gavel" className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">{isPlacingBid ? 'Размещение...' : 'Разместить'}</span>
                <span className="sm:hidden">✓</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-3">
            <Icon name="Lock" className="h-8 w-8 md:h-10 md:w-10 mx-auto mb-1.5 text-muted-foreground opacity-50" />
            <p className="text-xs md:text-sm text-muted-foreground mb-2">Войдите, чтобы сделать ставку</p>
            <Button onClick={() => navigate('/login')}>
              Войти
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}