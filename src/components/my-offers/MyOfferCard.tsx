import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Icon from '@/components/ui/icon';
import { CATEGORIES } from '@/data/categories';
import { DISTRICTS } from '@/data/districts';
import { getExpirationStatus } from '@/utils/expirationFilter';
import type { Offer } from '@/types/offer';

type OfferStatus = 'active' | 'draft' | 'moderation' | 'archived';

interface MyOffer extends Offer {
  status: OfferStatus;
  views: number;
  favorites: number;
}

const STATUS_LABELS: Record<OfferStatus, string> = {
  active: 'Активно',
  draft: 'Черновик',
  moderation: 'На модерации',
  archived: 'В архиве',
};

const STATUS_COLORS: Record<OfferStatus, string> = {
  active: 'bg-green-500',
  draft: 'bg-gray-500',
  moderation: 'bg-orange-500',
  archived: 'bg-slate-500',
};

interface MyOfferCardProps {
  offer: MyOffer;
  onExtendExpiry: (offer: MyOffer) => void;
  onArchive: (offerId: string) => void;
  onActivate: (offerId: string) => void;
  onDelete: (offerId: string) => void;
}

export default function MyOfferCard({ 
  offer, 
  onExtendExpiry, 
  onArchive, 
  onActivate, 
  onDelete 
}: MyOfferCardProps) {
  const navigate = useNavigate();
  
  const category = useMemo(() => 
    CATEGORIES.find(c => c.id === offer.category), 
    [offer.category]
  );
  
  const districtName = useMemo(() => 
    DISTRICTS.find(d => d.id === offer.district)?.name,
    [offer.district]
  );
  
  const expirationInfo = useMemo(() => 
    getExpirationStatus(offer),
    [offer]
  );

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        <div className="relative aspect-video bg-muted overflow-hidden">
          {offer.images.length > 0 ? (
            <img
              src={offer.images[0].url}
              alt={offer.images[0].alt}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon name="Package" className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <div className="absolute top-2 left-2">
            <Badge className={STATUS_COLORS[offer.status]}>
              {STATUS_LABELS[offer.status]}
            </Badge>
          </div>
          {offer.isPremium && (
            <div className="absolute top-2 right-2">
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
          <h3 className="font-semibold text-lg line-clamp-2">{offer.title}</h3>
        </div>

        {category && (
          <Badge variant="secondary">{category.name}</Badge>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Цена:</span>
          <span className="font-bold text-lg text-primary">
            {offer.pricePerUnit.toLocaleString()} ₽
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t text-sm">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Icon name="Eye" className="h-4 w-4" />
              <span>{offer.views}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Просмотры</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Icon name="Heart" className="h-4 w-4" />
              <span>{offer.favorites}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">В избранном</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Icon name="MapPin" className="h-4 w-4" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{districtName}</p>
          </div>
        </div>
        {expirationInfo.expiryDate && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Icon name="Clock" className="h-4 w-4" />
                <span className={expirationInfo.daysRemaining && expirationInfo.daysRemaining <= 3 ? 'text-destructive font-medium' : ''}>
                  {expirationInfo.daysRemaining && expirationInfo.daysRemaining > 0 
                    ? `Осталось ${expirationInfo.daysRemaining} ${expirationInfo.daysRemaining === 1 ? 'день' : expirationInfo.daysRemaining < 5 ? 'дня' : 'дней'}`
                    : 'Истекает сегодня'
                  }
                </span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onExtendExpiry(offer)}>
                Продлить
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => navigate(`/offer/${offer.id}`)}
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
            <DropdownMenuItem onClick={() => navigate(`/edit-offer/${offer.id}`)}>
              <Icon name="Pencil" className="mr-2 h-4 w-4" />
              Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExtendExpiry(offer)}>
              <Icon name="Clock" className="mr-2 h-4 w-4" />
              Продлить публикацию
            </DropdownMenuItem>
            {offer.status === 'draft' && (
              <DropdownMenuItem onClick={() => onActivate(offer.id)}>
                <Icon name="CheckCircle" className="mr-2 h-4 w-4" />
                Опубликовать
              </DropdownMenuItem>
            )}
            {offer.status === 'active' && (
              <DropdownMenuItem onClick={() => onArchive(offer.id)}>
                <Icon name="Archive" className="mr-2 h-4 w-4" />
                В архив
              </DropdownMenuItem>
            )}
            {offer.status === 'archived' && (
              <DropdownMenuItem onClick={() => onActivate(offer.id)}>
                <Icon name="ArchiveRestore" className="mr-2 h-4 w-4" />
                Восстановить
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(offer.id)}
            >
              <Icon name="Trash2" className="mr-2 h-4 w-4" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}