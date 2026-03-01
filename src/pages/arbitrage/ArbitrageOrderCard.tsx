import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { OrderDetail, STATUS_MAP, formatDate, formatMoney } from './types';

interface ArbitrageOrderCardProps {
  order: OrderDetail;
}

export default function ArbitrageOrderCard({ order }: ArbitrageOrderCardProps) {
  const orderNumber = order.order_number || order.orderNumber || order.id?.slice(0, 8);
  const status = order.status || '';
  const statusInfo = STATUS_MAP[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  const pricePerUnit = order.counter_price_per_unit || order.counterPricePerUnit || order.price_per_unit || order.pricePerUnit;
  const totalAmount = order.counter_total_amount || order.counterTotalAmount || order.total_amount || order.totalAmount;
  const buyerName = order.buyer_name || order.buyerName || '—';
  const sellerName = order.seller_name || order.sellerName || '—';

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-xl mb-1">Заказ №{orderNumber}</CardTitle>
            <p className="text-muted-foreground text-sm">{order.title}</p>
          </div>
          <Badge className={`${statusInfo.color} text-sm px-3 py-1`}>{statusInfo.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Покупатель */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2 text-blue-700">
              <Icon name="User" className="w-4 h-4" /> Покупатель
            </h3>
            <div className="bg-blue-50 rounded-lg p-3 space-y-1 text-sm">
              <p className="font-medium">{buyerName}</p>
              {(order.buyer_company || order.buyerCompany) && (
                <p className="text-muted-foreground">{order.buyer_company || order.buyerCompany}</p>
              )}
              {(order.buyer_phone || order.buyerPhone) && (
                <p className="flex items-center gap-1">
                  <Icon name="Phone" className="w-3 h-3" />
                  {order.buyer_phone || order.buyerPhone}
                </p>
              )}
              {(order.buyer_email || order.buyerEmail) && (
                <p className="flex items-center gap-1">
                  <Icon name="Mail" className="w-3 h-3" />
                  {order.buyer_email || order.buyerEmail}
                </p>
              )}
            </div>
          </div>

          {/* Продавец */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2 text-green-700">
              <Icon name="Store" className="w-4 h-4" /> Продавец / Исполнитель
            </h3>
            <div className="bg-green-50 rounded-lg p-3 space-y-1 text-sm">
              <p className="font-medium">{sellerName}</p>
              {(order.seller_phone || order.sellerPhone) && (
                <p className="flex items-center gap-1">
                  <Icon name="Phone" className="w-3 h-3" />
                  {order.seller_phone || order.sellerPhone}
                </p>
              )}
              {(order.seller_email || order.sellerEmail) && (
                <p className="flex items-center gap-1">
                  <Icon name="Mail" className="w-3 h-3" />
                  {order.seller_email || order.sellerEmail}
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Финансовые данные */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Количество</p>
            <p className="font-bold text-lg">{order.quantity} {order.unit}</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Цена за ед.</p>
            <p className="font-bold text-lg text-primary">{formatMoney(pricePerUnit)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
            <p className="text-xs text-muted-foreground mb-1">Итого (принятая цена)</p>
            <p className="font-bold text-lg text-green-700">{formatMoney(totalAmount)}</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Доставка</p>
            <p className="font-bold text-sm">{order.delivery_type === 'pickup' || order.deliveryType === 'pickup' ? 'Самовывоз' : 'Доставка'}</p>
          </div>
        </div>

        {/* Встречная цена если была */}
        {(order.counter_price_per_unit || order.counterPricePerUnit) && (
          <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm font-semibold text-orange-800 mb-1">История торга (встречное предложение)</p>
            <p className="text-sm">Встречная цена: <strong>{formatMoney(order.counter_price_per_unit || order.counterPricePerUnit)}</strong> за ед.</p>
            {(order.counter_offer_message || order.counterOfferMessage) && (
              <p className="text-sm mt-1 text-muted-foreground">«{order.counter_offer_message || order.counterOfferMessage}»</p>
            )}
          </div>
        )}

        {/* Комментарий покупателя */}
        {(order.buyer_comment || order.buyerComment) && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-700 mb-1">Комментарий покупателя</p>
            <p className="text-sm">{order.buyer_comment || order.buyerComment}</p>
          </div>
        )}

        {/* Причина отмены */}
        {(order.cancellation_reason || order.cancellationReason) && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-red-700 mb-1">Причина отмены / отклонения</p>
            <p className="text-sm">{order.cancellation_reason || order.cancellationReason}</p>
          </div>
        )}

        <Separator className="my-4" />
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>Создан: {formatDate(order.created_at || order.createdAt)}</span>
          {(order.updated_at || order.updatedAt) && (
            <span>Обновлён: {formatDate(order.updated_at || order.updatedAt)}</span>
          )}
          {(order.completed_date || order.completedDate) && (
            <span className="text-green-600">Завершён: {formatDate(order.completed_date || order.completedDate)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
