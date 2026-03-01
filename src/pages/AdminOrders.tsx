import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { ordersAPI } from '@/services/api';
import func2url from '../../backend/func2url.json';
import type { Order } from '@/types/order';
import { dataSync } from '@/utils/dataSync';
import { addNotification } from '@/utils/notifications';
import AdminOrdersStats from '@/components/admin-orders/AdminOrdersStats';
import AdminOrdersFilters from '@/components/admin-orders/AdminOrdersFilters';
import AdminOrdersList from '@/components/admin-orders/AdminOrdersList';
import AdminOrdersArchiveDialog from '@/components/admin-orders/AdminOrdersArchiveDialog';

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

      const mappedOrders = response.orders.map((order: Record<string, unknown>) => ({
        id: order.id,
        offerId: order.offer_id || order.offerId,
        offerTitle: order.offer_title || order.title,
        offerImage: order.offer_image
          ? (typeof order.offer_image === 'string' ? JSON.parse(order.offer_image)[0]?.url : (order.offer_image as { url: string }[])[0]?.url)
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
        createdAt: new Date((order.createdAt || order.created_at) as string),
        acceptedAt: order.acceptedAt || order.accepted_at
          ? new Date((order.acceptedAt || order.accepted_at) as string)
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

      const order = archiveDialogOrder;
      const notifTitle = `Заказ №${order.id.slice(0, 8)} перемещён в архив`;
      const notifMessage = `Администратор переместил заказ «${order.offerTitle}» в архив. Причина: ${archiveReason.trim()}`;
      if (order.buyerId) addNotification(order.buyerId, 'system', notifTitle, notifMessage, '/my-orders?tab=archived');
      if (order.sellerId) addNotification(order.sellerId, 'system', notifTitle, notifMessage, '/my-orders?tab=archived');

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

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.offerTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.sellerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

        <AdminOrdersStats orders={orders} />

        <AdminOrdersFilters
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          onSearchChange={setSearchQuery}
          onStatusChange={setStatusFilter}
          onRefresh={loadOrders}
          onCleanupOrphaned={handleCleanupOrphaned}
          onCleanupAll={handleCleanupAll}
        />

        <AdminOrdersList
          orders={filteredOrders}
          isLoading={isLoading}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          onArchiveClick={(order) => { setArchiveDialogOrder(order); setArchiveReason(''); }}
        />
      </main>

      <AdminOrdersArchiveDialog
        order={archiveDialogOrder}
        reason={archiveReason}
        isArchiving={isArchiving}
        onReasonChange={setArchiveReason}
        onConfirm={handleAdminArchive}
        onCancel={() => { setArchiveDialogOrder(null); setArchiveReason(''); }}
      />

      <Footer />
    </div>
  );
}
