import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CATEGORIES } from '@/data/categories';
import { DISTRICTS } from '@/data/districts';
import { NASLEGS } from '@/data/naslegs';
import OfferInfoHeader from './OfferInfoHeader';
import OfferInfoSummary from './OfferInfoSummary';
import OfferInfoDetails from './OfferInfoDetails';
import type { TransportWaypoint } from '@/types/offer';

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
  transportServiceType?: string;
  transportRoute?: string;
  transportType?: string;
  transportCapacity?: string;
  transportDateTime?: string;
  transportPrice?: string;
  transportPriceType?: string;
  transportNegotiable?: boolean;
  transportComment?: string;
  transportWaypoints?: TransportWaypoint[];
  autoMake?: string;
  autoModel?: string;
  autoYear?: string;
  autoBodyType?: string;
  autoColor?: string;
  autoFuelType?: string;
  autoTransmission?: string;
  autoDriveType?: string;
  autoMileage?: number;
  autoPtsRecords?: string;
  autoDescription?: string;
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
  transportServiceType,
  transportRoute,
  transportType,
  transportCapacity,
  transportDateTime,
  transportPrice,
  transportPriceType,
  transportNegotiable,
  transportComment,
  transportWaypoints,
  autoMake,
  autoModel,
  autoYear,
  autoBodyType,
  autoColor,
  autoFuelType,
  autoTransmission,
  autoDriveType,
  autoMileage,
  autoPtsRecords,
  autoDescription,
}: OfferInfoCardProps) {
  // Найти название категории
  const categoryData = CATEGORIES.find(c => c.id === category);
  const categoryName = categoryData?.name || category;

  // Найти название района
  const districtData = DISTRICTS.find(d => d.id === district);
  const districtName = districtData?.name || district;

  // Найти названия доступных районов
  const availableDistrictNames = availableDistricts
    .map(id => DISTRICTS.find(d => d.id === id)?.name || id)
    .filter(Boolean);

  // Найти административный центр района (settlement)
  const getDistrictCenter = (districtId: string) => {
    const center = NASLEGS.find(n => n.districtId === districtId && n.type === 'settlement');
    return center ? `г. ${center.name}` : '';
  };

  // Извлечь только адрес из location (убрать "г. Город," если есть)
  const getCleanAddress = (loc: string) => {
    return loc
      .replace(/^(г|с|пгт|рп)\.?\s+[А-Яа-яЁё-]+,?\s*/, '')
      .replace(/улица/gi, 'ул.')
      .trim();
  };

  const cityNameRaw = getDistrictCenter(district);
  const cityName = cityNameRaw === districtName ? '' : cityNameRaw;
  const streetAddress = fullAddress || (location ? getCleanAddress(location) : '');

  const detailsProps = {
    category,
    remainingQuantity,
    unit,
    description,
    districtName,
    cityName,
    availableDistrictNames,
    availableDeliveryTypes,
    streetAddress,
    deliveryTime,
    deliveryPeriodStart,
    deliveryPeriodEnd,
    createdAt,
    expiryDate,
    transportCapacity,
    transportDateTime,
    transportServiceType,
    transportWaypoints,
    transportPriceType,
    transportComment,
    transportRoute,
    availableDistricts,
    autoMake,
    autoModel,
    autoYear,
    autoBodyType,
    autoColor,
    autoFuelType,
    autoTransmission,
    autoDriveType,
    autoMileage,
    autoPtsRecords,
    autoDescription,
  };

  return (
    <Card className="mb-1">
      <CardContent className="pt-2 pb-2 space-y-2 md:pt-2.5 md:pb-2.5 md:space-y-2.5">
        <OfferInfoHeader
          title={title}
          categoryName={categoryName}
          sellerRating={sellerRating}
        />

        <OfferInfoSummary
          category={category}
          quantity={quantity}
          minOrderQuantity={minOrderQuantity}
          unit={unit}
          pricePerUnit={pricePerUnit}
          remainingQuantity={remainingQuantity}
          noNegotiation={noNegotiation}
          deadlineStart={deadlineStart}
          deadlineEnd={deadlineEnd}
          negotiableDeadline={negotiableDeadline}
          budget={budget}
          negotiableBudget={negotiableBudget}
          transportServiceType={transportServiceType}
          transportRoute={transportRoute}
          transportType={transportType}
          transportPriceType={transportPriceType}
          transportPrice={transportPrice}
          transportNegotiable={transportNegotiable}
          transportComment={transportComment}
          transportDateTime={transportDateTime}
          transportWaypoints={transportWaypoints}
          expiryDate={expiryDate}
        />

        {/* Дополнительная информация в аккордеоне (мобильные) */}
        <Accordion type="single" collapsible defaultValue="" className="w-full md:!hidden">
          <AccordionItem value="details" className="border-0">
            <AccordionTrigger className="py-2 text-sm font-medium">
              Подробная информация
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <OfferInfoDetails {...detailsProps} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Для десктопа - всегда открыто */}
        <div className="hidden md:block space-y-3">
          <OfferInfoDetails {...detailsProps} />
        </div>
      </CardContent>
    </Card>
  );
}