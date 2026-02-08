import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { getSession } from '@/utils/auth';
import { ordersAPI, type Order } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import OrderInfoCard from '@/components/order/OrderInfoCard';
import OrderManagementCard from '@/components/order/OrderManagementCard';
import OrderStatusHistory from '@/components/order/OrderStatusHistory';

interface OrderDetailProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

type OrderStatus = 'new' | 'processing' | 'shipping' | 'completed' | 'cancelled';

interface OrderDetail extends Order {
  order_number?: string;
  buyer_id?: number;
  seller_id?: number;
  offer_id?: string;
  price_per_unit?: number;
  total_amount?: number;
  has_vat?: boolean;
  vat_amount?: number;
  delivery_type?: string;
  delivery_address?: string;
  buyer_name?: string;
  buyer_phone?: string;
  buyer_email?: string;
  buyer_company?: string;
  buyer_inn?: string;
  buyer_comment?: string;
  completed_date?: string;
  cancelled_date?: string;
  tracking_number?: string;
  seller_comment?: string;
  cancellation_reason?: string;
  createdAt?: string;
  updatedAt?: string;
  offer_title?: string;
  offer_district?: string;
  buyer_full_name?: string;
  seller_full_name?: string;
}

export default function OrderDetail({ isAuthenticated, onLogout }: OrderDetailProps) {
  useScrollToTop();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getSession();
  
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [newStatus, setNewStatus] = useState<OrderStatus>('new');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [sellerComment, setSellerComment] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    if (!id) return;
    try {
      const data = await ordersAPI.getOrderById(id);
      setOrder(data);
      setNewStatus(data.status);
      setTrackingNumber(data.tracking_number || '');
      setSellerComment(data.seller_comment || '');
      setCancellationReason(data.cancellation_reason || '');
    } catch (error) {
      console.error('Error loading order:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные заказа',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrder = useCallback(async () => {
    if (!order || !currentUser) return;
    
    setIsUpdating(true);
    try {
      const updateData: any = { status: newStatus };
      
      if (trackingNumber) updateData.trackingNumber = trackingNumber;
      if (sellerComment) updateData.sellerComment = sellerComment;
      if (newStatus === 'cancelled' && cancellationReason) {
        updateData.cancellationReason = cancellationReason;
      }
      
      await ordersAPI.updateOrder(order.id, updateData);
      
      toast({
        title: 'Успешно',
        description: 'Статус заказа обновлен',
      });
      
      loadOrder();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить заказ',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  }, [order, currentUser, newStatus, trackingNumber, sellerComment, cancellationReason, toast]);

  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  }, []);

  if (!currentUser) {
    return null;
  }

  if (!order) {
    return null;
  }

  const isSeller = order.seller_id === parseInt(currentUser.id);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/active-orders')}
          className="mb-6"
        >
          <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
          Назад к заказам
        </Button>

        <div className="grid gap-6">
          <OrderInfoCard 
            order={order} 
            formatDate={formatDate} 
            formatPrice={formatPrice} 
          />

          {isSeller && order.status !== 'completed' && order.status !== 'cancelled' && (
            <OrderManagementCard
              newStatus={newStatus}
              setNewStatus={setNewStatus}
              trackingNumber={trackingNumber}
              setTrackingNumber={setTrackingNumber}
              sellerComment={sellerComment}
              setSellerComment={setSellerComment}
              cancellationReason={cancellationReason}
              setCancellationReason={setCancellationReason}
              isUpdating={isUpdating}
              handleUpdateOrder={handleUpdateOrder}
            />
          )}

          <OrderStatusHistory 
            order={order} 
            formatDate={formatDate} 
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}