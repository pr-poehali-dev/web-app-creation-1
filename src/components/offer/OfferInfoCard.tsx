import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Icon from '@/components/ui/icon';

interface OfferInfoCardProps {
  title: string;
  category: string;
  subcategory: string;
  quantity: number;
  minOrderQuantity?: number;
  unit: string;
  pricePerUnit: number;
  remainingQuantity: number;
  hasVAT: boolean;
  vatRate?: number;
  totalPrice: number;
  description: string;
  location: string;
  fullAddress?: string;
  district: string;
  availableDistricts: string[];
  availableDeliveryTypes: ('pickup' | 'delivery')[];
  createdAt: Date;
  expiryDate?: Date;
}

export default function OfferInfoCard({
  title,
  category,
  subcategory,
  quantity,
  minOrderQuantity,
  unit,
  pricePerUnit,
  remainingQuantity,
  hasVAT,
  vatRate,
  totalPrice,
  description,
  location,
  fullAddress,
  district,
  availableDistricts,
  availableDeliveryTypes,
  createdAt,
  expiryDate,
}: OfferInfoCardProps) {
  return (
    <Card className="mb-3">
      <CardContent className="pt-3 pb-3 space-y-3">
        <div>
          <h1 className="text-lg md:text-xl font-bold mb-1.5">{title}</h1>
          <div className="flex flex-wrap gap-1.5">
            {category ? (
              <Badge variant="secondary" className="text-xs">{category}</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Без категории</Badge>
            )}
          </div>
        </div>

        {/* Основная информация - всегда видна */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Общая доступная количество:</p>
            <p className="font-semibold">{quantity} {unit}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Цена за единицу:</p>
            <p className="font-semibold">{pricePerUnit.toLocaleString('ru-RU')} ₽</p>
          </div>
        </div>

        <div className="bg-primary/5 p-2 rounded-md">
          <p className="text-xs text-muted-foreground mb-0.5">Общая стоимость</p>
          <p className="text-xl font-bold text-primary">
            {totalPrice.toLocaleString('ru-RU')} ₽
          </p>
        </div>

        {/* Дополнительная информация в аккордеоне */}
        <Accordion type="single" collapsible defaultValue="details" className="w-full">
          <AccordionItem value="details" className="border-0">
            <AccordionTrigger className="py-2 text-sm font-medium">
              Подробная информация
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Осталось</p>
                  <p className="font-medium">{remainingQuantity} {unit}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">НДС</p>
                  <p className="font-medium">{hasVAT ? `${vatRate}%` : 'Без НДС'}</p>
                </div>
              </div>

              {minOrderQuantity && (
                <div className="bg-accent/50 p-2 rounded-md">
                  <p className="text-xs text-muted-foreground">Минимальный заказ</p>
                  <p className="font-medium text-sm">{minOrderQuantity} {unit}</p>
                </div>
              )}

              <Separator />

              <div>
                <p className="text-sm font-medium mb-1">Описание</p>
                <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-3">{description}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground mb-0.5">Местоположение</p>
                  <p className="font-medium">{location}</p>
                  {fullAddress && (
                    <p className="text-muted-foreground">{fullAddress}</p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Район</p>
                  <p className="font-medium">{district}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Доступно в районах</p>
                <div className="flex flex-wrap gap-1">
                  {availableDistricts.map((district) => (
                    <Badge key={district} variant="outline" className="text-xs px-1.5 py-0">{district}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Способы получения</p>
                <div className="flex gap-2">
                  {availableDeliveryTypes.includes('pickup') && (
                    <Badge className="gap-1 text-xs px-1.5 py-0.5">
                      <Icon name="Store" className="h-3 w-3" />
                      Самовывоз
                    </Badge>
                  )}
                  {availableDeliveryTypes.includes('delivery') && (
                    <Badge className="gap-1 text-xs px-1.5 py-0.5">
                      <Icon name="Truck" className="h-3 w-3" />
                      Доставка
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <p>Дата создания</p>
                  <p className="font-medium text-foreground">
                    {createdAt.toLocaleDateString('ru-RU')}
                  </p>
                </div>
                {expiryDate && (
                  <div>
                    <p>Срок годности</p>
                    <p className="font-medium text-foreground">
                      {expiryDate.toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}