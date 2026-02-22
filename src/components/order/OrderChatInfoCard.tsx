import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import type { Order } from '@/types/order';
import OrderInfoDetails from './OrderInfoDetails';
import OrderStatusActions from './OrderStatusActions';
import OrderFeedbackChat from './OrderFeedbackChat';

interface OrderChatInfoCardProps {
  order: Order;
  isBuyer: boolean;
  contactPerson: {
    name: string;
    phone: string;
    email: string;
  };
  onCancelOrder?: (orderId: string, reason?: string) => void;
  onCompleteOrder?: (orderId: string) => void;
  onAcceptOrder?: (orderId: string) => void;
  onLightboxOpen?: (url: string) => void;
}

export default function OrderChatInfoCard({ order, isBuyer, contactPerson, onCancelOrder, onCompleteOrder, onAcceptOrder, onLightboxOpen }: OrderChatInfoCardProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = () => {
    if (onCancelOrder) {
      onCancelOrder(order.id, cancelReason.trim());
    }
    setShowCancelDialog(false);
    setCancelReason('');
  };

  return (
    <Card className="bg-muted/50">
      <CardContent className="pt-4 space-y-2">
        <OrderInfoDetails order={order} isBuyer={isBuyer} />

        <OrderStatusActions
          order={order}
          isBuyer={isBuyer}
          contactPerson={contactPerson}
          onCancelClick={handleCancelClick}
          onCompleteOrder={onCompleteOrder}
          onAcceptOrder={onAcceptOrder}
          onCancelOrder={onCancelOrder}
        />

        <OrderFeedbackChat
          orderId={order.id}
          orderStatus={order.status}
          isBuyer={isBuyer}
          isRequest={order.isRequest}
          onLightboxOpen={onLightboxOpen}
        />
      </CardContent>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение отмены заказа</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите отменить этот заказ? Укажите причину отмены (необязательно).
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 py-4">
            <Label htmlFor="cancel-reason">Причина отмены</Label>
            <Textarea
              id="cancel-reason"
              placeholder="Укажите причину отмены заказа..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setCancelReason('');
              }}
            >
              Назад
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
            >
              <Icon name="XCircle" className="mr-1.5 h-4 w-4" />
              Отменить заказ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}