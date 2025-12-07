import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

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

interface OrderStatusHistoryProps {
  order: OrderDetail;
  formatDate: (dateString?: string) => string;
}

export default function OrderStatusHistory({ order, formatDate }: OrderStatusHistoryProps) {
  return (
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
  );
}
