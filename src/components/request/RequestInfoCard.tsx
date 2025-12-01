import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface RequestInfoCardProps {
  title: string;
  category: string;
  subcategory: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  hasVAT: boolean;
  vatRate?: number;
  responsesCount?: number;
  description: string;
  deliveryAddress: string;
  district: string;
  availableDistricts: string[];
  createdAt: Date;
  expiryDate?: Date;
  totalPrice: number;
}

export default function RequestInfoCard({
  title,
  category,
  subcategory,
  quantity,
  unit,
  pricePerUnit,
  hasVAT,
  vatRate,
  responsesCount,
  description,
  deliveryAddress,
  district,
  availableDistricts,
  createdAt,
  expiryDate,
  totalPrice
}: RequestInfoCardProps) {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{category}</Badge>
            <Badge variant="outline">{subcategory}</Badge>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Требуемое количество</p>
              <p className="font-semibold">{quantity} {unit}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Цена за единицу</p>
              <p className="font-semibold">{pricePerUnit.toLocaleString('ru-RU')} ₽</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Откликов</p>
              <p className="font-semibold">{responsesCount || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">НДС</p>
              <p className="font-semibold">
                {hasVAT ? `${vatRate}%` : 'Без НДС'}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Общий бюджет</p>
            <p className="text-2xl font-bold text-primary">
              {totalPrice.toLocaleString('ru-RU')} ₽
            </p>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold mb-2">Описание запроса</h3>
          <p className="text-muted-foreground whitespace-pre-line">{description}</p>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Адрес доставки</p>
            <p className="font-medium">{deliveryAddress}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Район</p>
            <p className="font-medium">{district}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">Принимаются отклики из районов</p>
          <div className="flex flex-wrap gap-2">
            {availableDistricts.map((district) => (
              <Badge key={district} variant="outline">{district}</Badge>
            ))}
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <p>Дата создания</p>
            <p className="font-medium text-foreground">
              {createdAt.toLocaleDateString('ru-RU')}
            </p>
          </div>
          {expiryDate && (
            <div>
              <p>Срок актуальности</p>
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
