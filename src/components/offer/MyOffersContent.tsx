import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { offersAPI } from '@/services/api';
import type { Offer } from '@/types/offer';
import { notifyOfferUpdated } from '@/utils/dataSync';
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

interface MyOffersContentProps {
  userId: string;
}

export default function MyOffersContent({ userId }: MyOffersContentProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteOfferId, setDeleteOfferId] = useState<string | null>(null);

  useEffect(() => {
    loadMyOffers();
  }, [userId]);

  const loadMyOffers = async () => {
    try {
      setIsLoading(true);
      const response = await offersAPI.getAll();
      const myOffers = response.offers.filter((offer: Offer) => offer.userId?.toString() === userId);
      setOffers(myOffers);
    } catch (error) {
      console.error('Error loading offers:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить предложения',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (offerId: string) => {
    navigate(`/create-offer?edit=${offerId}`);
  };

  const handleDelete = async () => {
    if (!deleteOfferId) return;

    try {
      await offersAPI.deleteOffer(deleteOfferId);
      
      // Уведомляем всех пользователей об удалении
      notifyOfferUpdated(deleteOfferId);
      
      toast({
        title: 'Успешно',
        description: 'Предложение удалено',
      });
      setOffers(offers.filter(o => o.id !== deleteOfferId));
      setDeleteOfferId(null);
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить предложение',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Активно</Badge>;

      case 'moderation':
        return <Badge className="bg-yellow-500">Модерация</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Отклонено</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Загрузка предложений...</p>
        </CardContent>
      </Card>
    );
  }

  if (offers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Icon name="Package" className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">У вас пока нет опубликованных предложений</p>
          <Button onClick={() => navigate('/create-offer')}>
            <Icon name="Plus" className="h-4 w-4 mr-2" />
            Создать предложение
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map(offer => (
          <Card key={offer.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div
              className="relative aspect-video bg-muted cursor-pointer"
              onClick={() => navigate(`/offer/${offer.id}`)}
            >
              {offer.images && offer.images.length > 0 ? (
                <img
                  src={offer.images[0].url}
                  alt={offer.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                  <Icon name="Package" className="h-12 w-12 text-muted-foreground opacity-30" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                {getStatusBadge(offer.status)}
              </div>
            </div>

            <CardContent className="p-4">
              <h3
                className="font-semibold mb-2 line-clamp-2 cursor-pointer hover:text-primary"
                onClick={() => navigate(`/offer/${offer.id}`)}
              >
                {offer.title}
              </h3>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Цена:</span>
                  <span className="font-semibold">
                    {offer.pricePerUnit != null ? Number(offer.pricePerUnit).toLocaleString('ru-RU') : '—'} ₽/{offer.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Количество:</span>
                  <span>{offer.quantity} {offer.unit}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Просмотры:</span>
                  <span>{offer.views || 0}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(offer.id)}
                >
                  <Icon name="Pencil" className="h-4 w-4 mr-1" />
                  Редактировать
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteOfferId(offer.id)}
                >
                  <Icon name="Trash2" className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteOfferId} onOpenChange={(open) => !open && setDeleteOfferId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить предложение?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Предложение будет удалено навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}