import { Card, CardContent } from '@/components/ui/card';
import OfferBasicInfoSection from '@/components/offer/OfferBasicInfoSection';
import OfferPricingSection from '@/components/offer/OfferPricingSection';
import OfferLocationSection from '@/components/offer/OfferLocationSection';
import OfferMediaSection from '@/components/offer/OfferMediaSection';
import OfferTransportSection from '@/components/offer/OfferTransportSection';
import OfferAdditionalSection from '@/components/offer/OfferAdditionalSection';
import type { DeliveryType } from '@/types/offer';

interface District {
  id: string;
  name: string;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  quantity: string;
  minOrderQuantity: string;
  unit: string;
  pricePerUnit: string;
  deadline: string;
  negotiableDeadline: boolean;
  budget: string;
  negotiableBudget: boolean;
  district: string;
  fullAddress: string;
  gpsCoordinates: string;
  availableDistricts: string[];
  availableDeliveryTypes: DeliveryType[];
  expiryDate: string;
  noNegotiation: boolean;
  deliveryTime: string;
  deliveryPeriodStart: string;
  deliveryPeriodEnd: string;
  publicationDuration: string;
  publicationStartDate: string;
  transportServiceType: string;
  transportRoute: string;
  transportType: string;
  transportCapacity: string;
  transportDateTime: string;
  transportPrice: string;
  transportPriceType: string;
  transportNegotiable: boolean;
  transportComment: string;
}

interface CreateOfferFormFieldsProps {
  formData: FormData;
  images: File[];
  imagePreviews: string[];
  video: File | null;
  videoPreview: string;
  districts: District[];
  onInputChange: (field: string, value: string | boolean) => void;
  onDistrictToggle: (districtId: string) => void;
  onDeliveryTypeToggle: (type: DeliveryType) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveVideo: () => void;
  videoUploadProgress: number;
  isUploadingVideo: boolean;
}

export default function CreateOfferFormFields({
  formData,
  images,
  imagePreviews,
  video,
  videoPreview,
  districts,
  onInputChange,
  onDistrictToggle,
  onDeliveryTypeToggle,
  onImageUpload,
  onRemoveImage,
  onVideoUpload,
  onRemoveVideo,
  videoUploadProgress,
  isUploadingVideo,
}: CreateOfferFormFieldsProps) {
  return (
    <>
      <OfferBasicInfoSection
        formData={{
          title: formData.title,
          description: formData.description,
          category: formData.category,
          subcategory: formData.subcategory,
          transportServiceType: formData.transportServiceType,
        }}
        onInputChange={onInputChange}
      />

      {formData.category === 'transport' && (
        <OfferTransportSection
          formData={{
            transportServiceType: formData.transportServiceType,
            transportRoute: formData.transportRoute,
            transportType: formData.transportType,
            transportCapacity: formData.transportCapacity,
            transportDateTime: formData.transportDateTime,
            transportPrice: formData.transportPrice,
            transportPriceType: formData.transportPriceType,
            transportNegotiable: formData.transportNegotiable,
            transportComment: formData.transportComment,
          }}
          onInputChange={onInputChange}
        />
      )}

      {formData.category !== 'transport' && (
        <OfferPricingSection
          formData={{
            quantity: formData.quantity,
            minOrderQuantity: formData.minOrderQuantity,
            unit: formData.unit,
            pricePerUnit: formData.pricePerUnit,
            noNegotiation: formData.noNegotiation,
            category: formData.category,
            deadline: formData.deadline,
            negotiableDeadline: formData.negotiableDeadline,
            budget: formData.budget,
            negotiableBudget: formData.negotiableBudget,
          }}
          onInputChange={onInputChange}
        />
      )}

      {formData.category !== 'transport' && (
        <OfferLocationSection
          formData={{
            district: formData.district,
            fullAddress: formData.fullAddress,
            gpsCoordinates: formData.gpsCoordinates,
            availableDistricts: formData.availableDistricts,
            availableDeliveryTypes: formData.availableDeliveryTypes,
            category: formData.category,
          }}
          districts={districts}
          onInputChange={onInputChange}
          onDistrictToggle={onDistrictToggle}
          onDeliveryTypeToggle={onDeliveryTypeToggle}
        />
      )}

      <OfferMediaSection
        images={images}
        imagePreviews={imagePreviews}
        video={video}
        videoPreview={videoPreview}
        onImageUpload={onImageUpload}
        onRemoveImage={onRemoveImage}
        onVideoUpload={onVideoUpload}
        onRemoveVideo={onRemoveVideo}
      />

      {isUploadingVideo && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Загрузка видео...</span>
                <span className="text-muted-foreground">{videoUploadProgress}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300 ease-out"
                  style={{ width: `${videoUploadProgress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <OfferAdditionalSection
        formData={{
          deliveryTime: formData.deliveryTime,
          deliveryPeriodStart: formData.deliveryPeriodStart,
          deliveryPeriodEnd: formData.deliveryPeriodEnd,
          expiryDate: formData.expiryDate,
          publicationStartDate: formData.publicationStartDate,
          publicationDuration: formData.publicationDuration,
          category: formData.category,
        }}
        onInputChange={onInputChange}
      />
    </>
  );
}