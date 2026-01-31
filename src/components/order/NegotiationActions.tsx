import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { Order } from '@/types/order';

interface NegotiationActionsProps {
  order: Order;
  isBuyer: boolean;
  showCounterForm: boolean;
  onShowCounterForm: () => void;
  onCounterOffer?: (price: number, message: string, quantity?: number) => void;
  onCancelOrder?: () => void;
}

export default function NegotiationActions({
  order,
  isBuyer,
  showCounterForm,
  onShowCounterForm,
  onCounterOffer,
  onCancelOrder,
}: NegotiationActionsProps) {
  // Кнопки действий для покупателя - предложить свою цену (только для новых заказов)
  if (isBuyer && order.status === 'new' && !showCounterForm && !order.counterPricePerUnit && onCounterOffer) {
    return (
      <div className="space-y-2">
        <Button 
          onClick={onShowCounterForm} 
          variant="outline" 
          size="sm" 
          className="w-full border-2 border-primary hover:bg-primary/10 font-semibold shadow-sm"
        >
          <Icon name="MessageSquare" className="mr-1.5 h-4 w-4" />
          Предложить свою цену
        </Button>
        {onCancelOrder && (order.status === 'pending' || order.status === 'new' || order.status === 'negotiating') && (
          <Button 
            onClick={onCancelOrder} 
            variant="destructive" 
            size="sm"
            className="w-full"
          >
            <Icon name="XCircle" className="mr-1.5 h-4 w-4" />
            Отменить заказ
          </Button>
        )}
      </div>
    );
  }

  return null;
}