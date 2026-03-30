import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  if (isBuyer && order.isRequest && order.status === 'new' && order.offerId) {
    return (
      <Button 
        onClick={() => navigate(`/request/${order.offerId}?editResponse=true`)}
        variant="outline" 
        size="sm" 
        className="w-full border-2 border-primary hover:bg-primary/10 font-semibold shadow-sm"
      >
        <Icon name="Pencil" className="mr-1.5 h-4 w-4" />
        Редактировать отклик
      </Button>
    );
  }

  const isSeller = !isBuyer;

  if (isSeller && order.isRequest && (order.status === 'new' || order.status === 'pending') && !showCounterForm && !order.counterPricePerUnit && onCounterOffer) {
    return (
      <Button 
        onClick={onShowCounterForm} 
        variant="outline" 
        size="sm" 
        className="w-full border-2 border-primary hover:bg-primary/10 font-semibold shadow-sm"
      >
        <Icon name="MessageSquare" className="mr-1.5 h-4 w-4" />
        Предложить свою цену
      </Button>
    );
  }

  if (isBuyer && order.status === 'new' && !showCounterForm && !order.counterPricePerUnit && onCounterOffer && !order.isRequest && !order.noNegotiation) {
    return (
      <Button 
        onClick={onShowCounterForm} 
        variant="outline" 
        size="sm" 
        className="w-full border-2 border-primary hover:bg-primary/10 font-semibold shadow-sm"
      >
        <Icon name="MessageSquare" className="mr-1.5 h-4 w-4" />
        Предложить свою цену
      </Button>
    );
  }

  if (isBuyer && order.status === 'new' && !order.isRequest && order.noNegotiation) {
    return (
      <div className="border-t pt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Icon name="Lock" size={14} />
        <span>Цена фиксирована, торг не предусмотрен</span>
      </div>
    );
  }

  return null;
}