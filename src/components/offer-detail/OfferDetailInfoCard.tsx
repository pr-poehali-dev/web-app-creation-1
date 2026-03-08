import OfferInfoCard from '@/components/offer/OfferInfoCard';
import type { Offer } from '@/types/offer';

interface OfferDetailInfoCardProps {
  offer: Offer;
  remainingQuantity: number;
  totalPrice: number;
}

export default function OfferDetailInfoCard({
  offer,
  remainingQuantity,
  totalPrice,
}: OfferDetailInfoCardProps) {
  return (
    <OfferInfoCard
      title={offer.title}
      category={offer.category}
      subcategory={offer.subcategory}
      quantity={offer.quantity}
      minOrderQuantity={offer.minOrderQuantity}
      unit={offer.unit}
      pricePerUnit={offer.pricePerUnit}
      remainingQuantity={remainingQuantity}
      hasVAT={offer.hasVAT}
      vatRate={offer.vatRate}
      totalAmount={totalPrice}
      description={offer.description}
      location={offer.location}
      fullAddress={offer.fullAddress}
      district={offer.district}
      availableDistricts={offer.availableDistricts}
      availableDeliveryTypes={offer.availableDeliveryTypes}
      createdAt={offer.createdAt}
      expiryDate={offer.expiryDate}
      sellerRating={offer.seller?.rating}
      noNegotiation={offer.noNegotiation}
      deliveryTime={offer.deliveryTime}
      deliveryPeriodStart={offer.deliveryPeriodStart}
      deliveryPeriodEnd={offer.deliveryPeriodEnd}
      deadlineStart={offer.deadlineStart}
      deadlineEnd={offer.deadlineEnd}
      negotiableDeadline={offer.negotiableDeadline}
      budget={offer.budget}
      negotiableBudget={offer.negotiableBudget}
      transportServiceType={offer.transportServiceType}
      transportRoute={offer.transportRoute}
      transportType={offer.transportType}
      transportCapacity={offer.transportCapacity}
      transportDateTime={offer.transportDateTime}
      transportPrice={offer.transportPrice}
      transportPriceType={offer.transportPriceType}
      transportNegotiable={offer.transportNegotiable}
      transportComment={offer.transportComment}
      transportWaypoints={offer.transportWaypoints}
      autoMake={offer.autoMake}
      autoModel={offer.autoModel}
      autoYear={offer.autoYear}
      autoBodyType={offer.autoBodyType}
      autoColor={offer.autoColor}
      autoFuelType={offer.autoFuelType}
      autoTransmission={offer.autoTransmission}
      autoDriveType={offer.autoDriveType}
      autoMileage={offer.autoMileage}
      autoPtsRecords={offer.autoPtsRecords}
      autoDescription={offer.autoDescription}
    />
  );
}
