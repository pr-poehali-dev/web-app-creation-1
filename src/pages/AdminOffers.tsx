import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { offersAPI } from '@/services/api';
import { notifyOfferUpdated, dataSync } from '@/utils/dataSync';
import AdminOffersFilters from '@/components/admin-offers/AdminOffersFilters';
import AdminOffersTable, { type AdminOffer } from '@/components/admin-offers/AdminOffersTable';
import AdminOffersDeleteDialog from '@/components/admin-offers/AdminOffersDeleteDialog';

interface AdminOffersProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function AdminOffers({ isAuthenticated, onLogout }: AdminOffersProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeller, setFilterSeller] = useState<string>('all');
  const [selectedOffer, setSelectedOffer] = useState<AdminOffer | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [offers, setOffers] = useState<AdminOffer[]>([]);
  const [allOffers, setAllOffers] = useState<AdminOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');

  useEffect(() => {
    fetchOffers();
  }, [searchQuery, filterStatus]);

  useEffect(() => {
    const unsubscribe = dataSync.subscribe('offer_updated', () => {
      console.log('Offer updated, reloading admin offers...');
      fetchOffers();
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allOffers, filterSeller]);

  const fetchOffers = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchQuery) params.search = searchQuery;
      if (filterStatus !== 'all') params.status = filterStatus;

      const data = await offersAPI.getAdminOffers(params);
      
      const mappedOffers: AdminOffer[] = (data.offers || []).map((offer: Record<string, unknown>) => ({
        id: offer.id as string,
        title: offer.title as string,
        seller: (offer.seller as string) || 'Неизвестно',
        sellerId: offer.sellerId as string | undefined,
        price: (offer.pricePerUnit || offer.price_per_unit || offer.price || 0) as number,
        quantity: (offer.quantity || 0) as number,
        soldQuantity: (offer.sold_quantity || offer.soldQuantity || 0) as number,
        reservedQuantity: (offer.reserved_quantity || offer.reservedQuantity || 0) as number,
        unit: (offer.unit as string) || 'шт',
        status: (offer.status as AdminOffer['status']) || 'active',
        createdAt: (offer.createdAt || offer.created_at) as string
      }));
      
      setAllOffers(mappedOffers);
      setOffers(mappedOffers);
    } catch (error) {
      console.error('Ошибка загрузки предложений:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить предложения',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    if (filterSeller === 'all') {
      setOffers(allOffers);
    } else {
      setOffers(allOffers.filter(offer => offer.sellerId === filterSeller));
    }
  };

  const uniqueSellers = Array.from(
    new Map(
      allOffers
        .filter(o => o.sellerId)
        .map(o => [o.sellerId, { id: o.sellerId!, name: o.seller }])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const handleApproveOffer = async (offer: AdminOffer) => {
    try {
      await offersAPI.updateOffer(offer.id, { status: 'active' });
      notifyOfferUpdated(offer.id);
      toast({
        title: 'Успешно',
        description: `Предложение "${offer.title}" одобрено`,
      });
      fetchOffers();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось одобрить предложение',
        variant: 'destructive',
      });
    }
  };

  const handleRejectOffer = async (offer: AdminOffer) => {
    try {
      await offersAPI.updateOffer(offer.id, { status: 'rejected' });
      notifyOfferUpdated(offer.id);
      toast({
        title: 'Успешно',
        description: `Предложение "${offer.title}" отклонено`,
      });
      fetchOffers();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отклонить предложение',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteOffer = async () => {
    if (selectedOffer) {
      try {
        await offersAPI.deleteOffer(selectedOffer.id);
        notifyOfferUpdated(selectedOffer.id);
        toast({
          title: 'Успешно',
          description: `Предложение "${selectedOffer.title}" удалено`,
        });
        setShowDeleteDialog(false);
        setSelectedOffer(null);
        fetchOffers();
      } catch (error) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось удалить предложение',
          variant: 'destructive',
        });
      }
    }
  };

  const handleEditTitle = (offer: AdminOffer) => {
    setEditingTitleId(offer.id);
    setEditingTitleValue(offer.title);
  };

  const handleSaveTitle = async (offerId: string) => {
    const trimmed = editingTitleValue.trim();
    if (!trimmed) return;
    try {
      await offersAPI.adminEditTitle(offerId, trimmed);
      toast({ title: 'Сохранено', description: 'Название обновлено' });
      setEditingTitleId(null);
      fetchOffers();
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить название', variant: 'destructive' });
    }
  };

  const handleCancelEditTitle = () => {
    setEditingTitleId(null);
    setEditingTitleValue('');
  };

  const handleDeleteTestOffers = async () => {
    const testOfferIds = [
      'a235d4f8-c303-40f2-8aa3-b1adf798bb37',
      '448c6586-8611-4f06-887e-d984653f8fd2'
    ];

    try {
      let deletedCount = 0;
      for (const offerId of testOfferIds) {
        try {
          await offersAPI.updateOffer(offerId, { status: 'archived' });
          notifyOfferUpdated(offerId);
          deletedCount++;
        } catch (err) {
          console.error(`Failed to delete offer ${offerId}:`, err);
        }
      }

      if (deletedCount > 0) {
        toast({
          title: 'Успешно',
          description: `Удалено ${deletedCount} тестовых предложений`,
        });
        fetchOffers();
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось удалить тестовые предложения',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить тестовые предложения',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
                <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
                Назад
              </Button>
              <h1 className="text-3xl font-bold">Управление предложениями</h1>
              <p className="text-muted-foreground">Модерация и управление предложениями</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Список предложений</CardTitle>
              <CardDescription>Всего предложений: {offers.length}</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminOffersFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterStatus={filterStatus}
                onFilterStatusChange={setFilterStatus}
                filterSeller={filterSeller}
                onFilterSellerChange={setFilterSeller}
                uniqueSellers={uniqueSellers}
                onDeleteTestOffers={handleDeleteTestOffers}
              />

              <AdminOffersTable
                offers={offers}
                isLoading={isLoading}
                editingTitleId={editingTitleId}
                editingTitleValue={editingTitleValue}
                onEditingTitleValueChange={setEditingTitleValue}
                onEditTitle={handleEditTitle}
                onSaveTitle={handleSaveTitle}
                onCancelEditTitle={handleCancelEditTitle}
                onApprove={handleApproveOffer}
                onReject={handleRejectOffer}
                onDelete={(offer) => {
                  setSelectedOffer(offer);
                  setShowDeleteDialog(true);
                }}
              />
            </CardContent>
          </Card>
        </div>
      </main>

      <AdminOffersDeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteOffer}
        offerTitle={selectedOffer?.title}
      />

      <Footer />
    </div>
  );
}
