import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { Seller } from '@/types/offer';

interface OfferSellerCardProps {
  seller: Seller;
}

export default function OfferSellerCard({ seller }: OfferSellerCardProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="User" className="h-5 w-5" />
          Продавец
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg">{seller.name}</h3>
            {seller.isVerified && (
              <Badge className="gap-1 bg-green-500">
                <Icon name="BadgeCheck" className="h-3 w-3" />
                Верифицирован
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Icon
                  key={i}
                  name="Star"
                  className={`h-4 w-4 ${
                    i < Math.floor(seller.rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {seller.rating} ({seller.reviewsCount} отзывов)
            </span>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          {seller.responsiblePerson && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Ответственный</p>
              <p className="font-medium">{seller.responsiblePerson.name}</p>
            </div>
          )}
          
          <div>
            <p className="text-sm text-muted-foreground mb-1">Телефон</p>
            <a
              href={`tel:${seller.phone}`}
              className="font-medium hover:text-primary transition-colors flex items-center gap-1"
            >
              <Icon name="Phone" className="h-4 w-4" />
              {seller.phone}
            </a>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-1">Email</p>
            <a
              href={`mailto:${seller.email}`}
              className="font-medium hover:text-primary transition-colors flex items-center gap-1"
            >
              <Icon name="Mail" className="h-4 w-4" />
              {seller.email}
            </a>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-semibold">Статистика</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Всего предложений</p>
              <p className="font-semibold">{seller.statistics.totalOffers}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Активных</p>
              <p className="font-semibold">{seller.statistics.activeOffers}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Выполнено заказов</p>
              <p className="font-semibold">{seller.statistics.completedOrders}</p>
            </div>
            <div>
              <p className="text-muted-foreground">На платформе с</p>
              <p className="font-semibold">
                {seller.statistics.registrationDate.toLocaleDateString('ru-RU', {
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate(`/seller/${seller.id}`)}
        >
          Перейти к профилю
        </Button>
      </CardContent>
    </Card>
  );
}
