import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import { MOCK_OFFERS } from '@/data/mockOffers';
import type { Offer } from '@/types/offer';
import { CATEGORIES } from '@/data/categories';
import { useDistrict } from '@/contexts/DistrictContext';

interface MyOffersProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

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

export default function MyOffers({ isAuthenticated, onLogout }: MyOffersProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { districts } = useDistrict();
  const currentUser = getSession();
  
  const [offers, setOffers] = useState<MyOffer[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | OfferStatus>('all');
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }

    setTimeout(() => {
      const userOffers: MyOffer[] = MOCK_OFFERS.slice(0, 3).map((offer, index) => ({
        ...offer,
        status: index === 0 ? 'active' : index === 1 ? 'moderation' : 'draft',
        views: Math.floor(Math.random() * 500) + 50,
        favorites: Math.floor(Math.random() * 50) + 5,
      }));
      setOffers(userOffers);
      setIsLoading(false);
    }, 800);
  }, [isAuthenticated, currentUser, navigate]);

  const filteredOffers = filterStatus === 'all' 
    ? offers 
    : offers.filter(offer => offer.status === filterStatus);

  const handleDeleteOffer = (offerId: string) => {
    setOffers(offers.filter(offer => offer.id !== offerId));
    setOfferToDelete(null);
    toast({
      title: 'Успешно',
      description: 'Предложение удалено',
    });
  };

  const handleArchiveOffer = (offerId: string) => {
    setOffers(offers.map(offer => 
      offer.id === offerId ? { ...offer, status: 'archived' as OfferStatus } : offer
    ));
    toast({
      title: 'Успешно',
      description: 'Предложение перемещено в архив',
    });
  };

  const handleActivateOffer = (offerId: string) => {
    setOffers(offers.map(offer => 
      offer.id === offerId ? { ...offer, status: 'active' as OfferStatus } : offer
    ));
    toast({
      title: 'Успешно',
      description: 'Предложение опубликовано',
    });
  };

  const getOfferStats = () => {
    return {
      total: offers.length,
      active: offers.filter(o => o.status === 'active').length,
      draft: offers.filter(o => o.status === 'draft').length,
      moderation: offers.filter(o => o.status === 'moderation').length,
      archived: offers.filter(o => o.status === 'archived').length,
    };
  };

  const stats = getOfferStats();

  const OfferCard = ({ offer }: { offer: MyOffer }) => {
    const category = CATEGORIES.find(c => c.id === offer.category);
    const districtName = districts.find(d => d.id === offer.district)?.name;

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
              <DropdownMenuItem disabled>
                <Icon name="Pencil" className="mr-2 h-4 w-4" />
                Редактировать
              </DropdownMenuItem>
              {offer.status === 'draft' && (
                <DropdownMenuItem onClick={() => handleActivateOffer(offer.id)}>
                  <Icon name="CheckCircle" className="mr-2 h-4 w-4" />
                  Опубликовать
                </DropdownMenuItem>
              )}
              {offer.status === 'active' && (
                <DropdownMenuItem onClick={() => handleArchiveOffer(offer.id)}>
                  <Icon name="Archive" className="mr-2 h-4 w-4" />
                  В архив
                </DropdownMenuItem>
              )}
              {offer.status === 'archived' && (
                <DropdownMenuItem onClick={() => handleActivateOffer(offer.id)}>
                  <Icon name="ArchiveRestore" className="mr-2 h-4 w-4" />
                  Восстановить
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setOfferToDelete(offer.id)}
              >
                <Icon name="Trash2" className="mr-2 h-4 w-4" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
            Назад
          </Button>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Мои предложения</h1>
              <p className="text-muted-foreground mt-1">
                Управляйте своими опубликованными предложениями
              </p>
            </div>
            <Button onClick={() => navigate('/create-offer')}>
              <Icon name="Plus" className="mr-2 h-4 w-4" />
              Создать предложение
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('all')}>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary">{stats.total}</div>
              <p className="text-sm text-muted-foreground mt-1">Всего</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('active')}>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-green-500">{stats.active}</div>
              <p className="text-sm text-muted-foreground mt-1">Активных</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('draft')}>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-gray-500">{stats.draft}</div>
              <p className="text-sm text-muted-foreground mt-1">Черновики</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('moderation')}>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-orange-500">{stats.moderation}</div>
              <p className="text-sm text-muted-foreground mt-1">На модерации</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('archived')}>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-slate-500">{stats.archived}</div>
              <p className="text-sm text-muted-foreground mt-1">В архиве</p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="h-96 animate-pulse bg-muted" />
            ))}
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="Package" className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-xl font-semibold mb-2">
              {filterStatus === 'all' ? 'У вас пока нет предложений' : `Нет предложений со статусом "${STATUS_LABELS[filterStatus]}"`}
            </h3>
            <p className="text-muted-foreground mb-8">
              Создайте свое первое предложение, чтобы начать продажи
            </p>
            <Button onClick={() => navigate('/create-offer')}>
              <Icon name="Plus" className="mr-2 h-4 w-4" />
              Создать предложение
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Показано: <span className="font-semibold text-foreground">{filteredOffers.length}</span>{' '}
                {filterStatus !== 'all' && `из ${stats.total}`}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          </>
        )}
      </main>

      <AlertDialog open={!!offerToDelete} onOpenChange={() => setOfferToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить предложение?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Предложение будет удалено безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => offerToDelete && handleDeleteOffer(offerToDelete)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}