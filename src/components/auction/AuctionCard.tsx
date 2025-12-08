import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { Auction } from '@/types/auction';
import { CATEGORIES } from '@/data/categories';
import { getTimeRemaining, getStatusBadge } from './AuctionHelpers';

interface AuctionCardProps {
  auction: Auction;
  districts: Array<{ id: string; name: string }>;
  isAuthenticated: boolean;
  isHighlighted?: boolean;
}

export default function AuctionCard({ auction, districts, isAuthenticated, isHighlighted = false }: AuctionCardProps) {
  const navigate = useNavigate();
  const category = CATEGORIES.find(c => c.id === auction.category);
  const districtName = districts.find(d => d.id === auction.district)?.name;

  return (
    <Card
      className={`transition-all hover:shadow-xl cursor-pointer group ${
        auction.isPremium && auction.status !== 'ended' ? 'border-2 border-primary shadow-lg' : ''
      } ${
        isHighlighted ? 'ring-2 ring-primary ring-offset-2 shadow-2xl' : ''
      }`}
      onClick={() => navigate(`/auction/${auction.id}`)}
    >
      {auction.isPremium && auction.status !== 'ended' && (
        <div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 text-center">
          Премиум аукцион
        </div>
      )}

      <CardHeader className="p-0">
        <div className="relative aspect-video bg-muted overflow-hidden">
          {auction.images.length > 0 ? (
            <img
              src={auction.images[0].url}
              alt={auction.images[0].alt}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="space-y-3">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {auction.title}
              </h3>
            </div>
            {category && (
              <Badge variant="outline" className="text-xs">
                {category.name}
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Текущая ставка:</span>
              <span className="font-bold text-lg text-primary">
                {auction.currentBid.toLocaleString('ru-RU')} ₽
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Начальная цена:</span>
              <span className="font-semibold">
                {auction.startingPrice.toLocaleString('ru-RU')} ₽
              </span>
            </div>
            {auction.buyNowPrice && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Купить сейчас:</span>
                <span className="font-semibold text-green-600">
                  {auction.buyNowPrice.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Icon name="Users" className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {auction.bidsCount} {auction.bidsCount === 1 ? 'ставка' : 'ставок'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Icon name="MapPin" className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{districtName}</span>
            </div>
            {auction.gpsCoordinates && (
              <div className="flex items-center gap-2 text-sm">
                <a
                  href={`https://www.google.com/maps?q=${auction.gpsCoordinates}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Icon name="Map" className="h-4 w-4" />
                  <span>Карта</span>
                </a>
              </div>
            )}
            {auction.status !== 'ended' && auction.status !== 'upcoming' && (
              <div className="flex items-center gap-2 text-sm">
                <Icon name="Clock" className="h-4 w-4 text-muted-foreground" />
                <span className={`font-semibold ${
                  auction.status === 'ending-soon' ? 'text-orange-600' : 'text-muted-foreground'
                }`}>
                  Осталось: {getTimeRemaining(auction.endTime)}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          className="w-full"
          variant={auction.status === 'ended' ? 'secondary' : 'default'}
          disabled={auction.status === 'ended' || auction.status === 'upcoming' || !isAuthenticated}
        >
          {auction.status === 'ended' ? (
            <>
              <Icon name="CheckCircle" className="mr-2 h-4 w-4" />
              Аукцион завершен
            </>
          ) : !isAuthenticated ? (
            <>
              <Icon name="Lock" className="mr-2 h-4 w-4" />
              Войдите для участия
            </>
          ) : (
            <>
              <Icon name="Gavel" className="mr-2 h-4 w-4" />
              Сделать ставку
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}