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
  const [bidAmount, setBidAmount] = useState('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);

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
      onBidPlaced(updatedBids, amount);
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

  if (auction.status !== 'active') {
    return null;
  }

  return (
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
  );
}
