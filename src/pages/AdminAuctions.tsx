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
import { auctionsAPI } from '@/services/api';
import type { Auction } from '@/types/auction';

interface AdminAuctionsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface AdminAuction {
  id: string;
  title: string;
  seller: string;
  startingPrice: number;
  currentBid: number;
  bidsCount: number;
  status: 'active' | 'upcoming' | 'closed' | 'cancelled';
  endDate: string;
  createdAt: string;
}

export default function AdminAuctions({ isAuthenticated, onLogout }: AdminAuctionsProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedAuction, setSelectedAuction] = useState<AdminAuction | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBidsDialog, setShowBidsDialog] = useState(false);
  const [auctions, setAuctions] = useState<AdminAuction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuctions();
  }, []);

  const loadAuctions = async () => {
    setIsLoading(true);
    try {
      const allAuctions = await auctionsAPI.getAllAuctions();
      const adminAuctions: AdminAuction[] = allAuctions.map(a => ({
        id: a.id,
        title: a.title,
        seller: 'Пользователь #' + a.userId,
        startingPrice: a.startingPrice,
        currentBid: a.currentBid,
        bidsCount: a.bidCount,
        status: a.status as 'active' | 'upcoming' | 'closed' | 'cancelled',
        endDate: a.endDate.toISOString(),
        createdAt: a.createdAt.toISOString(),
      }));
      setAuctions(adminAuctions);
    } catch (error) {
      console.error('Error loading auctions:', error);
      toast.error('Ошибка загрузки аукционов');
      setAuctions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const mockBids = [
    { id: '1', bidder: 'ООО "СтройИнвест"', amount: 550000, time: '2024-12-04 14:30' },
    { id: '2', bidder: 'ИП Петров', amount: 540000, time: '2024-12-04 12:15' },
    { id: '3', bidder: 'ПАО "ГорСтрой"', amount: 530000, time: '2024-12-04 10:00' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Активен</Badge>;
      case 'upcoming':
        return <Badge variant="secondary">Предстоящий</Badge>;
      case 'closed':
        return <Badge>Завершен</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Отменен</Badge>;
      default:
        return null;
    }
  };

  const handleCancelAuction = async (auction: AdminAuction) => {
    try {
      await auctionsAPI.deleteAuction(auction.id);
      toast.success(`Аукцион "${auction.title}" отменен`);
      loadAuctions();
    } catch (error) {
      toast.error('Не удалось отменить аукцион');
    }
  };

  const handleDeleteAuction = async () => {
    if (selectedAuction) {
      try {
        await auctionsAPI.deleteAuction(selectedAuction.id);
        toast.success(`Аукцион "${selectedAuction.title}" удален`);
        setShowDeleteDialog(false);
        setSelectedAuction(null);
        loadAuctions();
      } catch (error) {
        toast.error('Не удалось удалить аукцион');
      }
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
              <h1 className="text-3xl font-bold">Управление аукционами</h1>
              <p className="text-muted-foreground">Модерация аукционов и ставок</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Список аукционов</CardTitle>
              <CardDescription>Всего аукционов: {auctions.length}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex-1">
                  <Input
                    placeholder="Поиск по названию..."
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
                    <SelectItem value="upcoming">Предстоящие</SelectItem>
                    <SelectItem value="closed">Завершенные</SelectItem>
                    <SelectItem value="cancelled">Отмененные</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead>Продавец</TableHead>
                      <TableHead>Начальная цена</TableHead>
                      <TableHead>Текущая ставка</TableHead>
                      <TableHead>Ставок</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Окончание</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Загрузка...
                        </TableCell>
                      </TableRow>
                    ) : auctions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Аукционы не найдены
                        </TableCell>
                      </TableRow>
                    ) : (
                      auctions.map((auction) => (
                      <TableRow key={auction.id}>
                        <TableCell className="font-medium">{auction.title}</TableCell>
                        <TableCell>{auction.seller}</TableCell>
                        <TableCell>{auction.startingPrice.toLocaleString('ru-RU')} ₽</TableCell>
                        <TableCell className="font-bold text-green-600">
                          {auction.currentBid.toLocaleString('ru-RU')} ₽
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="link"
                            onClick={() => {
                              setSelectedAuction(auction);
                              setShowBidsDialog(true);
                            }}
                          >
                            {auction.bidsCount}
                          </Button>
                        </TableCell>
                        <TableCell>{getStatusBadge(auction.status)}</TableCell>
                        <TableCell>{new Date(auction.endDate).toLocaleDateString('ru-RU')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/auction/${auction.id}`)}
                            >
                              <Icon name="Eye" className="h-4 w-4" />
                            </Button>
                            {auction.status === 'active' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCancelAuction(auction)}
                              >
                                <Icon name="Ban" className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedAuction(auction);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Icon name="Trash2" className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )))}
                  )
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
            <DialogTitle>Удалить аукцион?</DialogTitle>
            <DialogDescription>
              Вы действительно хотите удалить аукцион "{selectedAuction?.title}"? 
              Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteAuction}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBidsDialog} onOpenChange={setShowBidsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ставки на аукционе</DialogTitle>
            <DialogDescription>
              Аукцион: {selectedAuction?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {mockBids.map((bid, index) => (
              <div key={bid.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <Badge variant={index === 0 ? 'default' : 'secondary'}>
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium">{bid.bidder}</p>
                    <p className="text-sm text-muted-foreground">{bid.time}</p>
                  </div>
                </div>
                <span className="text-lg font-bold">{bid.amount.toLocaleString('ru-RU')} ₽</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowBidsDialog(false)}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}