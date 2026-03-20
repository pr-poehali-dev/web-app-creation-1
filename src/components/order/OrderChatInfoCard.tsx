import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import type { Order } from '@/types/order';
import { isPassengerTransportOrder, isFreightTransportOrder, getTransportDateTime, transportDatePassed as getTransportDatePassed } from '@/utils/orderRoles';
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
  onRequestCompletion?: (orderId: string) => void;
  onCancelTrip?: (offerId: string, reason: string) => void;
  onLightboxOpen?: (url: string) => void;
}

export default function OrderChatInfoCard({ order, isBuyer, contactPerson, onCancelOrder, onCompleteOrder, onAcceptOrder, onRequestCompletion, onCancelTrip, onLightboxOpen }: OrderChatInfoCardProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCancelTripDialog, setShowCancelTripDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [tripCancelReason, setTripCancelReason] = useState('');

  const isPassengerTransport = isPassengerTransportOrder(order);
  const isFreightTransport = isFreightTransportOrder(order);
  const isTransportOrder = isPassengerTransport || isFreightTransport;
  const transportDateTime = getTransportDateTime(order);
  const departureNotYet = isTransportOrder && !getTransportDatePassed(order);

  const showRatingWarning = order.status === 'accepted' && (
    (isTransportOrder && departureNotYet) || !isTransportOrder
  );

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

  const handleConfirmCancelTrip = () => {
    if (onCancelTrip && order.offerId) {
      onCancelTrip(order.offerId, tripCancelReason.trim());
    }
    setShowCancelTripDialog(false);
    setTripCancelReason('');
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
          onRequestCompletion={onRequestCompletion}
          isPassengerTransport={isTransportOrder}
          isFreightTransport={isFreightTransport}
          onCancelTripClick={() => setShowCancelTripDialog(true)}
        />

        <OrderFeedbackChat
          orderId={order.id}
          orderStatus={order.status}
          isBuyer={isBuyer}
          isRequest={order.isRequest}
          onLightboxOpen={onLightboxOpen}
        />
      </CardContent>

      {/* Диалог отмены заказа пассажиром */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showRatingWarning ? 'Отмена принятого заказа' : 'Подтверждение отмены заказа'}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3">
                {showRatingWarning && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                    <Icon name="AlertTriangle" className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-800">
                      <p className="font-semibold mb-1">Внимание! Это повлияет на ваш рейтинг</p>
                      <p>
                        {isTransportOrder && departureNotYet
                          ? `Отмена принятого заказа до даты и времени ${isFreightTransport ? 'выполнения рейса' : 'выезда'} приведёт к понижению рейтинга надёжности. Это может негативно повлиять на доверие ${isBuyer ? 'исполнителей' : 'пассажиров'} в будущих заказах.`
                          : 'Отмена принятого заказа приведёт к понижению рейтинга надёжности.'}
                      </p>
                    </div>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Вы уверены, что хотите отменить заказ? Укажите причину (необязательно).
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 py-4">
            <Label htmlFor="cancel-reason">Причина отмены</Label>
            <Textarea
              id="cancel-reason"
              placeholder="Укажите причину отмены заказа..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
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
              {isTransportOrder && isBuyer && order.status === 'accepted'
                ? 'Подтвердить отмену'
                : 'Отменить заказ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог отмены всего рейса исполнителем */}
      <Dialog open={showCancelTripDialog} onOpenChange={setShowCancelTripDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отмена рейса</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <Icon name="AlertTriangle" className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <p className="font-semibold mb-1">Внимание! Отмена принятого заказа приведёт к понижению рейтинга надёжности</p>
                    <p>{isFreightTransport ? 'Все принятые заказчики получат уведомление об отмене рейса.' : 'Все принятые пассажиры получат уведомление об отмене рейса.'}{departureNotYet ? ' Отмена до даты и времени выезда снизит ваш рейтинг надёжности.' : ' Отмена рейса снизит ваш рейтинг надёжности.'}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Укажите причину отмены — {isFreightTransport ? 'заказчики' : 'пассажиры'} увидят её в уведомлении.</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 py-4">
            <Label htmlFor="trip-cancel-reason">Причина отмены рейса <span className="text-destructive">*</span></Label>
            <Textarea
              id="trip-cancel-reason"
              placeholder="Например: техническая неисправность, непогода..."
              value={tripCancelReason}
              onChange={(e) => setTripCancelReason(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelTripDialog(false);
                setTripCancelReason('');
              }}
            >
              Назад
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancelTrip}
              disabled={!tripCancelReason.trim()}
            >
              <Icon name="XCircle" className="mr-1.5 h-4 w-4" />
              Отменить рейс
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}