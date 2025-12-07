import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';

interface OfferInfoCardProps {
  title: string;
  category: string;
  subcategory: string;
  quantity: number;
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
    <Card className="mb-6">
      <CardContent className="pt-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <div className="flex flex-wrap gap-2">
            {category ? (
              <Badge variant="secondary">{category}</Badge>
            ) : (
              <Badge variant="secondary">Категория не выбрана</Badge>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Количество</p>
              <p className="font-semibold">{quantity} {unit}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Цена за единицу</p>
              <p className="font-semibold">{pricePerUnit.toLocaleString('ru-RU')} ₽</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Осталось</p>
              <p className="font-semibold">{remainingQuantity} {unit}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">НДС</p>
              <p className="font-semibold">
                {hasVAT ? `${vatRate}%` : 'Без НДС'}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Общая стоимость</p>
            <p className="text-2xl font-bold text-primary">
              {totalPrice.toLocaleString('ru-RU')} ₽
            </p>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold mb-2">Описание</h3>
          <p className="text-muted-foreground whitespace-pre-line">{description}</p>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Местоположение</p>
            <p className="font-medium">{location}</p>
            {fullAddress && (
              <p className="text-sm text-muted-foreground">{fullAddress}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Район</p>
            <p className="font-medium">{district}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">Доступно в районах</p>
          <div className="flex flex-wrap gap-2">
            {availableDistricts.map((district) => (
              <Badge key={district} variant="outline">{district}</Badge>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-sm text-muted-foreground mb-2">Способы получения</p>
          <div className="flex gap-3">
            {availableDeliveryTypes.includes('pickup') && (
              <Badge className="gap-1">
                <Icon name="Store" className="h-3 w-3" />
                Самовывоз
              </Badge>
            )}
            {availableDeliveryTypes.includes('delivery') && (
              <Badge className="gap-1">
                <Icon name="Truck" className="h-3 w-3" />
                Доставка
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
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
      </CardContent>
    </Card>
  );
}