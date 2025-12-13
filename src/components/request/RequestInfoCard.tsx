import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
  totalAmount: number;
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
  totalAmount
}: RequestInfoCardProps) {
  return (
    <Card className="mb-3">
      <CardContent className="pt-3 pb-3 space-y-3">
        <div>
          <h1 className="text-lg md:text-xl font-bold mb-1.5">{title}</h1>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-xs">{category}</Badge>
            <Badge variant="outline" className="text-xs">{subcategory}</Badge>
          </div>
        </div>

        {/* Основная информация - всегда видна */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Количество</p>
            <p className="font-semibold">{quantity} {unit}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Цена за {unit}</p>
            <p className="font-semibold">{pricePerUnit.toLocaleString('ru-RU')} ₽</p>
          </div>
        </div>

        <div className="bg-primary/5 p-2 rounded-md">
          <p className="text-xs text-muted-foreground mb-0.5">Общий бюджет</p>
          <p className="text-xl font-bold text-primary">
            {totalAmount.toLocaleString('ru-RU')} ₽
          </p>
        </div>

        {/* Дополнительная информация в аккордеоне */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="details" className="border-0">
            <AccordionTrigger className="py-2 text-sm font-medium">
              Подробная информация
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Откликов</p>
                  <p className="font-medium">{responsesCount || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">НДС</p>
                  <p className="font-medium">{hasVAT ? `${vatRate}%` : 'Без НДС'}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-1">Описание запроса</p>
                <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-3">{description}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground mb-0.5">Адрес доставки</p>
                  <p className="font-medium">{deliveryAddress}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Район</p>
                  <p className="font-medium">{district}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Принимаются отклики из районов</p>
                <div className="flex flex-wrap gap-1">
                  {availableDistricts.map((district) => (
                    <Badge key={district} variant="outline" className="text-xs px-1.5 py-0">{district}</Badge>
                  ))}
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
                    <p>Срок актуальности</p>
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