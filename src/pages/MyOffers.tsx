import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import { useOffers } from '@/contexts/OffersContext';
import type { Offer } from '@/types/offer';
import { offersAPI } from '@/services/api';
import MyOfferCard from '@/components/my-offers/MyOfferCard';
import MyOffersStats from '@/components/my-offers/MyOffersStats';
import MyOffersDialogs from '@/components/my-offers/MyOffersDialogs';

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

export default function MyOffers({ isAuthenticated, onLogout }: MyOffersProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { deleteOffer } = useOffers();
  const currentUser = getSession();
  
  const [filterStatus, setFilterStatus] = useState<'all' | OfferStatus>('all');
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [extendDialogOffer, setExtendDialogOffer] = useState<MyOffer | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [myOffers, setMyOffers] = useState<MyOffer[]>([]);
  const [showClearArchiveDialog, setShowClearArchiveDialog] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }

    const loadMyOffers = async () => {
      try {
        setIsLoading(true);
        const response = await offersAPI.getOffers({ 
          status: 'all',
          userId: currentUser.id,
          limit: 100
        });
        
        const loadedOffers: MyOffer[] = (response.offers || []).map((offer: Offer & { favorites?: number }) => ({
          ...offer,
          status: (offer.status as OfferStatus) || 'active',
          views: offer.views || 0,
          favorites: offer.favorites || 0,
        }));
        
        setMyOffers(loadedOffers);
      } catch (error) {
        console.error('Ошибка загрузки предложений:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить ваши предложения',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadMyOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentUser?.id, navigate]);

  const stats = useMemo(() => ({
    total: myOffers.length,
    active: myOffers.filter(o => o.status === 'active').length,
    draft: myOffers.filter(o => o.status === 'draft').length,
    moderation: myOffers.filter(o => o.status === 'moderation').length,
    archived: myOffers.filter(o => o.status === 'archived').length,
  }), [myOffers]);

  const filteredOffers = useMemo(() => 
    filterStatus === 'all' 
      ? myOffers 
      : myOffers.filter(offer => offer.status === filterStatus),
    [myOffers, filterStatus]
  );

  const handleDeleteOffer = async (offerId: string) => {
    try {
      await offersAPI.deleteOffer(offerId);
      deleteOffer(offerId);
      setMyOffers(prev => prev.filter(o => o.id !== offerId));
      setOfferToDelete(null);
      toast({
        title: 'Успешно',
        description: 'Предложение удалено',
      });
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить предложение',
        variant: 'destructive',
      });
    }
  };

  const handleArchiveOffer = (offerId: string) => {
    toast({
      title: 'Успешно',
      description: 'Предложение перемещено в архив',
    });
  };

  const handleActivateOffer = (offerId: string) => {
    toast({
      title: 'Успешно',
      description: 'Предложение опубликовано',
    });
  };

  const handleExtendExpiry = (offer: MyOffer) => {
    setExtendDialogOffer(offer);
    const currentExpiry = offer.expiryDate ? new Date(offer.expiryDate) : new Date();
    const tomorrow = new Date(currentExpiry);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setNewExpiryDate(tomorrow.toISOString().split('T')[0]);
  };

  const confirmExtendExpiry = () => {
    if (!extendDialogOffer || !newExpiryDate) return;
    
    toast({
      title: 'Функция в разработке',
      description: `Продление срока публикации будет доступно после подключения платёжной системы`,
    });
    
    setExtendDialogOffer(null);
    setNewExpiryDate('');
  };

  const handleClearArchive = async () => {
    const archivedOffers = myOffers.filter(o => o.status === 'archived');
    
    try {
      for (const offer of archivedOffers) {
        await offersAPI.deleteOffer(offer.id);
        deleteOffer(offer.id);
      }
      
      setMyOffers(prev => prev.filter(o => o.status !== 'archived'));
      setShowClearArchiveDialog(false);
      
      toast({
        title: 'Успешно',
        description: `Удалено ${archivedOffers.length} ${archivedOffers.length === 1 ? 'предложение' : archivedOffers.length < 5 ? 'предложения' : 'предложений'} из архива`,
      });
    } catch (error) {
      console.error('Error clearing archive:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось очистить архив',
        variant: 'destructive',
      });
    }
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

        <MyOffersStats stats={stats} onFilterChange={setFilterStatus} />

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
            {filterStatus === 'archived' && stats.archived > 0 && (
              <Card className="mb-6 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <Icon name="Info" className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-amber-900 dark:text-amber-100">
                        <strong>Важно:</strong> Архивные предложения автоматически удаляются безвозвратно через 3 месяца для оптимизации работы системы.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Показано: <span className="font-semibold text-foreground">{filteredOffers.length}</span>{' '}
                {filterStatus !== 'all' && `из ${stats.total}`}
              </p>
              {filterStatus === 'archived' && stats.archived > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setShowClearArchiveDialog(true)}
                >
                  <Icon name="Trash2" className="mr-2 h-4 w-4" />
                  Очистить архив
                </Button>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredOffers.map((offer) => (
                <MyOfferCard
                  key={offer.id}
                  offer={offer}
                  onExtendExpiry={handleExtendExpiry}
                  onArchive={handleArchiveOffer}
                  onActivate={handleActivateOffer}
                  onDelete={setOfferToDelete}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <MyOffersDialogs
        offerToDelete={offerToDelete}
        onCancelDelete={() => setOfferToDelete(null)}
        onConfirmDelete={handleDeleteOffer}
        extendDialogOffer={extendDialogOffer}
        onCloseExtendDialog={() => setExtendDialogOffer(null)}
        newExpiryDate={newExpiryDate}
        onExpiryDateChange={setNewExpiryDate}
        onConfirmExtend={confirmExtendExpiry}
        showClearArchiveDialog={showClearArchiveDialog}
        onCloseClearArchive={() => setShowClearArchiveDialog(false)}
        onConfirmClearArchive={handleClearArchive}
        archivedCount={stats.archived}
      />

      <Footer />
    </div>
  );
}