import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import type { Order } from '@/types/order';

interface EditOfferDeleteDialogProps {
  isOpen: boolean;
  orders: Order[];
  onClose: () => void;
  onConfirm: () => void;
  onDeleteOrder: (orderId: string) => void;
}

export default function EditOfferDeleteDialog({
  isOpen,
  orders,
  onClose,
  onConfirm,
  onDeleteOrder,
}: EditOfferDeleteDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Удалить объявление?</h2>

        {orders.length > 0 ? (
          <div className="space-y-3">
            <p className="text-destructive font-medium text-sm">
              ⚠️ Нельзя удалить при имеющихся активных заказах
            </p>
            <p className="text-sm text-muted-foreground">
              У этого предложения есть {orders.length} {orders.length === 1 ? 'активный заказ' : 'активных заказа(ов)'}. Сначала удалите все заказы:
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {orders.map((order) => (
                <Card key={order.id} className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">Заказ #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {order.buyerName} • {order.totalAmount?.toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDeleteOrder(order.id)}
                    >
                      <Icon name="Trash2" className="w-4 h-4 mr-1" />
                      Удалить
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={onClose}>
              Закрыть
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Это действие нельзя отменить. Объявление будет безвозвратно удалено.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Отмена
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={onConfirm}
              >
                Удалить объявление
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
