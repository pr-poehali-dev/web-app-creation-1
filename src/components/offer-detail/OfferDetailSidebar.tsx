import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import OfferDetailInfoCard from './OfferDetailInfoCard';
import type { Offer } from '@/types/offer';
import { getSession } from '@/utils/auth';

interface OfferDetailSidebarProps {
  offer: Offer;
  remainingQuantity: number;
  totalPrice: number;
  onOrderClick: () => void;
  onShare: () => void;
  navigate: ReturnType<typeof useNavigate>;
}

export default function OfferDetailSidebar({
  offer,
  remainingQuantity,
  totalPrice,
  onOrderClick,
  onShare,
  navigate,
}: OfferDetailSidebarProps) {
  const currentUser = getSession();
  const isOwner = currentUser && currentUser.id?.toString() === offer.userId?.toString();

  console.log('🔍 Проверка владельца:', {
    currentUserId: currentUser?.id,
    offerUserId: offer.userId,
    isOwner,
  });

  return (
    <div className="space-y-1">
      <Card>
        <CardContent className="pt-6 space-y-2.5">
          {isOwner ? (
            <Button
              onClick={() => navigate(`/edit-offer/${offer.id}?tab=info&edit=true`)}
              size="lg"
              className="w-full gap-2"
            >
              <Icon name="Edit" className="h-5 w-5" />
              Редактировать предложение
            </Button>
          ) : (
            <Button
              onClick={onOrderClick}
              size="lg"
              className="w-full gap-2"
            >
              <Icon name="ShoppingCart" className="h-5 w-5" />
              Заказать
            </Button>
          )}
          <Button
            onClick={onShare}
            variant="outline"
            size="lg"
            className="w-full gap-2"
          >
            <Icon name="Share2" className="h-5 w-5" />
            Поделиться
          </Button>
        </CardContent>
      </Card>

      {/* На десктопе показываем информацию под кнопками */}
      <div className="hidden lg:block">
        <OfferDetailInfoCard
          offer={offer}
          remainingQuantity={remainingQuantity}
          totalPrice={totalPrice}
        />
      </div>
    </div>
  );
}
