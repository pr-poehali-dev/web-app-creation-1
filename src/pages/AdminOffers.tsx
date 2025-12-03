import { useState } from 'react';
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

interface AdminOffersProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface Offer {
  id: string;
  title: string;
  seller: string;
  price: number;
  status: 'active' | 'moderation' | 'rejected' | 'completed';
  createdAt: string;
}

export default function AdminOffers({ isAuthenticated, onLogout }: AdminOffersProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const mockOffers: Offer[] = [
    {
      id: '1',
      title: 'Цемент М500 50кг',
      seller: 'ООО "СтройМатериалы"',
      price: 350,
      status: 'active',
      createdAt: '2024-01-20'
    },
    {
      id: '2',
      title: 'Кирпич красный полнотелый',
      seller: 'ИП Петров',
      price: 15,
      status: 'moderation',
      createdAt: '2024-02-15'
    },
    {
      id: '3',
      title: 'Песок речной навалом',
      seller: 'ПАО "ГорСтрой"',
      price: 500,
      status: 'active',
      createdAt: '2024-03-10'
    },
  ];

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
      default:
        return null;
    }
  };

  const handleApproveOffer = (offer: Offer) => {
    toast.success(`Предложение "${offer.title}" одобрено`);
  };

  const handleRejectOffer = (offer: Offer) => {
    toast.success(`Предложение "${offer.title}" отклонено`);
  };

  const handleDeleteOffer = () => {
    if (selectedOffer) {
      toast.success(`Предложение "${selectedOffer.title}" удалено`);
      setShowDeleteDialog(false);
      setSelectedOffer(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} className="mb-2">
                <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
                Назад к панели
              </Button>
              <h1 className="text-3xl font-bold">Управление предложениями</h1>
              <p className="text-muted-foreground">Модерация и управление предложениями</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Список предложений</CardTitle>
              <CardDescription>Всего предложений: {mockOffers.length}</CardDescription>
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
                  </SelectContent>
                </Select>
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
                    {mockOffers.map((offer) => (
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
