import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Icon from '@/components/ui/icon';
import type { Seller } from '@/types/offer';

interface OfferSellerCardProps {
  seller: Seller;
}

export default function OfferSellerCard({ seller }: OfferSellerCardProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon name="User" className="h-4 w-4" />
          Продавец
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-2">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <h3 className="font-semibold text-sm">{seller.name}</h3>
            {seller.isVerified && (
              <Badge className="gap-1 bg-green-500 text-xs px-1.5 py-0">
                <Icon name="BadgeCheck" className="h-3 w-3" />
                Верифицирован
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Icon
                  key={i}
                  name="Star"
                  className={`h-3 w-3 ${
                    i < Math.floor(seller.rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {seller.rating} ({seller.reviewsCount})
            </span>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">          
          <div>
            <a
              href={`tel:${seller.phone}`}
              className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
            >
              <Icon name="Phone" className="h-3.5 w-3.5" />
              {seller.phone}
            </a>
          </div>
          
          <div>
            <a
              href={`mailto:${seller.email}`}
              className="text-xs hover:text-primary transition-colors flex items-center gap-1 text-muted-foreground"
            >
              <Icon name="Mail" className="h-3.5 w-3.5" />
              {seller.email}
            </a>
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="details" className="border-0">
            <AccordionTrigger className="py-2 text-xs font-medium">
              Подробнее
            </AccordionTrigger>
            <AccordionContent className="space-y-2 pt-1">
              {seller.responsiblePerson && (
                <div>
                  <p className="text-xs text-muted-foreground">Ответственный</p>
                  <p className="text-sm font-medium">{seller.responsiblePerson.name}</p>
                </div>
              )}

              <Separator />

              <div className="space-y-1.5">
                <p className="text-xs font-medium">Статистика</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Предложений</p>
                    <p className="font-semibold">{seller.statistics.totalOffers}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Активных</p>
                    <p className="font-semibold">{seller.statistics.activeOffers}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Выполнено</p>
                    <p className="font-semibold">{seller.statistics.completedOrders}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">С нами с</p>
                    <p className="font-semibold">
                      {seller.statistics.registrationDate.toLocaleDateString('ru-RU', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button
          variant="outline"
          className="w-full h-8 text-xs"
          onClick={() => navigate(`/seller/${seller.id}`)}
        >
          Профиль продавца
        </Button>
      </CardContent>
    </Card>
  );
}