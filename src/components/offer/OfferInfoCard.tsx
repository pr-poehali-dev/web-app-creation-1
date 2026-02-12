import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Icon from '@/components/ui/icon';
import { CATEGORIES } from '@/data/categories';
import { useDistrict } from '@/contexts/DistrictContext';
import { formatDateWithTimezone } from '@/utils/dateUtils';
import { NASLEGS } from '@/data/naslegs';

interface OfferInfoCardProps {
  title: string;
  category: string;
  subcategory: string;
  quantity: number;
  minOrderQuantity?: number;
  unit: string;
  pricePerUnit: number;
  remainingQuantity: number;
  hasVAT?: boolean;
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
  deadlineStart?: string;
  deadlineEnd?: string;
  negotiableDeadline?: boolean;
  budget?: number;
  negotiableBudget?: boolean;
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
  deadlineStart,
  deadlineEnd,
  negotiableDeadline,
  budget,
  negotiableBudget,
}: OfferInfoCardProps) {
  const isService = category === 'utilities';
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

  // Найти административный центр района (settlement)
  const getDistrictCenter = (districtId: string) => {
    const center = NASLEGS.find(n => n.districtId === districtId && n.type === 'settlement');
    if (center) {
      return `г. ${center.name}`;
    }
    return '';
  };

  // Извлечь только адрес из location (убрать "г. Город," если есть)
  const getCleanAddress = (loc: string) => {
    return loc
      .replace(/^(г|с|пгт|рп)\.?\s+[А-Яа-яЁё-]+,?\s*/, '')
      .replace(/улица/gi, 'ул.')
      .trim();
  };

  const cityName = getDistrictCenter(district);
  const streetAddress = fullAddress || (location ? getCleanAddress(location) : '');

  return (
    <Card className="mb-3">
      <CardContent className="pt-3 pb-3 space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h1 className="text-lg md:text-xl font-bold flex-1">{title}</h1>
            {categoryName ? (
              <Badge variant="secondary" className="text-xs flex-shrink-0">{categoryName}</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs flex-shrink-0">Без категории</Badge>
            )}
          </div>
          {sellerRating !== undefined && (
            <button
              onClick={() => {
                const reviewsSection = document.getElementById('seller-reviews');
                if (reviewsSection) {
                  reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity cursor-pointer group"
            >
              <Icon name="Star" className="h-4 w-4 fill-yellow-400 text-yellow-400 group-hover:scale-110 transition-transform" />
              <span className="font-semibold group-hover:underline">{sellerRating.toFixed(1)}</span>
              <span className="text-muted-foreground group-hover:underline">— рейтинг продавца</span>
            </button>
          )}
        </div>

        {/* Основная информация - всегда видна */}
        {isService ? (
          <div className="space-y-3">
            {deadlineStart && deadlineEnd && (
              <div>
                <p className="text-xs text-muted-foreground">Срок работы:</p>
                <p className="font-semibold text-sm">
                  {new Date(deadlineStart).toLocaleDateString('ru-RU')} - {new Date(deadlineEnd).toLocaleDateString('ru-RU')}
                </p>
              </div>
            )}
            {negotiableDeadline && (
              <div>
                <p className="text-xs text-muted-foreground">Срок работы:</p>
                <Badge variant="secondary" className="text-xs">
                  Ваши предложения
                </Badge>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Бюджет:</p>
              <div className="flex items-center gap-2">
                {budget ? (
                  <p className="font-semibold text-lg">{budget.toLocaleString('ru-RU')} ₽</p>
                ) : negotiableBudget ? (
                  <Badge variant="secondary" className="text-xs">
                    Ваши предложения
                  </Badge>
                ) : (
                  <p className="text-sm text-muted-foreground">Не указан</p>
                )}
              </div>
            </div>
          </div>
        ) : (
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
        )}

        {minOrderQuantity && (
          <div className="bg-orange-500/10 border border-orange-500/20 px-2.5 py-1.5 rounded-md">
            <div className="flex items-center gap-1.5">
              <Icon name="Info" className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" />
              <span className="text-xs text-orange-900 dark:text-orange-100">
                Мин. заказ: <span className="font-bold">{minOrderQuantity} {unit}</span>
              </span>
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