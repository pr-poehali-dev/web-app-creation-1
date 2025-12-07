import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { getSession } from '@/utils/auth';
import { ordersAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface OrderDetailProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

type OrderStatus = 'new' | 'processing' | 'shipping' | 'completed' | 'cancelled';

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Новый',
  processing: 'В обработке',
  shipping: 'Доставляется',
  completed: 'Завершен',
  cancelled: 'Отменен',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  new: 'bg-blue-500',
  processing: 'bg-orange-500',
  shipping: 'bg-purple-500',
  completed: 'bg-green-500',
  cancelled: 'bg-gray-500',
};

const STATUS_ICONS: Record<OrderStatus, string> = {
  new: 'FileText',
  processing: 'Clock',
  shipping: 'Truck',
  completed: 'CheckCircle2',
  cancelled: 'XCircle',
};

interface OrderDetail {
  id: string;
  order_number: string;
  buyer_id: number;
  seller_id: number;
  offer_id: string;
  title: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  total_amount: number;
  has_vat: boolean;
  vat_amount?: number;
  delivery_type: string;
  delivery_address?: string;
  district: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_email?: string;
  buyer_company?: string;
  buyer_inn?: string;
  buyer_comment?: string;
  status: OrderStatus;
  orderDate: string;
  deliveryDate?: string;
  completed_date?: string;
  cancelled_date?: string;
  tracking_number?: string;
  seller_comment?: string;
  cancellation_reason?: string;
  createdAt: string;
  updatedAt: string;
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
  }, [id, currentUser]);

  const loadOrder = async () => {
    if (!id) return;
    
    setIsLoading(true);
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

  const handleUpdateOrder = async () => {
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
  };

  if (!currentUser) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <Icon name="Loader2" className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-8 text-center">
              <Icon name="AlertCircle" className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Заказ не найден</p>
              <Button onClick={() => navigate('/active-orders')} className="mt-4">
                К списку заказов
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const isSeller = order.seller_id === parseInt(currentUser.id);
  const isBuyer = order.buyer_id === parseInt(currentUser.id);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Заказ {order.order_number}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Создан {formatDate(order.orderDate)}
                  </p>
                </div>
                <Badge className={`${STATUS_COLORS[order.status]} text-white`}>
                  {STATUS_LABELS[order.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Icon name="Package" className="w-5 h-5 mr-2" />
                    Информация о товаре
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Название:</span>
                      <span className="font-medium">{order.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Количество:</span>
                      <span className="font-medium">{order.quantity} {order.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Цена за единицу:</span>
                      <span className="font-medium">{formatPrice(order.price_per_unit)} ₽</span>
                    </div>
                    {order.has_vat && order.vat_amount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">НДС:</span>
                        <span className="font-medium">{formatPrice(order.vat_amount)} ₽</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Итого:</span>
                      <span className="font-bold text-primary">{formatPrice(order.total_amount)} ₽</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Icon name="Truck" className="w-5 h-5 mr-2" />
                    Доставка
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Тип:</span>
                      <span className="font-medium">
                        {order.delivery_type === 'pickup' ? 'Самовывоз' : 'Доставка'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Район:</span>
                      <span className="font-medium">{order.district}</span>
                    </div>
                    {order.delivery_address && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Адрес:</span>
                        <span className="font-medium text-right">{order.delivery_address}</span>
                      </div>
                    )}
                    {order.tracking_number && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Трек-номер:</span>
                        <span className="font-medium">{order.tracking_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Icon name="User" className="w-5 h-5 mr-2" />
                    Покупатель
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Имя:</span>
                      <span className="font-medium">{order.buyer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Телефон:</span>
                      <span className="font-medium">{order.buyer_phone}</span>
                    </div>
                    {order.buyer_email && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{order.buyer_email}</span>
                      </div>
                    )}
                    {order.buyer_company && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Компания:</span>
                        <span className="font-medium">{order.buyer_company}</span>
                      </div>
                    )}
                    {order.buyer_inn && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">ИНН:</span>
                        <span className="font-medium">{order.buyer_inn}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Icon name="Store" className="w-5 h-5 mr-2" />
                    Продавец
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Имя:</span>
                      <span className="font-medium">{order.seller_full_name || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {order.buyer_comment && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center">
                      <Icon name="MessageSquare" className="w-5 h-5 mr-2" />
                      Комментарий покупателя
                    </h3>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {order.buyer_comment}
                    </p>
                  </div>
                </>
              )}

              {order.seller_comment && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center">
                      <Icon name="MessageSquare" className="w-5 h-5 mr-2" />
                      Комментарий продавца
                    </h3>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {order.seller_comment}
                    </p>
                  </div>
                </>
              )}

              {order.cancellation_reason && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center text-red-600">
                      <Icon name="AlertCircle" className="w-5 h-5 mr-2" />
                      Причина отмены
                    </h3>
                    <p className="text-sm text-gray-700 bg-red-50 p-3 rounded-lg border border-red-200">
                      {order.cancellation_reason}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {isSeller && order.status !== 'completed' && order.status !== 'cancelled' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Icon name="Settings" className="w-5 h-5 mr-2" />
                  Управление заказом
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Статус заказа</Label>
                  <Select value={newStatus} onValueChange={(value) => setNewStatus(value as OrderStatus)}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Новый</SelectItem>
                      <SelectItem value="processing">В обработке</SelectItem>
                      <SelectItem value="shipping">Доставляется</SelectItem>
                      <SelectItem value="completed">Завершен</SelectItem>
                      <SelectItem value="cancelled">Отменен</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(newStatus === 'shipping' || newStatus === 'completed') && (
                  <div>
                    <Label htmlFor="tracking">Трек-номер</Label>
                    <Input
                      id="tracking"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Введите трек-номер"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="seller-comment">Комментарий продавца</Label>
                  <Textarea
                    id="seller-comment"
                    value={sellerComment}
                    onChange={(e) => setSellerComment(e.target.value)}
                    placeholder="Дополнительная информация для покупателя"
                    rows={3}
                  />
                </div>

                {newStatus === 'cancelled' && (
                  <div>
                    <Label htmlFor="cancellation-reason">Причина отмены</Label>
                    <Textarea
                      id="cancellation-reason"
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      placeholder="Укажите причину отмены заказа"
                      rows={3}
                    />
                  </div>
                )}

                <Button
                  onClick={handleUpdateOrder}
                  disabled={isUpdating}
                  className="w-full"
                >
                  {isUpdating ? (
                    <>
                      <Icon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Icon name="Save" className="w-4 h-4 mr-2" />
                      Сохранить изменения
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Icon name="Clock" className="w-5 h-5 mr-2" />
                История статусов
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.orderDate && (
                  <div className="flex items-start gap-4">
                    <div className={`${STATUS_COLORS['new']} w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0`}>
                      <Icon name={STATUS_ICONS['new']} className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{STATUS_LABELS['new']}</p>
                      <p className="text-sm text-gray-500">{formatDate(order.orderDate)}</p>
                    </div>
                  </div>
                )}

                {(order.status === 'processing' || order.status === 'shipping' || order.status === 'completed') && (
                  <div className="flex items-start gap-4">
                    <div className={`${STATUS_COLORS['processing']} w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0`}>
                      <Icon name={STATUS_ICONS['processing']} className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{STATUS_LABELS['processing']}</p>
                      <p className="text-sm text-gray-500">{formatDate(order.updatedAt)}</p>
                    </div>
                  </div>
                )}

                {(order.status === 'shipping' || order.status === 'completed') && (
                  <div className="flex items-start gap-4">
                    <div className={`${STATUS_COLORS['shipping']} w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0`}>
                      <Icon name={STATUS_ICONS['shipping']} className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{STATUS_LABELS['shipping']}</p>
                      <p className="text-sm text-gray-500">{formatDate(order.updatedAt)}</p>
                      {order.tracking_number && (
                        <p className="text-sm text-gray-600 mt-1">Трек-номер: {order.tracking_number}</p>
                      )}
                    </div>
                  </div>
                )}

                {order.status === 'completed' && (
                  <div className="flex items-start gap-4">
                    <div className={`${STATUS_COLORS['completed']} w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0`}>
                      <Icon name={STATUS_ICONS['completed']} className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{STATUS_LABELS['completed']}</p>
                      <p className="text-sm text-gray-500">{formatDate(order.completed_date || order.updatedAt)}</p>
                    </div>
                  </div>
                )}

                {order.status === 'cancelled' && (
                  <div className="flex items-start gap-4">
                    <div className={`${STATUS_COLORS['cancelled']} w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0`}>
                      <Icon name={STATUS_ICONS['cancelled']} className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{STATUS_LABELS['cancelled']}</p>
                      <p className="text-sm text-gray-500">{formatDate(order.cancelled_date || order.updatedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
