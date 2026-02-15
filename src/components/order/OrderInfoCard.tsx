import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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

interface OrderInfoCardProps {
  order: OrderDetail;
  formatDate: (dateString?: string) => string;
  formatPrice: (price: number) => string;
}

export default function OrderInfoCard({ order, formatDate, formatPrice }: OrderInfoCardProps) {
  return (
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
  );
}