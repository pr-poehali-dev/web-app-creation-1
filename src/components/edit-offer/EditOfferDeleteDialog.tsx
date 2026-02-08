import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить объявление?</AlertDialogTitle>
          <AlertDialogDescription>
            {orders.length > 0 ? (
              <div className="space-y-4">
                <p className="text-destructive font-medium">
                  ⚠️ У этого объявления есть активные заказы ({orders.length})
                </p>
                <p>
                  Сначала удалите все заказы, чтобы иметь возможность удалить объявление:
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {orders.map((order) => (
                    <Card key={order.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">Заказ #{order.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">
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
              </div>
            ) : (
              <p>
                Это действие нельзя отменить. Объявление будет безвозвратно удалено.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          {orders.length === 0 && (
            <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
              Удалить объявление
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
