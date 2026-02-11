import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Icon from '@/components/ui/icon';
import { safeToLocaleDateString } from '@/utils/dateUtils';
import type { Request } from '@/types/offer';

interface RequestInfoCardProps {
  request: Request;
}

export default function RequestInfoCard({ request }: RequestInfoCardProps) {
  const {
    title,
    category,
    subcategory,
    quantity,
    unit,
    pricePerUnit,
    hasVAT,
    vatRate,
    description,
    deliveryAddress,
    district,
    availableDistricts,
    createdAt,
    expiryDate,
    responsesCount,
    deadlineStart,
    deadlineEnd,
    negotiableDeadline,
    budget,
    negotiableBudget
  } = request;
  
  const isService = category === 'utilities';
  const totalAmount = pricePerUnit * quantity;
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
        {isService ? (
          <div className="space-y-3">
            {deadlineStart && deadlineEnd && (
              <div>
                <p className="text-xs text-muted-foreground">Срок работы</p>
                <p className="font-semibold text-sm">
                  {new Date(deadlineStart).toLocaleDateString('ru-RU')} - {new Date(deadlineEnd).toLocaleDateString('ru-RU')}
                </p>
              </div>
            )}
            {negotiableDeadline && (
              <div>
                <p className="text-xs text-muted-foreground">Срок работы</p>
                <Badge variant="secondary" className="text-xs">
                  Ваши предложения
                </Badge>
              </div>
            )}
            <div className="bg-primary/5 p-2 rounded-md">
              <p className="text-xs text-muted-foreground mb-0.5">Бюджет</p>
              {budget ? (
                <p className="text-xl font-bold text-primary">
                  {budget.toLocaleString('ru-RU')} ₽
                </p>
              ) : negotiableBudget ? (
                <Badge variant="secondary" className="text-sm">
                  Ваши предложения
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground">Не указан</p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Количество</p>
                <p className="font-semibold">{quantity} {unit}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Цена за {unit}</p>
                <p className="font-semibold">{pricePerUnit?.toLocaleString('ru-RU') || '0'} ₽</p>
              </div>
            </div>

            <div className="bg-primary/5 p-2 rounded-md">
              <p className="text-xs text-muted-foreground mb-0.5">Общий бюджет</p>
              <p className="text-xl font-bold text-primary">
                {totalAmount?.toLocaleString('ru-RU') || '0'} ₽
              </p>
            </div>
          </>
        )}

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
                {deliveryAddress && (
                  <div>
                    <p className="text-muted-foreground mb-0.5">Место предоставления услуги</p>
                    <div className="flex items-center gap-1">
                      <Icon name="MapPin" className="h-3 w-3 text-muted-foreground" />
                      <p className="font-medium">{deliveryAddress}</p>
                    </div>
                  </div>
                )}
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
                    {safeToLocaleDateString(createdAt)}
                  </p>
                </div>
                {expiryDate && (
                  <div>
                    <p>Срок актуальности</p>
                    <p className="font-medium text-foreground">
                      {safeToLocaleDateString(expiryDate)}
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