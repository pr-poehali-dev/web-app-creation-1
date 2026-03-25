import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { Order } from '@/types/order';
import { getOrderRoles, isPassengerTransportOrder, isFreightTransportOrder, getTransportDateTime, transportDatePassed as getTransportDatePassed } from '@/utils/orderRoles';

interface OrderStatusActionsProps {
  order: Order;
  isBuyer: boolean;
  contactPerson: {
    name: string;
    phone: string;
    email: string;
  };
  onCancelClick: () => void;
  onCompleteOrder?: (orderId: string) => void;
  onAcceptOrder?: (orderId: string) => void;
  onCancelOrder?: (orderId: string, reason?: string) => void;
  onRequestCompletion?: (orderId: string) => void;
  isPassengerTransport?: boolean;
  isFreightTransport?: boolean;
  onCancelTripClick?: () => void;
}

function RatingBadge({ rating }: { rating?: number }) {
  if (rating == null) return null;
  const r = Math.round(rating);
  const color = r >= 90 ? 'text-green-600' : r >= 70 ? 'text-amber-600' : 'text-red-500';
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${color}`}>
      <Icon name="Star" className="w-3 h-3" />
      {r}%
    </span>
  );
}

export default function OrderStatusActions({ order, isBuyer, contactPerson, onCancelClick, onCompleteOrder, onAcceptOrder, onCancelOrder, onRequestCompletion, isPassengerTransport: isPassengerTransportProp, isFreightTransport: isFreightTransportProp, onCancelTripClick }: OrderStatusActionsProps) {
  const roles = getOrderRoles(order);
  const counterpartRating = isBuyer ? order.sellerRating : order.buyerRating;

  const isPassengerTransport = isPassengerTransportProp || isPassengerTransportOrder(order);
  const isFreightTransport = isFreightTransportProp || isFreightTransportOrder(order);
  const transportDateTime = getTransportDateTime(order);
  const canComplete = getTransportDatePassed(order);

  return (
    <>
      {order.status === 'accepted' && (
        <>
          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon name="User" className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">
                {order.isRequest
                  ? (isBuyer ? 'Заказчик' : 'Исполнитель')
                  : (isBuyer ? roles.seller : roles.buyer)
                }
              </h3>
              <RatingBadge rating={counterpartRating} />
            </div>
            <p className="text-sm font-medium">{contactPerson.name}</p>
            <div className="space-y-1 mt-2">
              <a
                href={`tel:${contactPerson.phone}`}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors flex items-center gap-1.5"
              >
                <Icon name="Phone" className="h-3.5 w-3.5" />
                {contactPerson.phone}
              </a>
              <a
                href={`mailto:${contactPerson.email}`}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors flex items-center gap-1.5"
              >
                <Icon name="Mail" className="h-3.5 w-3.5" />
                {contactPerson.email}
              </a>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <a
                href={`https://api.whatsapp.com/send?phone=${contactPerson.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors"
                title="WhatsApp"
              >
                <Icon name="MessageCircle" className="h-4 w-4" />
              </a>
              <a
                href={`tg://resolve?phone=${contactPerson.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                title="Telegram"
              >
                <Icon name="Send" className="h-4 w-4" />
              </a>
              <a
                href={`https://maks.ru/chat/${contactPerson.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500 hover:bg-purple-600 text-white transition-colors"
                title="Макс"
              >
                <Icon name="MessagesSquare" className="h-4 w-4" />
              </a>
            </div>
          </div>
        </>
      )}

      {order.status === 'completed' && (
        <div className="animate-in fade-in-0 zoom-in-95 duration-300 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <Icon name="CheckCircle" className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-green-800">Заказ завершён</p>
            <p className="text-sm text-green-600">Спасибо за сотрудничество</p>
          </div>
        </div>
      )}

      {order.status === 'cancelled' && (
        <div className="animate-in fade-in-0 zoom-in-95 duration-300 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <Icon name="XCircle" className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-red-800">
              {(() => {
                const cancelledByMe =
                  (isBuyer && order.cancelledBy === 'buyer') ||
                  (!isBuyer && order.cancelledBy === 'seller');
                if (cancelledByMe) return 'Отменено вами';
                if (order.isRequest) {
                  return order.cancelledBy === 'buyer'
                    ? 'Отменено исполнителем'
                    : 'Отменено заказчиком';
                }
                if (isFreightTransport || isPassengerTransport) {
                  return order.cancelledBy === 'seller'
                    ? 'Рейс отменён перевозчиком'
                    : isPassengerTransport
                      ? 'Заказ отменён пассажиром'
                      : 'Заказ отменён заказчиком';
                }
                return order.cancelledBy === 'seller' ? 'Отменено продавцом' : 'Отменено покупателем';
              })()}
            </p>
            {order.cancellationReason && (
              <p className="text-sm text-red-600">{order.cancellationReason}</p>
            )}
          </div>
        </div>
      )}

      {order.status !== 'completed' && order.status !== 'cancelled' && (
        <>
          <Separator />
          {order.status === 'pending' && isBuyer && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <Icon name="Clock" className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">
                    {roles.seller}: {contactPerson.name}
                    {counterpartRating != null && <RatingBadge rating={counterpartRating} />}
                  </p>
                  <p>Заказ ожидает подтверждения {roles.counterSeller}. После принятия статус изменится на "Принят"</p>
                </div>
              </div>
              {onCancelOrder && (
                <Button
                  onClick={onCancelClick}
                  variant="destructive"
                  size="sm"
                  className="w-full"
                >
                  <Icon name="XCircle" className="mr-1.5 h-4 w-4" />
                  Отменить заказ
                </Button>
              )}
            </div>
          )}

          {(order.status === 'pending' || order.status === 'new') && !isBuyer && !order.isRequest && (
            <div className="space-y-3">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
                <Icon name="UserCheck" className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium mb-1 flex items-center gap-1.5">
                    {roles.buyer}: {contactPerson.name}
                    {counterpartRating != null && <RatingBadge rating={counterpartRating} />}
                  </p>
                  <p>Новый заказ ожидает вашего подтверждения</p>
                </div>
              </div>
              {onAcceptOrder && (
                <Button
                  onClick={() => onAcceptOrder(order.id)}
                  variant="default"
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Icon name="Check" className="mr-1.5 h-4 w-4" />
                  Принять заказ
                </Button>
              )}
              {onCancelOrder && (
                <Button
                  onClick={onCancelClick}
                  variant="destructive"
                  size="sm"
                  className="w-full"
                >
                  <Icon name="XCircle" className="mr-1.5 h-4 w-4" />
                  Отменить заказ
                </Button>
              )}
            </div>
          )}

          {order.isRequest && !isBuyer && (order.status === 'new' || order.status === 'pending') && onAcceptOrder && (
            <div className="space-y-3">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
                <Icon name="UserCheck" className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium mb-1">{roles.buyer}: {contactPerson.name}</p>
                  <p>Примите отклик, чтобы увидеть контакты и начать работу</p>
                </div>
              </div>
              <Button
                onClick={() => onAcceptOrder(order.id)}
                variant="default"
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Icon name="Check" className="mr-1.5 h-4 w-4" />
                Принять отклик
              </Button>
            </div>
          )}

          {(order.status === 'new' || order.status === 'negotiating') && onCancelOrder && (
            <Button
              onClick={onCancelClick}
              variant="destructive"
              size="sm"
              className="w-full mt-3"
            >
              <Icon name="XCircle" className="mr-1.5 h-4 w-4" />
              {order.isRequest ? 'Отклонить отклик' : 'Отменить заказ'}
            </Button>
          )}

          {order.status === 'accepted' && (
            <>
              {isBuyer ? (
                <div className="space-y-3">
                  {(isPassengerTransport || isFreightTransport) && !canComplete && transportDateTime && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                      <Icon name="Clock" className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <p className="text-sm text-blue-800 font-medium">
                        Завершить заказ можно после даты выезда:{' '}
                        {new Date(transportDateTime).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                  {!isPassengerTransport && !isFreightTransport && (
                    order.completionRequested ? (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2">
                        <Icon name="Bell" className="h-5 w-5 text-orange-600 flex-shrink-0" />
                        <p className="text-sm text-orange-800 font-medium">
                          Исполнитель запрашивает подтверждение завершения заказа
                        </p>
                      </div>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                        <Icon name="Info" className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <p className="text-sm text-blue-800 font-medium">
                          Можете завершить заказ и оставить отзыв
                        </p>
                      </div>
                    )
                  )}
                  {onCompleteOrder && canComplete && (
                    <Button
                      onClick={() => onCompleteOrder(order.id)}
                      variant="default"
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Icon name="Check" className="mr-1.5 h-4 w-4" />
                      Завершить заказ
                    </Button>
                  )}
                  {onCancelOrder && (
                    <Button
                      onClick={onCancelClick}
                      variant="outline"
                      size="sm"
                      className="w-full border-destructive text-destructive hover:bg-destructive/10"
                    >
                      <Icon name="XCircle" className="mr-1.5 h-4 w-4" />
                      {(isPassengerTransport || isFreightTransport) && !canComplete
                        ? 'Отменить поездку'
                        : 'Отменить заказ'}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {(isPassengerTransport || isFreightTransport) ? (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                        <Icon name="CheckCircle" className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <p className="text-sm text-green-800 font-medium">
                          Рейс в работе
                        </p>
                      </div>
                      {onCancelTripClick && (
                        <Button
                          onClick={onCancelTripClick}
                          variant="destructive"
                          size="sm"
                          className="w-full"
                        >
                          <Icon name="XCircle" className="mr-1.5 h-4 w-4" />
                          Отменить весь рейс
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      {order.completionRequested ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
                          <Icon name="Clock" className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                          <p className="text-sm text-yellow-800 font-medium">
                            Запрос на завершение отправлен — ожидаем подтверждения заказчика
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                            <Icon name="CheckCircle" className="h-5 w-5 text-green-600 flex-shrink-0" />
                            <p className="text-sm text-green-800 font-medium">
                              Заказ в работе
                            </p>
                          </div>
                          {onRequestCompletion && (
                            <Button
                              onClick={() => onRequestCompletion(order.id)}
                              variant="outline"
                              size="sm"
                              className="w-full border-green-500 text-green-700 hover:bg-green-50"
                            >
                              <Icon name="CheckSquare" className="mr-1.5 h-4 w-4" />
                              Запросить завершение заказа
                            </Button>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}