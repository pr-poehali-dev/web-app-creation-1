import { useParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { CATEGORIES } from '@/data/categories';
import { useDistrict } from '@/contexts/DistrictContext';
import { getSession } from '@/utils/auth';
import { useAuctionData } from '@/hooks/useAuctionData';
import AuctionImageGallery from '@/components/auction/AuctionImageGallery';
import AuctionInfoPanel from '@/components/auction/AuctionInfoPanel';
import AuctionBidForm from '@/components/auction/AuctionBidForm';
import BidHistoryTabs from '@/components/auction/BidHistoryTabs';
import AuctionCompletionForm from '@/components/auction/AuctionCompletionForm';

interface AuctionDetailProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function AuctionDetail({ isAuthenticated, onLogout }: AuctionDetailProps) {
  useScrollToTop();
  const { id } = useParams();
  const { districts } = useDistrict();
  const currentUser = getSession();

  const {
    auction,
    isLoading,
    bids,
    isRefreshing,
    timeRemaining,
    timeUntilStart,
    bidsRef,
    updateBids,
    handlePublish,
  } = useAuctionData(id);

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
  const isOwner = currentUser && currentUser.userId?.toString() === auction.userId?.toString();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-2 md:px-3 py-2 md:py-3 flex-1">
        <div className="mb-2">
          <BackButton />
        </div>

        <div className="grid lg:grid-cols-2 gap-2 md:gap-3 mb-2 md:mb-3">
          <AuctionImageGallery images={auction.images} />
          
          <AuctionInfoPanel
            auction={auction}
            categoryName={category?.name}
            districtName={districtName}
            timeRemaining={timeRemaining}
            timeUntilStart={timeUntilStart}
            onMakeBidClick={() => {
              bidsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
        </div>

        <Card className="mb-2 md:mb-3">
          <CardHeader className="py-2 md:py-3">
            <CardTitle className="text-sm md:text-base">Описание</CardTitle>
          </CardHeader>
          <CardContent className="py-2 md:py-3">
            <p className="text-xs md:text-sm text-muted-foreground whitespace-pre-line line-clamp-2">
              {auction.description}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-2 md:space-y-3" ref={bidsRef}>
          {isOwner && auction.status === 'draft' && (
            <Card>
              <CardContent className="py-3 md:py-4 flex gap-2">
                <Button 
                  size="sm"
                  className="flex-1"
                  onClick={handlePublish}
                >
                  <Icon name="Send" className="h-3.5 w-3.5 mr-1.5" />
                  Опубликовать
                </Button>
              </CardContent>
            </Card>
          )}

          {auction.status === 'ended' && bids.length > 0 && currentUser && (
            <AuctionCompletionForm
              auctionId={auction.id}
              winnerName={bids[0].userName}
              winnerId={bids[0].userId}
              winningBid={bids[0].amount}
              isWinner={bids[0].userId === currentUser.userId}
              isSeller={auction.userId === currentUser.userId}
            />
          )}

          <AuctionBidForm
            auction={auction}
            currentUser={currentUser}
            bids={bids}
            onBidPlaced={updateBids}
          />

          <div className="relative">
            {auction.status === 'active' && (
              <div className="absolute -top-7 right-0 flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className={`h-1.5 w-1.5 rounded-full ${isRefreshing ? 'bg-green-500 animate-pulse' : 'bg-green-500'}`} />
                <span className="hidden sm:inline">Обновление каждые 3 сек</span>
              </div>
            )}
            <BidHistoryTabs 
              bids={bids}
              categoryName={category?.name || 'Аукцион'}
              auctionNumber={typeof auction.id === 'string' ? parseInt(auction.id.slice(-4), 16) % 1000 : auction.id % 1000}
              currentUserId={currentUser?.userId}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}