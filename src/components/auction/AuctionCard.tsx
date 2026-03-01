import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import OptimizedImage from '@/components/ui/optimized-image';
import type { Auction } from '@/types/auction';
import { CATEGORIES } from '@/data/categories';
import { getTimeRemaining, getTimeUntilStart } from './AuctionHelpers';
import { getSession } from '@/utils/auth';
import { sharedTimer } from '@/utils/sharedTimer';

interface AuctionCardProps {
  auction: Auction;
  districts: Array<{ id: string; name: string }>;
  isAuthenticated: boolean;
  isHighlighted?: boolean;
  onDelete?: (id: string) => void;
}

function StatusBadge({ status, liveTime }: { status: Auction['status']; liveTime: string }) {
  switch (status) {
    case 'active':
      return (
        <Badge className="bg-green-500 text-xs px-1.5 py-0.5">
          <Icon name="Play" className="h-2.5 w-2.5 mr-1" />
          Активен
        </Badge>
      );
    case 'ending-soon':
      return (
        <Badge className="bg-orange-500 text-xs px-1.5 py-0.5 tabular-nums">
          <Icon name="Clock" className="h-2.5 w-2.5 mr-1" />
          {liveTime || 'Скоро'}
        </Badge>
      );
    case 'upcoming':
      return (
        <Badge className="bg-blue-500 text-xs px-1.5 py-0.5">
          <Icon name="Calendar" className="h-2.5 w-2.5 mr-1" />
          Предстоящий
        </Badge>
      );
    case 'ended':
      return (
        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
          <Icon name="CheckCircle" className="h-2.5 w-2.5 mr-1" />
          Завершен
        </Badge>
      );
  }
}

export default function AuctionCard({ auction, districts, isAuthenticated, isHighlighted = false, onDelete }: AuctionCardProps) {
  const navigate = useNavigate();
  const currentUser = getSession();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [liveTime, setLiveTime] = useState('');

  const isOwner = currentUser && auction.userId === currentUser.id;
  const category = CATEGORIES.find(c => c.id === auction.category);
  const districtName = districts.find(d => d.id === auction.district)?.name;

  useEffect(() => {
    if (auction.status === 'ended') return;

    const updateTime = () => {
      if (auction.status === 'upcoming' && auction.startTime) {
        setLiveTime(getTimeUntilStart(auction.startTime));
      } else if (auction.endTime) {
        setLiveTime(getTimeRemaining(auction.endTime));
      }
    };

    updateTime();
    const unsubscribe = sharedTimer.subscribe(updateTime);

    return unsubscribe;
  }, [auction.status, auction.endTime, auction.startTime]);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/edit-auction/${auction.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (onDelete) onDelete(auction.id);
    setShowDeleteDialog(false);
  };

  return (
    <Card
      className={`transition-all hover:shadow-lg group ${
        auction.isPremium && auction.status !== 'ended' ? 'border-2 border-primary shadow-md' : ''
      } ${isHighlighted ? 'ring-2 ring-primary ring-offset-2 shadow-xl' : ''}`}
    >
      {auction.isPremium && auction.status !== 'ended' && (
        <div className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 text-center">
          Премиум
        </div>
      )}

      <CardHeader className="p-0 cursor-pointer" onClick={() => navigate(`/auction/${auction.id}`)}>
        <div className="relative aspect-[16/9] bg-muted overflow-hidden">
          {auction.images.length > 0 ? (
            <OptimizedImage
              src={auction.images[0].url}
              alt={auction.images[0].alt}
              width={400}
              quality={70}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="flex items-center space-x-1.5 opacity-20">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <Icon name="Building2" className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-primary">ЕРТТП</span>
              </div>
            </div>
          )}
          <div className="absolute top-1.5 right-1.5">
            <StatusBadge status={auction.status} liveTime={liveTime} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 pt-2.5 pb-2 cursor-pointer" onClick={() => navigate(`/auction/${auction.id}`)}>
        <div className="space-y-1.5">
          <div>
            <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-1 mb-1">
              {auction.title}
            </h3>
            {category && (
              <Badge variant="outline" className="text-xs py-0 px-1.5 h-5">
                {category.name}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Текущая:</span>
                <span className="font-bold text-sm text-primary">
                  {auction.currentBid.toLocaleString('ru-RU')} ₽
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Нач.:</span>
                <span>{auction.startingPrice.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
            {auction.buyNowPrice && (
              <div className="text-right text-xs">
                <span className="text-muted-foreground block">Купить:</span>
                <span className="font-semibold text-green-600">{auction.buyNowPrice.toLocaleString('ru-RU')} ₽</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Icon name="Users" className="h-3 w-3" />
                {auction.bidsCount}
              </span>
              <span className="flex items-center gap-1 truncate max-w-[100px]">
                <Icon name="MapPin" className="h-3 w-3 shrink-0" />
                <span className="truncate">{districtName}</span>
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {auction.gpsCoordinates && (
                <a
                  href={`https://www.google.com/maps?q=${auction.gpsCoordinates}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-0.5 text-primary hover:underline"
                >
                  <Icon name="Map" className="h-3 w-3" />
                  Карта
                </a>
              )}
              {auction.status === 'upcoming' && auction.startTime && (
                <span className="flex items-center gap-1 text-blue-600 font-semibold tabular-nums">
                  <Icon name="Clock" className="h-3 w-3" />
                  {liveTime}
                </span>
              )}
              {auction.status === 'active' && (
                <span className="flex items-center gap-1 text-muted-foreground font-medium tabular-nums">
                  <Icon name="Clock" className="h-3 w-3" />
                  {liveTime}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-3 pt-0 pb-2.5">
        {isOwner ? (
          <div className="flex flex-col gap-1.5 w-full">
            {auction.status === 'ended' && (
              <Button
                variant="default"
                size="sm"
                className="w-full h-8 text-xs"
                onClick={(e) => { e.stopPropagation(); navigate(`/auction/${auction.id}`); }}
              >
                <Icon name="MessageCircle" className="mr-1 h-3 w-3" />
                Контакты победителя
              </Button>
            )}
            <div className="flex gap-1.5 w-full">
              <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={handleEdit}>
                <Icon name="Pencil" className="mr-1 h-3 w-3" />
                Редактировать
              </Button>
              <Button variant="destructive" size="sm" className="flex-1 h-8 text-xs" onClick={handleDelete}>
                <Icon name="Trash2" className="mr-1 h-3 w-3" />
                Удалить
              </Button>
            </div>
          </div>
        ) : (
          <Button
            className="w-full h-8 text-xs"
            size="sm"
            disabled={auction.status === 'upcoming'}
            onClick={() => {
              if (!isAuthenticated) { navigate('/login'); return; }
              if (auction.status === 'ended') {
                navigate(`/auction/${auction.id}`);
              } else if (auction.status === 'active') {
                navigate(`/auction/${auction.id}?scrollTo=bids`);
              } else {
                navigate(`/auction/${auction.id}`);
              }
            }}
          >
            {auction.status === 'ended' ? (
              <><Icon name="MessageCircle" className="mr-1 h-3 w-3" />Контакты продавца</>
            ) : !isAuthenticated ? (
              <><Icon name="Lock" className="mr-1 h-3 w-3" />Войти</>
            ) : (
              <><Icon name="Gavel" className="mr-1 h-3 w-3" />Сделать ставку</>
            )}
          </Button>
        )}
      </CardFooter>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить аукцион?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Аукцион будет удален навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
