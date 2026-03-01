import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { ordersAPI } from '@/services/api';
import func2url from '../../backend/func2url.json';
import type { Order } from '@/types/order';
import { dataSync } from '@/utils/dataSync';

interface AdminOrdersProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function AdminOrders({ isAuthenticated, onLogout }: AdminOrdersProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [archiveDialogOrder, setArchiveDialogOrder] = useState<Order | null>(null);
  const [archiveReason, setArchiveReason] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    loadOrders();
    
    const unsubscribe = dataSync.subscribe('order_updated', () => {
      console.log('Order updated, reloading admin orders...');
      loadOrders();
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const response = await ordersAPI.getAll('all');
      
      const mappedOrders = response.orders.map((order: any) => ({
        id: order.id,
        offerId: order.offer_id || order.offerId,
        offerTitle: order.offer_title || order.title,
        offerImage: order.offer_image 
          ? (typeof order.offer_image === 'string' ? JSON.parse(order.offer_image)[0]?.url : order.offer_image[0]?.url) 
          : undefined,
        quantity: order.quantity,
        unit: order.unit,
        pricePerUnit: order.price_per_unit || order.pricePerUnit,
        totalAmount: order.total_amount || order.totalAmount,
        buyerId: order.buyer_id?.toString() || order.buyerId,
        buyerName: order.buyer_name || order.buyerName || order.buyer_full_name,
        buyerPhone: order.buyer_phone || order.buyerPhone,
        buyerEmail: order.buyer_email || order.buyerEmail,
        buyerCompany: order.buyer_company || order.buyerCompany,
        buyerInn: order.buyer_inn || order.buyerInn,
        sellerId: order.seller_id?.toString() || order.sellerId,
        sellerName: order.seller_name || order.sellerName || order.seller_full_name,
        sellerPhone: order.seller_phone || order.sellerPhone,
        sellerEmail: order.seller_email || order.sellerEmail,
        status: order.status,
        deliveryType: order.delivery_type || order.deliveryType || 'delivery',
        comment: order.comment,
        createdAt: new Date(order.createdAt || order.created_at),
        acceptedAt: order.acceptedAt || order.accepted_at 
          ? new Date(order.acceptedAt || order.accepted_at) 
          : undefined,
      }));
      
      setOrders(mappedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить заказы',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanupOrphaned = async () => {
    if (!confirm('Удалить все заказы с несуществующими предложениями?')) {
      return;
    }

    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(
        'https://functions.poehali.dev/ac0118fc-097c-4d35-a326-6afad0b5f8d4?cleanupOrphaned=true',
        {
          method: 'DELETE',
          headers: {
            'X-User-Id': userId || '',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to cleanup');
      }

      const data = await response.json();
      
      toast({
        title: 'Успешно',
        description: `Удалено заказов: ${data.deleted}`,
      });

      await loadOrders();
    } catch (error) {
      console.error('Error cleaning up:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось очистить заказы',
        variant: 'destructive',
      });
    }
  };

  const handleCleanupAll = async () => {
    if (!confirm('⚠️ ВНИМАНИЕ! Это удалит ВСЕ заказы и сообщения из системы! Продолжить?')) {
      return;
    }

    if (!confirm('Вы уверены? Это действие нельзя отменить!')) {
      return;
    }

    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(
        'https://functions.poehali.dev/ac0118fc-097c-4d35-a326-6afad0b5f8d4?cleanupAll=true',
        {
          method: 'DELETE',
          headers: {
            'X-User-Id': userId || '',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to cleanup');
      }

      const data = await response.json();
      
      toast({
        title: 'Очистка завершена',
        description: `Удалено: ${data.deleted_orders} заказов и ${data.deleted_messages} сообщений`,
      });

      await loadOrders();
    } catch (error) {
      console.error('Error cleaning up:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось очистить данные',
        variant: 'destructive',
      });
    }
  };

  const handleAdminArchive = async () => {
    if (!archiveDialogOrder || !archiveReason.trim()) return;
    setIsArchiving(true);
    try {
      const userId = localStorage.getItem('userId');
      const url = `${func2url.orders}?adminArchive=true&id=${archiveDialogOrder.id}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'X-User-Id': userId || '', 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: archiveReason.trim() }),
      });
      if (!response.ok) throw new Error('Ошибка архивирования');
      toast({ title: 'Заказ перемещён в архив', description: `Причина: ${archiveReason.trim()}` });
      setArchiveDialogOrder(null);
      setArchiveReason('');
      await loadOrders();
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось архивировать заказ', variant: 'destructive' });
    } finally {
      setIsArchiving(false);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'new':
        return <Badge variant="outline" className="bg-blue-50">Новый</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50">Ожидает</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50">Принят</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50">Отклонен</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-50">Завершен</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.offerTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.sellerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    new: orders.filter(o => o.status === 'new').length,
    pending: orders.filter(o => o.status === 'pending').length,
    accepted: orders.filter(o => o.status === 'accepted').length,
    completed: orders.filter(o => o.status === 'completed').length,
    totalAmount: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/panel')}
          className="mb-6"
        >
          <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
          Назад в админ-панель
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Все заказы системы</h1>
          <p className="text-muted-foreground">Мониторинг и управление заказами</p>
        </div>

        {/* Статистика */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Всего заказов</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Новые</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ожидают</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Приняты</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Завершены</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Общая сумма</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {stats.totalAmount.toLocaleString('ru-RU')} ₽
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Фильтры */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4 flex-wrap items-center">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Поиск по названию, ID, имени..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="new">Новые</SelectItem>
                  <SelectItem value="pending">Ожидают</SelectItem>
                  <SelectItem value="accepted">Приняты</SelectItem>
                  <SelectItem value="completed">Завершены</SelectItem>
                  <SelectItem value="rejected">Отклонены</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={loadOrders} variant="outline">
                <Icon name="RefreshCw" className="w-4 h-4 mr-2" />
                Обновить
              </Button>
              <Button onClick={handleCleanupOrphaned} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                <Icon name="Trash2" className="w-4 h-4 mr-2" />
                Очистить неактуальные
              </Button>
              <Button onClick={handleCleanupAll} variant="destructive">
                <Icon name="Trash2" className="w-4 h-4 mr-2" />
                Удалить ВСЕ заказы
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Список заказов */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Icon name="Loader2" className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Загрузка заказов...</p>
            </CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Icon name="ShoppingCart" className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Заказы не найдены' 
                  : 'Заказов пока нет'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {order.offerImage && (
                      <img
                        src={order.offerImage}
                        alt={order.offerTitle}
                        className="w-24 h-24 object-cover rounded-md flex-shrink-0"
                      />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{order.offerTitle}</h3>
                          <p className="text-sm text-muted-foreground">
                            ID: {order.id.slice(0, 8)} • {order.createdAt.toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Количество</p>
                          <p className="font-medium">{order.quantity} {order.unit}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Сумма</p>
                          <p className="font-bold text-primary">
                            {order.totalAmount?.toLocaleString('ru-RU') || '0'} ₽
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Покупатель</p>
                          <p className="font-medium truncate">{order.buyerName}</p>
                          <p className="text-xs text-muted-foreground">{order.buyerPhone}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Продавец</p>
                          <p className="font-medium truncate">{order.sellerName}</p>
                          <p className="text-xs text-muted-foreground">{order.sellerPhone}</p>
                        </div>
                      </div>

                      {order.buyerCompany && (
                        <div className="mt-2 text-sm">
                          <p className="text-muted-foreground">Компания покупателя</p>
                          <p className="font-medium">{order.buyerCompany} {order.buyerInn && `(ИНН: ${order.buyerInn})`}</p>
                        </div>
                      )}

                      {order.comment && (
                        <div className="mt-2 text-sm">
                          <p className="text-muted-foreground">Комментарий</p>
                          <p className="mt-1">{order.comment}</p>
                        </div>
                      )}
                      {(order as unknown as Record<string, unknown>).admin_archive_reason && (
                        <div className="mt-2 text-sm p-2 bg-orange-50 border border-orange-200 rounded">
                          <p className="text-orange-700 font-medium">Архивирован администратором</p>
                          <p className="text-orange-600 mt-1">{(order as unknown as Record<string, unknown>).admin_archive_reason as string}</p>
                        </div>
                      )}
                      {order.status !== 'archived' && order.status !== 'completed' && (
                        <div className="mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-orange-300 text-orange-600 hover:bg-orange-50"
                            onClick={() => { setArchiveDialogOrder(order); setArchiveReason(''); }}
                          >
                            <Icon name="Archive" className="w-4 h-4 mr-1" />
                            В архив
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!archiveDialogOrder} onOpenChange={(open) => { if (!open) { setArchiveDialogOrder(null); setArchiveReason(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Перевести заказ в архив</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Заказ: <span className="font-medium text-foreground">{archiveDialogOrder?.offerTitle}</span>
            </p>
            <div className="space-y-2">
              <Label htmlFor="archiveReason">Причина архивирования (обязательно)</Label>
              <Textarea
                id="archiveReason"
                placeholder="Укажите причину, по которой заказ переводится в архив..."
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setArchiveDialogOrder(null); setArchiveReason(''); }}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleAdminArchive}
              disabled={!archiveReason.trim() || isArchiving}
            >
              {isArchiving ? 'Архивирование...' : 'Перевести в архив'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}