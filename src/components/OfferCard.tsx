import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { getSession } from '@/utils/auth';

interface OfferCardProps {
  offer: Offer;
  onDelete?: (id: string) => void;
  unreadMessages?: number;
}

export default function OfferCard({ offer, onDelete, unreadMessages }: OfferCardProps) {
  const navigate = useNavigate();
  const { districts } = useDistrict();
  const currentUser = getSession();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const isOwner = currentUser && offer.userId === currentUser.id;

  const category = CATEGORIES.find(c => c.id === offer.category);
  const subcategory = category?.subcategories.find(s => s.id === offer.subcategory);
  const districtName = districts.find(d => d.id === offer.district)?.name;

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? offer.images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === offer.images.length - 1 ? 0 : prev + 1));
  };

  const handleCardClick = () => {
    navigate(`/offer/${offer.id}`);
  };

  const handleOrderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/offer/${offer.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/offer/${offer.id}`);
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
    navigate('/chat-notifications');
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
        <div className="relative aspect-video bg-muted overflow-hidden">
          {offer.images.length > 0 ? (
            <>
              <img
                src={offer.images[currentImageIndex].url}
                alt={offer.images[currentImageIndex].alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
              <div className="flex items-center space-x-2 opacity-30">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary">
                  <Icon name="Building2" className="h-10 w-10 text-white" />
                </div>
                <span className="text-4xl font-bold text-primary">ЕРТТП</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3 space-y-2">
        <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
          {offer.title}
        </h3>

        <div className="space-y-1 text-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground text-xs">Общая доступная количество:</span>
            <span className="font-medium text-xs">{offer.quantity} {offer.unit}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground text-xs">Цена за единицу:</span>
            <span className="font-bold text-primary text-base">
              {offer.pricePerUnit.toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>

        <div className="pt-2 space-y-1 border-t text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Icon name="MapPin" className="h-3.5 w-3.5" />
            <span className="truncate">{districtName}</span>
          </div>

          {offer.seller && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Icon name="Building2" className="h-3.5 w-3.5" />
              <span className="truncate">{offer.seller.name}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0">
        {isOwner ? (
          <div className="w-full space-y-2">
            <div className="flex gap-2">
              <Button onClick={handleEdit} variant="outline" className="flex-1 h-8 text-xs" size="sm">
                <Icon name="Pencil" className="mr-1.5 h-3.5 w-3.5" />
                Редактировать
              </Button>
              <Button onClick={handleDelete} variant="outline" className="h-8 text-xs px-3" size="sm">
                <Icon name="Trash2" className="h-3.5 w-3.5" />
              </Button>
            </div>
            {unreadMessages && unreadMessages > 0 && (
              <Button onClick={handleMessages} variant="default" className="w-full h-8 text-xs" size="sm">
                <Icon name="MessageSquare" className="mr-1.5 h-3.5 w-3.5" />
                Сообщения
                <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1.5">
                  {unreadMessages}
                </Badge>
              </Button>
            )}
          </div>
        ) : (
          <Button onClick={handleOrderClick} className="w-full h-8 text-xs" size="sm">
            <Icon name="ShoppingCart" className="mr-1.5 h-3.5 w-3.5" />
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