import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Icon from '@/components/ui/icon';
import { safeToLocaleDateString } from '@/utils/dateUtils';
import type { Request as RequestType } from '@/pages/RequestDetail/useRequestData';
import { DISTRICTS } from '@/data/districts';
import { CATEGORIES } from '@/data/categories';

interface RequestInfoCardProps {
  request: RequestType;
}

export default function RequestInfoCard({ request }: RequestInfoCardProps) {
  const {
    title,
    category,
    subcategory,
    quantity,
    unit,
    pricePerUnit,
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
    negotiableBudget,
    transportServiceType,
    transportRoute,
    transportType,
    transportCapacity,
    transportDateTime,
    transportPrice,
    transportPriceType,
    transportNegotiable,
    transportComment,
    author
  } = request;
  
  const isTransport = category === 'transport';
  const isService = category === 'utilities';

  const PRICE_TYPE_LABELS: Record<string, string> = {
    'За рейс': 'За рейс',
    'За час': 'За час',
    'За км': 'За км',
    'За тонну': 'За тонну',
    'Договорная': 'Договорная',
  };
  const totalAmount = pricePerUnit * quantity;
  
  const categoryName = CATEGORIES.find(c => c.id === category)?.name || category;
  const subcategoryName = CATEGORIES.find(c => c.id === category)?.subcategories.find(s => s.id === subcategory)?.name || subcategory;

  return (
    <Card className="mb-3">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
            <Icon name="ShoppingBag" className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <h1 className="text-lg md:text-xl font-bold line-clamp-2">{title}</h1>
              {author?.name && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                  <Icon name="User" className="w-3.5 h-3.5" />
                  {author.name}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-xs">{categoryName}</Badge>
              {subcategoryName && <Badge variant="outline" className="text-xs">{subcategoryName}</Badge>}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Основная информация - всегда видна */}
        {isTransport ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {transportServiceType && (
                <div>
                  <p className="text-xs text-muted-foreground">Тип услуги</p>
                  <p className="font-semibold">{transportServiceType}</p>
                </div>
              )}
              {transportType && (
                <div>
                  <p className="text-xs text-muted-foreground">Транспорт</p>
                  <p className="font-semibold">{transportType}</p>
                </div>
              )}
              {transportRoute && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Маршрут</p>
                  <p className="font-semibold">{transportRoute}</p>
                </div>
              )}
              {transportCapacity && (
                <div>
                  <p className="text-xs text-muted-foreground">Вместимость</p>
                  <p className="font-semibold">{transportCapacity}</p>
                </div>
              )}
              {transportDateTime && (
                <div>
                  <p className="text-xs text-muted-foreground">Дата и время</p>
                  <p className="font-semibold">
                    {new Date(transportDateTime).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              )}
            </div>
            <div className="bg-primary/5 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-0.5">Стоимость</p>
              {transportNegotiable ? (
                <Badge variant="secondary" className="text-sm">Ваша цена (Торг)</Badge>
              ) : transportPrice ? (
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {Number(transportPrice).toLocaleString('ru-RU')} ₽
                  </p>
                  {transportPriceType && (
                    <p className="text-xs text-muted-foreground">{PRICE_TYPE_LABELS[transportPriceType] || transportPriceType}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Не указана</p>
              )}
            </div>
          </div>
        ) : isService ? (
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
            <div className="bg-primary/5 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-0.5">Бюджет</p>
              {budget ? (
                <p className="text-2xl font-bold text-primary">
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

            <div className="bg-primary/5 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-0.5">Общий бюджет</p>
              <p className="text-2xl font-bold text-primary">
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
              <div>
                <p className="text-xs text-muted-foreground">Откликов</p>
                <p className="font-medium">{responsesCount || 0}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-1">Описание запроса</p>
                <p className="text-xs text-muted-foreground whitespace-pre-line">{description}</p>
              </div>

              {transportComment && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-1">Комментарий</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-line">{transportComment}</p>
                  </div>
                </>
              )}

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
                  <p className="font-medium">{DISTRICTS.find(d => d.id === district)?.name || district}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Принимаются отклики из районов</p>
                <div className="flex flex-wrap gap-1">
                  {availableDistricts.map((districtId) => {
                    const districtName = DISTRICTS.find(d => d.id === districtId)?.name || districtId;
                    return (
                      <Badge key={districtId} variant="outline" className="text-xs px-1.5 py-0">{districtName}</Badge>
                    );
                  })}
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