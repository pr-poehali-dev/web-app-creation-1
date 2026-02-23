import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { offersAPI } from '@/services/api';
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
import type { Offer } from '@/types/offer';
import { CATEGORIES } from '@/data/categories';
import { useDistrict } from '@/contexts/DistrictContext';
import { DISTRICTS } from '@/data/districts';
import { getSession } from '@/utils/auth';
import { getExpirationStatus } from '@/utils/expirationFilter';
import { NASLEGS } from '@/data/naslegs';

interface OfferCardProps {
  offer: Offer;
  onDelete?: (id: string) => void;
  unreadMessages?: number;
}

export default function OfferCard({ offer, onDelete, unreadMessages }: OfferCardProps) {
  const navigate = useNavigate();
  const currentUser = getSession();
  const { toast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const isOwner = currentUser && String(offer.userId) === String(currentUser.id);

  const category = CATEGORIES.find(c => c.id === offer.category);
  const subcategory = category?.subcategories.find(s => s.id === offer.subcategory);
  const districtName = DISTRICTS.find(d => d.id === offer.district)?.name;
  const expirationInfo = getExpirationStatus(offer);
  const isService = offer.category === 'utilities';
  const isTransport = offer.category === 'transport';
  
  // Найти административный центр района (settlement)
  const getDistrictCenter = (districtId: string) => {
    const center = NASLEGS.find(n => n.districtId === districtId && n.type === 'settlement');
    if (center) {
      return `г. ${center.name}`;
    }
    return '';
  };

  // Извлечь только адрес из location (убрать "г. Город," если есть)
  const getCleanAddress = (loc: string) => {
    return loc
      .replace(/^(г|с|пгт|рп)\.?\s+[А-Яа-яЁё-]+,?\s*/, '')
      .replace(/улица/gi, 'ул.')
      .replace(/проспект/gi, 'пр.')
      .replace(/переулок/gi, 'пер.')
      .replace(/площадь/gi, 'пл.')
      .trim();
  };

  const cityName = getDistrictCenter(offer.district);
  const streetAddress = offer.fullAddress || (offer.location ? getCleanAddress(offer.location) : '');

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? offer.images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === offer.images.length - 1 ? 0 : prev + 1));
  };

  const handleCardClick = () => {
    // Если это своя карточка - открываем редактирование
    if (isOwner) {
      navigate(`/edit-offer/${offer.id}`);
    } else {
      navigate(`/offer/${offer.id}`);
    }
  };

  const handleOrderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/offer/${offer.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/edit-offer/${offer.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (onDelete) {
      onDelete(offer.id);
    }
    setShowDeleteDialog(false);
  };



  const handleMessages = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/my-orders?tab=seller');
  };

  return (
    <Card
      className={`transition-all hover:shadow-xl cursor-pointer group ${
        offer.isPremium ? 'border-2 border-primary shadow-lg' : ''
      }`}
      onClick={handleCardClick}
    >
      {offer.isPremium && (
        <div className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 text-center">
          Премиум
        </div>
      )}

      <CardHeader className="p-0">
        <div className="relative aspect-[16/9] bg-muted overflow-hidden">
          {offer.images.length > 0 ? (
            <>
              <img
                src={offer.images[currentImageIndex].url}
                alt={offer.images[currentImageIndex].alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                decoding="async"
              />
              {offer.images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                  >
                    <Icon name="ChevronLeft" className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                  >
                    <Icon name="ChevronRight" className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {offer.images.map((_, index) => (
                      <div
                        key={index}
                        className={`h-1.5 rounded-full transition-all ${
                          index === currentImageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="flex items-center gap-2 opacity-30">
                <div className="h-16 w-16 overflow-hidden rounded-md flex items-center justify-center">
                  <img 
                    src="https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/bucket/4bbf8889-8425-4a91-bebb-1e4aaa060042.png" 
                    alt="ЕРТТП" 
                    className="h-full w-full scale-[2.5] brightness-125 contrast-125"
                    style={{ filter: 'brightness(1.3) contrast(1.3) drop-shadow(0 0 2px white) drop-shadow(0 0 4px white)', transform: 'scaleX(-1)' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-2.5 space-y-1.5">
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {offer.title}
        </h3>

        <div className="space-y-1">
          {isTransport ? (
            <>
              {offer.transportRoute && (
                <div className="flex items-center gap-1.5">
                  <Icon name="Route" className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <span className="text-xs font-medium truncate">{offer.transportRoute}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 flex-wrap">
                {offer.transportServiceType && (
                  <Badge variant="secondary" className="text-xs h-5 px-2">{offer.transportServiceType}</Badge>
                )}
                {offer.transportType && (
                  <Badge variant="outline" className="text-xs h-5 px-2">{offer.transportType}</Badge>
                )}
              </div>
              {(offer.transportPrice || offer.transportNegotiable) && (
                <div className="flex items-baseline gap-1">
                  {offer.transportNegotiable ? (
                    <Badge variant="secondary" className="text-xs h-5 px-2">Договорная</Badge>
                  ) : (
                    <span className="font-bold text-primary text-lg">
                      {Number(offer.transportPrice).toLocaleString('ru-RU')} ₽
                      {offer.transportPriceType && <span className="text-xs text-muted-foreground ml-1">{offer.transportPriceType}</span>}
                    </span>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-baseline gap-1">
              {isService ? (
                <>
                  {offer.budget ? (
                    <span className="font-bold text-primary text-lg">
                      {offer.budget.toLocaleString('ru-RU')} ₽
                    </span>
                  ) : offer.negotiableBudget ? (
                    <Badge variant="secondary" className="text-xs h-5 px-2">
                      По договоренности
                    </Badge>
                  ) : null}
                </>
              ) : offer.pricePerUnit != null ? (
                <span className="font-bold text-primary text-lg">
                  {offer.pricePerUnit.toLocaleString('ru-RU')} ₽<span className="text-sm text-muted-foreground">/{offer.unit}</span>
                </span>
              ) : null}
            </div>
          )}
          
          {districtName && (
            <div className="flex items-center gap-1.5">
              <Icon name="MapPin" className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground truncate">{districtName}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-2.5 pt-0">
        {isOwner ? (
          <div className="w-full space-y-1.5">
            <Button onClick={handleEdit} variant="outline" className="w-full h-7 text-xs" size="sm">
              <Icon name="Pencil" className="mr-1 h-3 w-3" />
              Редактировать
            </Button>
            {unreadMessages && unreadMessages > 0 && (
              <Button onClick={handleMessages} variant="default" className="w-full h-7 text-xs" size="sm">
                <Icon name="MessageSquare" className="mr-1 h-3 w-3" />
                Сообщения
                <Badge variant="destructive" className="ml-1.5 h-4 min-w-4 px-1 text-[10px]">
                  {unreadMessages}
                </Badge>
              </Button>
            )}
          </div>
        ) : (
          <Button onClick={handleOrderClick} className="w-full h-7 text-xs" size="sm">
            <Icon name="ShoppingCart" className="mr-1 h-3 w-3" />
            Заказать
          </Button>
        )}
      </CardFooter>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить объявление?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Объявление будет удалено безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}