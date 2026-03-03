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

  if (isBuyer && order.status === 'new' && !showCounterForm && !order.counterPricePerUnit && onCounterOffer && !order.isRequest) {
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

  if (!isBuyer && order.status === 'new' && !showCounterForm && !order.counterPricePerUnit && onCounterOffer && !order.isRequest) {
    return (
      <Button 
        onClick={onShowCounterForm} 
        variant="outline" 
        size="sm" 
        className="w-full border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold shadow-sm"
      >
        <Icon name="ArrowLeftRight" className="mr-1.5 h-4 w-4" />
        Предложить встречную цену
      </Button>
    );
  }

  return null;
}