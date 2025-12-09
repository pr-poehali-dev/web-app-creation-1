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
      className={`transition-all hover:shadow-xl group ${
        auction.isPremium && auction.status !== 'ended' ? 'border-2 border-primary shadow-lg' : ''
      } ${
        isHighlighted ? 'ring-2 ring-primary ring-offset-2 shadow-2xl' : ''
      }`}
    >
      {auction.isPremium && auction.status !== 'ended' && (
        <div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 text-center">
          Премиум аукцион
        </div>
      )}

      <CardHeader className="p-0 cursor-pointer" onClick={() => navigate(`/auction/${auction.id}`)}>
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

      <CardContent className="pt-3 pb-3 cursor-pointer" onClick={() => navigate(`/auction/${auction.id}`)}>
        <div className="space-y-2">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="font-semibold text-base md:text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {auction.title}
              </h3>
            </div>
            {category && (
              <Badge variant="outline" className="text-xs">
                {category.name}
              </Badge>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs md:text-sm">
              <span className="text-muted-foreground">Текущая:</span>
              <span className="font-bold text-base md:text-lg text-primary">
                {auction.currentBid.toLocaleString('ru-RU')} ₽
              </span>
            </div>
            <div className="flex items-center justify-between text-xs md:text-sm">
              <span className="text-muted-foreground">Начальная:</span>
              <span className="font-semibold text-sm md:text-base">
                {auction.startingPrice.toLocaleString('ru-RU')} ₽
              </span>
            </div>
            {auction.buyNowPrice && (
              <div className="flex items-center justify-between text-xs md:text-sm">
                <span className="text-muted-foreground">Купить:</span>
                <span className="font-semibold text-sm md:text-base text-green-600">
                  {auction.buyNowPrice.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs md:text-sm">
              <Icon name="Users" className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {auction.bidsCount} {auction.bidsCount === 1 ? 'ставка' : 'ставок'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs md:text-sm">
              <Icon name="MapPin" className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              <span className="text-muted-foreground truncate">{districtName}</span>
            </div>
            {auction.gpsCoordinates && (
              <div className="flex items-center gap-1.5 text-xs md:text-sm">
                <a
                  href={`https://www.google.com/maps?q=${auction.gpsCoordinates}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Icon name="Map" className="h-3 w-3 md:h-4 md:w-4" />
                  <span>Карта</span>
                </a>
              </div>
            )}
            {auction.status === 'upcoming' && auction.startTime && (
              <div className="flex items-center gap-1.5 text-xs md:text-sm">
                <Icon name="Calendar" className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                <span className="font-semibold text-blue-600">
                  {new Date(auction.startTime).toLocaleString('ru-RU', { 
                    day: 'numeric', 
                    month: 'short', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            )}
            {auction.status !== 'ended' && auction.status !== 'upcoming' && (
              <div className="flex items-center gap-1.5 text-xs md:text-sm">
                <Icon name="Clock" className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                <span className={`font-semibold ${
                  auction.status === 'ending-soon' ? 'text-orange-600' : 'text-muted-foreground'
                }`}>
                  {getTimeRemaining(auction.endTime)}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 pb-3">
        <Button
          className="w-full h-9 text-sm"
          size="sm"
          variant={auction.status === 'ended' ? 'secondary' : 'default'}
          disabled={auction.status === 'ended' || auction.status === 'upcoming'}
          onClick={() => {
            if (!isAuthenticated) {
              navigate('/login');
              return;
            }
            if (auction.status === 'active') {
              navigate(`/auction/${auction.id}?scrollTo=bids`);
            } else {
              navigate(`/auction/${auction.id}`);
            }
          }}
        >
          {auction.status === 'ended' ? (
            <>
              <Icon name="CheckCircle" className="mr-1.5 h-3.5 w-3.5" />
              Завершен
            </>
          ) : !isAuthenticated ? (
            <>
              <Icon name="Lock" className="mr-1.5 h-3.5 w-3.5" />
              Войти
            </>
          ) : (
            <>
              <Icon name="Gavel" className="mr-1.5 h-3.5 w-3.5" />
              Сделать ставку
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}