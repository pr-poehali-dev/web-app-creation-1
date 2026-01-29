import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Icon from '@/components/ui/icon';
import { CATEGORIES } from '@/data/categories';
import { useDistrict } from '@/contexts/DistrictContext';
import { formatDateWithTimezone } from '@/utils/dateUtils';

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
  totalAmount: number;
  description: string;
  location: string;
  fullAddress?: string;
  district: string;
  availableDistricts: string[];
  availableDeliveryTypes: ('pickup' | 'delivery')[];
  createdAt: Date;
  expiryDate?: Date;
  sellerRating?: number;
  noNegotiation?: boolean;
  deliveryTime?: string;
  deliveryPeriodStart?: Date | string;
  deliveryPeriodEnd?: Date | string;
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
  totalAmount,
  description,
  location,
  fullAddress,
  district,
  availableDistricts,
  availableDeliveryTypes,
  createdAt,
  expiryDate,
  sellerRating,
  noNegotiation,
  deliveryTime,
  deliveryPeriodStart,
  deliveryPeriodEnd,
}: OfferInfoCardProps) {
  const { districts } = useDistrict();
  
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

  // Извлечь город из location (более гибкое регулярное выражение)
  const getCityFromLocation = (loc: string) => {
    // Пробуем найти "г. Нюрба", "с. Сунтар", "пгт. Черский" и т.д.
    const cityMatch = loc.match(/(г|с|пгт|рп)\.?\s*([А-Яа-яЁё\-]+)/i);
    if (cityMatch) {
      return `${cityMatch[1]}. ${cityMatch[2]}`;
    }
    return '';
  };

  // Извлечь только адрес без города
  const getAddressWithoutCity = (loc: string) => {
    return loc
      .replace(/(г|с|пгт|рп)\.?\s*[А-Яа-яЁё\-]+,?\s*/i, '')
      .replace(/улица/gi, 'ул.')
      .trim();
  };

  const cityName = location ? getCityFromLocation(location) : '';
  const streetAddress = fullAddress || (location ? getAddressWithoutCity(location) : '');

  return (
    <Card className="mb-3">
      <CardContent className="pt-3 pb-3 space-y-3">
        <div>
          <h1 className="text-lg md:text-xl font-bold mb-1.5">{title}</h1>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {categoryName ? (
              <Badge variant="secondary" className="text-xs">{categoryName}</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Без категории</Badge>
            )}
          </div>
          {sellerRating !== undefined && (
            <div className="flex items-center gap-1.5 text-sm">
              <Icon name="Star" className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{sellerRating.toFixed(1)}</span>
              <span className="text-muted-foreground">— рейтинг продавца</span>
            </div>
          )}
        </div>

        {/* Основная информация - всегда видна */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Доступно сейчас:</p>
            <p className="font-semibold">{remainingQuantity} {unit}</p>
            {remainingQuantity < quantity && (
              <p className="text-xs text-muted-foreground">Всего: {quantity} {unit}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Цена за единицу:</p>
            <div className="flex items-center gap-2">
              <p className="font-semibold">{pricePerUnit.toLocaleString('ru-RU')} ₽</p>
              {noNegotiation && (
                <Badge variant="secondary" className="text-[10px] h-5">
                  Без торга
                </Badge>
              )}
            </div>
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

        {/* Дополнительная информация в аккордеоне */}
        <Accordion type="single" collapsible defaultValue="" className="w-full md:!hidden">
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

              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Район</p>
                <p className="text-sm font-medium">{districtName}</p>
                {cityName && (
                  <p className="text-xs text-muted-foreground mt-0.5">{cityName}</p>
                )}
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

              {availableDeliveryTypes.includes('pickup') && streetAddress && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Место самовывоза</p>
                  <div className="flex items-center gap-1.5">
                    <Icon name="MapPin" className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-sm font-medium">{streetAddress}</p>
                  </div>
                </div>
              )}

              {deliveryTime && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Срок доставки/поставки</p>
                  <p className="text-sm font-medium">{deliveryTime}</p>
                </div>
              )}

              {(deliveryPeriodStart || deliveryPeriodEnd) && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Период поставки</p>
                  <p className="text-sm font-medium">
                    {deliveryPeriodStart && formatDateWithTimezone(deliveryPeriodStart)}
                    {deliveryPeriodStart && deliveryPeriodEnd && ' — '}
                    {deliveryPeriodEnd && formatDateWithTimezone(deliveryPeriodEnd)}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <p>Дата создания</p>
                  <p className="font-medium text-foreground">
                    {formatDateWithTimezone(createdAt)}
                  </p>
                </div>
                {expiryDate && (
                  <div>
                    <p>Срок годности</p>
                    <p className="font-medium text-foreground">
                      {formatDateWithTimezone(expiryDate)}
                    </p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Для десктопа - всегда открыто */}
        <div className="hidden md:block space-y-3">
          <p className="text-sm font-medium">Подробная информация</p>
          
          <div className="space-y-3">
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

            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Район</p>
              <p className="text-sm font-medium">{districtName}</p>
              {cityName && (
                <p className="text-xs text-muted-foreground mt-0.5">{cityName}</p>
              )}
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

            {availableDeliveryTypes.includes('pickup') && streetAddress && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Место самовывоза</p>
                <div className="flex items-center gap-1.5">
                  <Icon name="MapPin" className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm font-medium">{streetAddress}</p>
                </div>
              </div>
            )}

            {deliveryTime && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Срок доставки/поставки</p>
                <p className="text-sm font-medium">{deliveryTime}</p>
              </div>
            )}

            {(deliveryPeriodStart || deliveryPeriodEnd) && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Период поставки</p>
                <p className="text-sm font-medium">
                  {deliveryPeriodStart && formatDateWithTimezone(deliveryPeriodStart)}
                  {deliveryPeriodStart && deliveryPeriodEnd && ' — '}
                  {deliveryPeriodEnd && formatDateWithTimezone(deliveryPeriodEnd)}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <p>Дата создания</p>
                <p className="font-medium text-foreground">
                  {formatDateWithTimezone(createdAt)}
                </p>
              </div>
              {expiryDate && (
                <div>
                  <p>Срок годности</p>
                  <p className="font-medium text-foreground">
                    {formatDateWithTimezone(expiryDate)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}