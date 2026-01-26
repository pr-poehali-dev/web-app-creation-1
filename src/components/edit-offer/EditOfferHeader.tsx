import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';
import type { Offer } from '@/types/offer';

interface EditOfferHeaderProps {
  offer: Offer;
  ordersCount: number;
  messagesCount: number;
  onDelete: () => void;
}

export default function EditOfferHeader({
  offer,
  ordersCount,
  messagesCount,
  onDelete,
}: EditOfferHeaderProps) {
  const navigate = useNavigate();
  const remainingQuantity = offer.quantity - (offer.soldQuantity || 0) - (offer.reservedQuantity || 0);

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <Icon name="ArrowLeft" className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold mb-2">{offer.title}</h1>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Icon name="Package" className="w-4 h-4" />
                  {remainingQuantity} {offer.unit} доступно
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="DollarSign" className="w-4 h-4" />
                  {offer.pricePerUnit.toLocaleString('ru-RU')} ₽/{offer.unit}
                </span>
              </div>
            </div>
          </div>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Icon name="Trash2" className="w-4 h-4 mr-1" />
            Удалить
          </Button>
        </div>

        <div className="flex gap-4">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Icon name="ShoppingCart" className="w-3 h-3" />
            {ordersCount} {ordersCount === 1 ? 'заказ' : ordersCount < 5 ? 'заказа' : 'заказов'}
          </Badge>
          {messagesCount > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Icon name="MessageSquare" className="w-3 h-3" />
              {messagesCount} {messagesCount === 1 ? 'сообщение' : messagesCount < 5 ? 'сообщения' : 'сообщений'}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}