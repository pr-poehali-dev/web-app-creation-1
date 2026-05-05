import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import { offersAPI } from '@/services/api';
import type { Offer } from '@/types/offer';
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

interface MyAutoSalesProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

type OfferStatus = 'active' | 'moderation' | 'archived';

const STATUS_LABELS: Record<string, string> = {
  active: 'Активно',
  moderation: 'На модерации',
  archived: 'В архиве',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  moderation: 'bg-yellow-100 text-yellow-800',
  archived: 'bg-slate-100 text-slate-800',
};

export default function MyAutoSales({ isAuthenticated, onLogout }: MyAutoSalesProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getSession();

  const [isLoading, setIsLoading] = useState(true);
  const [autoOffers, setAutoOffers] = useState<Offer[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | OfferStatus>('all');
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }
    loadAutoOffers();
  }, [isAuthenticated]);

  const loadAutoOffers = async () => {
    try {
      setIsLoading(true);
      const response = await offersAPI.getOffers({
        status: 'all',
        userId: currentUser!.id,
        limit: 100,
        category: 'auto-sale',
      });
      const filtered = (response.offers || []).filter((o: Offer) => o.category === 'auto-sale');
      setAutoOffers(filtered);
    } catch (error) {
      console.error('Ошибка загрузки авто-объявлений:', error);
      toast({ title: 'Ошибка', description: 'Не удалось загрузить объявления', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (offerId: string) => {
    try {
      await offersAPI.deleteOffer(offerId);
      setAutoOffers(prev => prev.filter(o => o.id !== offerId));
      toast({ title: 'Удалено', description: 'Объявление удалено' });
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить объявление', variant: 'destructive' });
    }
    setOfferToDelete(null);
  };

  const handleEdit = (offerId: string) => {
    navigate(`/create-offer?edit=${offerId}`);
  };

  const filteredOffers = autoOffers.filter(o => {
    if (filterStatus === 'all') return true;
    return o.status === filterStatus;
  });

  const stats = {
    total: autoOffers.length,
    active: autoOffers.filter(o => o.status === 'active').length,
    archived: autoOffers.filter(o => o.status === 'archived').length,
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(price);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <BackButton />

          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">Мои продажи авто</h1>
              <p className="text-muted-foreground">Управляйте своими объявлениями о продаже автомобилей</p>
            </div>
            <Button onClick={() => navigate('/create-offer')}>
              <Icon name="Plus" className="mr-2 h-4 w-4" />
              Добавить объявление
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Всего</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <div className="text-sm text-muted-foreground">Активных</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold text-slate-500">{stats.archived}</div>
                <div className="text-sm text-muted-foreground">В архиве</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {(['all', 'active', 'archived'] as const).map(status => (
              <Button
                key={status}
                variant={filterStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(status)}
              >
                {status === 'all' ? 'Все' : STATUS_LABELS[status]}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
          ) : filteredOffers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Icon name="Car" className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Нет объявлений</h3>
                <p className="text-muted-foreground mb-4">
                  {filterStatus === 'all'
                    ? 'У вас ещё нет объявлений о продаже автомобилей'
                    : `Нет объявлений со статусом "${STATUS_LABELS[filterStatus]}"`}
                </p>
                <Button onClick={() => navigate('/create-offer')}>
                  <Icon name="Plus" className="mr-2 h-4 w-4" />
                  Создать объявление
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOffers.map(offer => (
                <Card key={offer.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      {offer.images && offer.images.length > 0 ? (
                        <div className="w-full sm:w-48 h-40 sm:h-auto flex-shrink-0">
                          <img
                            src={offer.images[0].url}
                            alt={offer.images[0].alt}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full sm:w-48 h-40 sm:h-auto flex-shrink-0 bg-muted flex items-center justify-center">
                          <Icon name="Car" className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}

                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-semibold text-lg">
                                {offer.autoMake} {offer.autoModel} {offer.autoYear}
                              </h3>
                              <Badge className={STATUS_COLORS[offer.status || 'active']}>
                                {STATUS_LABELS[offer.status || 'active']}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              {offer.autoBodyType && <span>{offer.autoBodyType}</span>}
                              {offer.autoColor && <span>• {offer.autoColor}</span>}
                              {offer.autoMileage && <span>• {offer.autoMileage.toLocaleString()} км</span>}
                              {offer.autoFuelType && <span>• {offer.autoFuelType}</span>}
                              {offer.autoTransmission && <span>• {offer.autoTransmission}</span>}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xl font-bold text-primary">
                              {formatPrice(offer.pricePerUnit)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Icon name="Eye" className="h-3 w-3" />
                            {offer.views || 0} просмотров
                          </span>
                          {offer.expiryDate && (
                            <span className="flex items-center gap-1">
                              <Icon name="Calendar" className="h-3 w-3" />
                              до {new Date(offer.expiryDate).toLocaleDateString('ru-RU')}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/offers/${offer.id}`)}
                          >
                            <Icon name="Eye" className="mr-1 h-3 w-3" />
                            Просмотр
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(offer.id)}
                          >
                            <Icon name="Pencil" className="mr-1 h-3 w-3" />
                            Редактировать
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setOfferToDelete(offer.id)}
                          >
                            <Icon name="Trash2" className="mr-1 h-3 w-3" />
                            Удалить
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <AlertDialog open={!!offerToDelete} onOpenChange={() => setOfferToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить объявление?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Объявление будет удалено навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => offerToDelete && handleDelete(offerToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
