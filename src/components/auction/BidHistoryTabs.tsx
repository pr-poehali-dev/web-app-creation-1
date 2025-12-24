import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { AuctionBid } from '@/types/auction';
import { useDateFormat } from '@/hooks/useDateFormat';

interface BidHistoryTabsProps {
  bids: AuctionBid[];
  categoryName: string;
  auctionNumber: number;
  currentUserId?: string;
}

function generateParticipantId(
  userId: string, 
  categoryName: string, 
  auctionNumber: number, 
  allBids: AuctionBid[]
): string {
  const categoryCode = categoryName.charAt(0).toUpperCase();
  
  const uniqueUserIds = Array.from(new Set(allBids.map(bid => bid.userId)));
  uniqueUserIds.sort();
  
  const participantNumber = uniqueUserIds.indexOf(userId) + 1;
  
  return `${categoryCode}${auctionNumber}-${participantNumber}`;
}

export default function BidHistoryTabs({ 
  bids, 
  categoryName, 
  auctionNumber,
  currentUserId 
}: BidHistoryTabsProps) {
  const { formatDateTime } = useDateFormat();
  const [activeTab, setActiveTab] = useState('history');
  const [newBidId, setNewBidId] = useState<string | null>(null);
  const prevBidsLength = useRef(bids.length);

  useEffect(() => {
    if (bids.length > prevBidsLength.current && bids.length > 0) {
      const latestBid = [...bids].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];
      
      setNewBidId(latestBid.id);
      setTimeout(() => setNewBidId(null), 3000);
    }
    prevBidsLength.current = bids.length;
  }, [bids]);

  const sortedBids = [...bids].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const ascendingBids = [...bids].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const uniqueParticipants = Array.from(new Set(bids.map(b => b.userId))).length;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="history" className="text-xs md:text-sm">
          <Icon name="History" className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
          <span className="hidden sm:inline">История ставок</span>
          <span className="sm:hidden">История</span>
          {bids.length > 0 && (
            <Badge variant="secondary" className="ml-1 md:ml-2 text-xs">{bids.length}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="participants" className="text-xs md:text-sm">
          <Icon name="Users" className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
          <span className="hidden sm:inline">Участники</span>
          <span className="sm:hidden">Участники</span>
          {uniqueParticipants > 0 && (
            <Badge variant="secondary" className="ml-1 md:ml-2 text-xs">{uniqueParticipants}</Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="history" className="mt-3">
        <Card>
          <CardHeader className="py-3 md:py-4">
            <CardTitle className="text-base md:text-lg">Все ставки</CardTitle>
          </CardHeader>
          <CardContent className="py-3 md:py-4">
            {sortedBids.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Icon name="Gavel" className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm md:text-base">Ставок пока нет</p>
              </div>
            ) : (
              <ScrollArea className="h-[250px] md:h-[300px] pr-2 md:pr-4">
                <div className="space-y-2 md:space-y-3">
                  {sortedBids.map((bid, index) => {
                    const participantId = generateParticipantId(
                      bid.userId, 
                      categoryName, 
                      auctionNumber, 
                      bids
                    );
                    const isCurrentUser = bid.userId === currentUserId;
                    
                    return (
                      <div 
                        key={bid.id}
                        className={`flex items-center justify-between p-2 md:p-3 rounded-lg border transition-all duration-500 ${
                          index === 0 
                            ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' 
                            : 'bg-muted/50'
                        } ${
                          newBidId === bid.id ? 'animate-pulse ring-2 ring-green-500' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            index === 0 
                              ? 'bg-green-100 dark:bg-green-900/30' 
                              : 'bg-background'
                          }`}>
                            <Icon 
                              name={index === 0 ? "Trophy" : "User"} 
                              className={`h-4 w-4 md:h-5 md:w-5 ${
                                index === 0 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-muted-foreground'
                              }`} 
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1 md:gap-2">
                              <span className="text-sm md:text-base font-medium">{participantId}</span>
                              {isCurrentUser && (
                                <Badge variant="outline" className="text-[10px] md:text-xs px-1 py-0">Вы</Badge>
                              )}
                              {index === 0 && (
                                <Badge className="bg-green-600 text-[10px] md:text-xs px-1 py-0">TOP</Badge>
                              )}
                            </div>
                            <p className="text-[10px] md:text-xs text-muted-foreground">
                              {formatDateTime(bid.timestamp, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base md:text-lg lg:text-xl font-bold">{bid.amount.toLocaleString()} ₽</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="participants" className="mt-3">
        <Card>
          <CardHeader className="py-3 md:py-4">
            <CardTitle className="text-base md:text-lg">Активность</CardTitle>
          </CardHeader>
          <CardContent className="py-3 md:py-4">
            {ascendingBids.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Icon name="Users" className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm md:text-base">Участников пока нет</p>
              </div>
            ) : (
              <ScrollArea className="h-[250px] md:h-[300px] pr-2 md:pr-4">
                <div className="space-y-2 md:space-y-3">
                  {Array.from(new Set(bids.map(b => b.userId))).map((userId) => {
                    const participantId = generateParticipantId(
                      userId, 
                      categoryName, 
                      auctionNumber, 
                      bids
                    );
                    const isCurrentUser = userId === currentUserId;
                    const userBidsCount = bids.filter(b => b.userId === userId).length;
                    const userMaxBid = Math.max(...bids.filter(b => b.userId === userId).map(b => b.amount));
                    const isLeading = sortedBids[0]?.userId === userId;
                    
                    return (
                      <div 
                        key={userId}
                        className="flex items-center justify-between p-2 md:p-3 rounded-lg border bg-muted/50"
                      >
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
                            isLeading 
                              ? 'bg-green-100 dark:bg-green-900/30' 
                              : 'bg-background'
                          }`}>
                            <Icon 
                              name="User" 
                              className={`h-4 w-4 md:h-5 md:w-5 ${
                                isLeading 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-muted-foreground'
                              }`} 
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Участник {participantId}</span>
                              {isCurrentUser && (
                                <Badge variant="outline" className="text-xs">Вы</Badge>
                              )}
                              {isLeading && (
                                <Badge className="bg-green-600 text-xs">Лидирует</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Icon name="Gavel" className="h-3 w-3" />
                                {userBidsCount} {userBidsCount === 1 ? 'ставка' : userBidsCount < 5 ? 'ставки' : 'ставок'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Icon name="TrendingUp" className="h-3 w-3" />
                                Макс: {userMaxBid.toLocaleString()} ₽
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}