import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import OfferBasicInfoSection from '@/components/offer/OfferBasicInfoSection';
import OfferPricingSection from '@/components/offer/OfferPricingSection';
import OfferLocationSection from '@/components/offer/OfferLocationSection';
import OfferMediaSection from '@/components/offer/OfferMediaSection';
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
        }}
        onInputChange={onInputChange}
      />

      <OfferPricingSection
        formData={{
          quantity: formData.quantity,
          minOrderQuantity: formData.minOrderQuantity,
          unit: formData.unit,
          pricePerUnit: formData.pricePerUnit,
          hasVAT: formData.hasVAT,
          vatRate: formData.vatRate,
          noNegotiation: formData.noNegotiation,
        }}
        onInputChange={onInputChange}
      />

      <OfferLocationSection
        formData={{
          district: formData.district,
          fullAddress: formData.fullAddress,
          gpsCoordinates: formData.gpsCoordinates,
          availableDistricts: formData.availableDistricts,
          availableDeliveryTypes: formData.availableDeliveryTypes,
        }}
        districts={districts}
        onInputChange={onInputChange}
        onDistrictToggle={onDistrictToggle}
        onDeliveryTypeToggle={onDeliveryTypeToggle}
      />

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

      <Card>
        <CardHeader>
          <CardTitle>Дополнительно</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="deliveryTime">Срок доставки/поставки (необязательно)</Label>
            <Input
              id="deliveryTime"
              type="text"
              placeholder="Например: 1-2 дня, 3-5 рабочих дней"
              value={formData.deliveryTime}
              onChange={(e) => onInputChange('deliveryTime', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="deliveryPeriod">Период поставки (необязательно)</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <Label htmlFor="deliveryPeriodStart" className="text-sm text-muted-foreground">Дата начала</Label>
                <div className="flex gap-2">
                  <Input
                    id="deliveryPeriodStart"
                    type="date"
                    value={formData.deliveryPeriodStart}
                    onChange={(e) => onInputChange('deliveryPeriodStart', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    max={formData.deliveryPeriodEnd || undefined}
                  />
                  {formData.deliveryPeriodStart && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onInputChange('deliveryPeriodStart', '')}
                    >
                      <Icon name="X" className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="deliveryPeriodEnd" className="text-sm text-muted-foreground">Дата окончания</Label>
                <div className="flex gap-2">
                  <Input
                    id="deliveryPeriodEnd"
                    type="date"
                    value={formData.deliveryPeriodEnd}
                    onChange={(e) => onInputChange('deliveryPeriodEnd', e.target.value)}
                    min={formData.deliveryPeriodStart || new Date().toISOString().split('T')[0]}
                  />
                  {formData.deliveryPeriodEnd && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onInputChange('deliveryPeriodEnd', '')}
                    >
                      <Icon name="X" className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="expiryDate">Срок годности (необязательно)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => onInputChange('expiryDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              {formData.expiryDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onInputChange('expiryDate', '')}
                >
                  <Icon name="X" className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Период публикации *</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Укажите период, в течение которого предложение будет активно
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Label htmlFor="publicationStartDate" className="text-xs">Дата начала</Label>
                <Label htmlFor="publicationDuration" className="text-xs">Дата окончания</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="flex gap-1">
                  <Input
                    id="publicationStartDate"
                    type="date"
                    value={formData.publicationStartDate}
                    onChange={(e) => onInputChange('publicationStartDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="text-sm"
                    required
                  />
                  {formData.publicationStartDate && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => onInputChange('publicationStartDate', '')}
                    >
                      <Icon name="X" className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <div className="flex gap-1">
                  <Input
                    id="publicationDuration"
                    type="date"
                    value={formData.publicationDuration}
                    onChange={(e) => onInputChange('publicationDuration', e.target.value)}
                    min={formData.publicationStartDate || new Date().toISOString().split('T')[0]}
                    className="text-sm"
                    required
                  />
                  {formData.publicationDuration && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => onInputChange('publicationDuration', '')}
                    >
                      <Icon name="X" className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}