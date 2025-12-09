import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Icon from '@/components/ui/icon';
import type { Auction } from '@/types/auction';
import { CATEGORIES } from '@/data/categories';

interface MyAuctionCardProps {
  auction: Auction;
  districtName?: string;
  canEdit: boolean;
  canReducePrice: boolean;
  canStop: boolean;
  onDelete: (id: string) => void;
  onStop: (id: string) => void;
  onReducePrice: (id: string, currentPrice: number) => void;
  getStatusBadge: (status: Auction['status']) => JSX.Element | null;
  getTimeRemaining: (endTime: Date) => string;
}

export default function MyAuctionCard({
  auction,
  districtName,
  canEdit,
  canReducePrice,
  canStop,
  onDelete,
  onStop,
  onReducePrice,
  getStatusBadge,
  getTimeRemaining,
}: MyAuctionCardProps) {
  const navigate = useNavigate();
  const category = CATEGORIES.find(c => c.id === auction.category);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        <div className="relative aspect-video bg-muted overflow-hidden">
          {auction.images && auction.images.length > 0 ? (
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
              <span>{auction.bidCount ?? 0}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ставок</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Icon name="Clock" className="h-4 w-4" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {auction.status === 'ended' ? 'Завершен' : auction.endDate ? getTimeRemaining(auction.endDate as any) : 'N/A'}
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
            {canEdit && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                navigate(`/edit-auction/${auction.id}`);
              }}>
                <Icon name="Edit" className="mr-2 h-4 w-4" />
                Редактировать
              </DropdownMenuItem>
            )}
            {canEdit && (
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(auction.id);
                }}
                className="text-destructive"
              >
                <Icon name="Trash2" className="mr-2 h-4 w-4" />
                Удалить
              </DropdownMenuItem>
            )}
            {canReducePrice && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onReducePrice(auction.id, auction.currentBid || auction.startingPrice || 0);
              }}>
                <Icon name="TrendingDown" className="mr-2 h-4 w-4" />
                Снизить цену
              </DropdownMenuItem>
            )}
            {canStop && (
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onStop(auction.id);
                }}
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
}