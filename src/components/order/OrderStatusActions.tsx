import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { Order } from '@/types/order';
import { getOrderRoles } from '@/utils/orderRoles';

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
}

export default function OrderStatusActions({ order, isBuyer, contactPerson, onCancelClick, onCompleteOrder, onAcceptOrder, onCancelOrder, onRequestCompletion }: OrderStatusActionsProps) {
  const roles = getOrderRoles(order);
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
            <p className="font-semibold text-red-800">Заказ отменён</p>
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
                  <p className="font-medium mb-1">{roles.seller}: {contactPerson.name}</p>
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

          {order.status === 'pending' && !isBuyer && (
            <div className="space-y-3">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
                <Icon name="UserCheck" className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium mb-1">Покупатель: {contactPerson.name}</p>
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
                  <p className="font-medium mb-1">Исполнитель: {contactPerson.name}</p>
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
                  {order.completionRequested ? (
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
                  )}
                  {onCompleteOrder && (
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
                </div>
              ) : (
                <div className="space-y-3">
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
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}