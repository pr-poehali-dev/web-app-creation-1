import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Icon from '@/components/ui/icon';
import { CATEGORIES } from '@/data/categories';
import { useDistrict } from '@/contexts/DistrictContext';

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
  const { districts } = useDistrict();
  
  console.log('🔍 OfferInfoCard - minOrderQuantity:', minOrderQuantity, 'unit:', unit);
  
  // Найти название категории
  const categoryData = CATEGORIES.find(c => c.id === category);
  const categoryName = categoryData?.name || category;
  
  // Найти название района
  const districtData = districts.find(d => d.id === district);
  const districtName = districtData?.name || district;
  
  // Найти названия доступных районов
  const availableDistrictNames = availableDistricts
    .map(id => districts.find(d => d.id === id)?.name || id)
    .filter(Boolean);

  return (
    <Card className="mb-3">
      <CardContent className="pt-3 pb-3 space-y-3">
        <div>
          <h1 className="text-lg md:text-xl font-bold mb-1.5">{title}</h1>
          <div className="flex flex-wrap gap-1.5">
            {categoryName ? (
              <Badge variant="secondary" className="text-xs">{categoryName}</Badge>
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

        {minOrderQuantity && (
          <div className="bg-orange-500/10 border border-orange-500/20 p-2.5 rounded-md">
            <div className="flex items-center gap-2">
              <Icon name="Info" className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-xs font-medium text-orange-900 dark:text-orange-100">
                  Минимальное количество для заказа
                </p>
                <p className="text-sm font-bold text-orange-600">
                  {minOrderQuantity} {unit}
                </p>
              </div>
            </div>
          </div>
        )}

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

              <Separator />

              <div>
                <p className="text-sm font-medium mb-1">Описание</p>
                <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-3">{description}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-2 text-xs">
                {fullAddress && (
                  <div>
                    <p className="text-muted-foreground mb-0.5">Адрес</p>
                    <p className="font-medium">{fullAddress}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground mb-0.5">Район</p>
                  <p className="font-medium">{districtName}</p>
                </div>
              </div>

              {availableDistrictNames.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Доступно в районах</p>
                  <div className="flex flex-wrap gap-1">
                    {availableDistrictNames.map((name, index) => (
                      <Badge key={index} variant="outline" className="text-xs px-1.5 py-0">{name}</Badge>
                    ))}
                  </div>
                </div>
              )}

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