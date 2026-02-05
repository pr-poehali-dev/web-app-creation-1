import OrderNegotiationModal from '@/components/order/OrderNegotiationModal';
import { ordersAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { Order } from '@/types/order';
import { notifyOrderUpdated } from '@/utils/dataSync';

interface EditOfferOrderModalProps {
  selectedOrder: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onDataReload: () => void;
}

export default function EditOfferOrderModal({
  selectedOrder,
  isOpen,
  onClose,
  onDataReload,
}: EditOfferOrderModalProps) {
  const { toast } = useToast();

  if (!selectedOrder) return null;

  return (
    <OrderNegotiationModal
      isOpen={isOpen}
      onClose={onClose}
      order={selectedOrder}
      onCounterOffer={async (price, message) => {
        try {
          await ordersAPI.updateOrder(selectedOrder.id, { 
            counterPrice: price,
            counterMessage: message 
          });
          
          // Ждём 500мс чтобы backend точно обновил данные перед синхронизацией
          await new Promise(resolve => setTimeout(resolve, 500));
          
          notifyOrderUpdated(selectedOrder.id);
          toast({
            title: 'Встречное предложение отправлено',
            description: 'Покупатель получит уведомление',
          });
          onDataReload();
        } catch (error) {
          toast({
            title: 'Ошибка',
            description: 'Не удалось отправить встречное предложение',
            variant: 'destructive',
          });
        }
      }}
      onAcceptCounter={async () => {
        try {
          await ordersAPI.updateOrder(selectedOrder.id, { 
            acceptCounter: true,
            status: 'accepted'
          });
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          notifyOrderUpdated(selectedOrder.id);
          toast({
            title: 'Встречное предложение принято',
            description: 'Заказ переведён в статус "Принято"',
          });
          onDataReload();
        } catch (error) {
          toast({
            title: 'Ошибка',
            description: 'Не удалось принять встречное предложение',
            variant: 'destructive',
          });
        }
      }}
      onCancelOrder={async () => {
        try {
          await ordersAPI.updateOrder(selectedOrder.id, { status: 'cancelled' });
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          notifyOrderUpdated(selectedOrder.id);
          toast({
            title: 'Заказ отменён',
            description: 'Заказ успешно отменён',
          });
          onClose();
          onDataReload();
        } catch (error) {
          toast({
            title: 'Ошибка',
            description: 'Не удалось отменить заказ',
            variant: 'destructive',
          });
        }
      }}
      onCompleteOrder={async () => {
        try {
          await ordersAPI.updateOrder(selectedOrder.id, { status: 'completed' });
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          notifyOrderUpdated(selectedOrder.id);
          toast({
            title: 'Заказ завершён',
            description: 'Заказ успешно завершён',
          });
          onClose();
          onDataReload();
        } catch (error) {
          toast({
            title: 'Ошибка',
            description: 'Не удалось завершить заказ',
            variant: 'destructive',
          });
        }
      }}
    />
  );
}