import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

type OrderStatus = 'new' | 'processing' | 'shipping' | 'completed' | 'cancelled';

interface OrderManagementCardProps {
  newStatus: OrderStatus;
  setNewStatus: (status: OrderStatus) => void;
  trackingNumber: string;
  setTrackingNumber: (value: string) => void;
  sellerComment: string;
  setSellerComment: (value: string) => void;
  cancellationReason: string;
  setCancellationReason: (value: string) => void;
  isUpdating: boolean;
  handleUpdateOrder: () => void;
}

export default function OrderManagementCard({
  newStatus,
  setNewStatus,
  trackingNumber,
  setTrackingNumber,
  sellerComment,
  setSellerComment,
  cancellationReason,
  setCancellationReason,
  isUpdating,
  handleUpdateOrder,
}: OrderManagementCardProps) {
  return (
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
  );
}
