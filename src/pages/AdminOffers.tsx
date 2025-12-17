import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { offersAPI } from '@/services/api';
import type { Offer as OfferType } from '@/types/offer';

interface AdminOffersProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface AdminOffer {
  id: string;
  title: string;
  seller: string;
  price: number;
  status: 'active' | 'moderation' | 'rejected' | 'completed' | 'deleted';
  createdAt: string;
}

export default function AdminOffers({ isAuthenticated, onLogout }: AdminOffersProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOffer, setSelectedOffer] = useState<AdminOffer | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [offers, setOffers] = useState<AdminOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, [searchQuery, filterStatus]);

  const fetchOffers = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (searchQuery) params.query = searchQuery;
      if (filterStatus !== 'all') params.status = filterStatus;
      else params.status = 'all';

      const data = await offersAPI.getOffers(params);
      
      const mappedOffers: AdminOffer[] = (data.offers || []).map((offer: any) => ({
        id: offer.id,
        title: offer.title,
        seller: offer.seller?.name || offer.seller_name || 'Неизвестно',
        price: offer.pricePerUnit || offer.price_per_unit || 0,
        status: offer.status || 'active',
        createdAt: offer.createdAt || offer.created_at
      }));
      
      setOffers(mappedOffers);
    } catch (error) {
      console.error('Ошибка загрузки предложений:', error);
      toast.error('Ошибка при загрузке предложений');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Активно</Badge>;
      case 'moderation':
        return <Badge variant="secondary">На модерации</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Отклонено</Badge>;
      case 'completed':
        return <Badge>Завершено</Badge>;
      case 'deleted':
        return <Badge variant="outline" className="bg-gray-100">Удалено</Badge>;
      default:
        return null;
    }
  };

  const handleApproveOffer = async (offer: AdminOffer) => {
    try {
      await offersAPI.updateOffer(offer.id, { status: 'active' });
      toast.success(`Предложение "${offer.title}" одобрено`);
      fetchOffers();
    } catch (error) {
      toast.error('Ошибка при одобрении предложения');
    }
  };

  const handleRejectOffer = async (offer: AdminOffer) => {
    try {
      await offersAPI.updateOffer(offer.id, { status: 'rejected' });
      toast.success(`Предложение "${offer.title}" отклонено`);
      fetchOffers();
    } catch (error) {
      toast.error('Ошибка при отклонении предложения');
    }
  };

  const handleDeleteOffer = async () => {
    if (selectedOffer) {
      try {
        await offersAPI.updateOffer(selectedOffer.id, { status: 'deleted' });
        toast.success(`Предложение "${selectedOffer.title}" удалено`);
        setShowDeleteDialog(false);
        setSelectedOffer(null);
        fetchOffers();
      } catch (error) {
        toast.error('Ошибка при удалении предложения');
      }
    }
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
          await offersAPI.updateOffer(offerId, { status: 'deleted' });
          deletedCount++;
        } catch (err) {
          console.error(`Failed to delete offer ${offerId}:`, err);
        }
      }

      if (deletedCount > 0) {
        toast.success(`Удалено ${deletedCount} тестовых предложений`);
        fetchOffers();
      } else {
        toast.error('Не удалось удалить тестовые предложения');
      }
    } catch (error) {
      toast.error('Ошибка при удалении тестовых предложений');
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
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex-1">
                  <Input
                    placeholder="Поиск по названию или продавцу..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="active">Активные</SelectItem>
                    <SelectItem value="moderation">На модерации</SelectItem>
                    <SelectItem value="rejected">Отклоненные</SelectItem>
                    <SelectItem value="completed">Завершенные</SelectItem>
                    <SelectItem value="deleted">Удаленные</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteTestOffers}
                  className="md:w-auto"
                >
                  <Icon name="Trash2" className="mr-2 h-4 w-4" />
                  Очистить тест
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead>Продавец</TableHead>
                      <TableHead>Цена</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Дата создания</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Загрузка...
                        </TableCell>
                      </TableRow>
                    ) : offers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Предложения не найдены
                        </TableCell>
                      </TableRow>
                    ) : offers.map((offer) => (
                      <TableRow key={offer.id}>
                        <TableCell className="font-medium">{offer.title}</TableCell>
                        <TableCell>{offer.seller}</TableCell>
                        <TableCell>{offer.price.toLocaleString('ru-RU')} ₽</TableCell>
                        <TableCell>{getStatusBadge(offer.status)}</TableCell>
                        <TableCell>{new Date(offer.createdAt).toLocaleDateString('ru-RU')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/offer/${offer.id}`)}
                            >
                              <Icon name="Eye" className="h-4 w-4" />
                            </Button>
                            {offer.status === 'moderation' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleApproveOffer(offer)}
                                >
                                  <Icon name="Check" className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectOffer(offer)}
                                >
                                  <Icon name="X" className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedOffer(offer);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Icon name="Trash2" className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить предложение?</DialogTitle>
            <DialogDescription>
              Вы действительно хотите удалить предложение "{selectedOffer?.title}"? 
              Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteOffer}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}