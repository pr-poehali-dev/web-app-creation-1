import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import RequestBasicInfoSection from '@/components/request/RequestBasicInfoSection';
import RequestPricingSection from '@/components/request/RequestPricingSection';
import RequestDeliverySection from '@/components/request/RequestDeliverySection';
import RequestMediaSection from '@/components/request/RequestMediaSection';
import RequestTransportSection from '@/components/request/RequestTransportSection';

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
  unit: string;
  pricePerUnit: string;
  hasVAT: boolean;
  vatRate: string;
  negotiableQuantity: boolean;
  negotiablePrice: boolean;
  deadline: string;
  deadlineStart: string;
  deadlineEnd: string;
  negotiableDeadline: boolean;
  budget: string;
  negotiableBudget: boolean;
  district: string;
  deliveryAddress: string;
  gpsCoordinates: string;
  availableDistricts: string[];
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  startDate: string;
  expiryDate: string;
  publicationDuration: string;
  transportServiceType: string;
  transportRoute: string;
  transportType: string;
  transportCapacity: string;
  transportDateTime: string;
  transportDepartureDateTime: string;
  transportPrice: string;
  transportPriceType: string;
  transportNegotiable: boolean;
  transportComment: string;
  transportAllDistricts: boolean;
}

interface CreateRequestFormFieldsProps {
  formData: FormData;
  images: File[];
  imagePreviews: string[];
  video: File | null;
  videoPreview: string;
  districts: District[];
  isSubmitting: boolean;
  onInputChange: (field: string, value: string | boolean) => void;
  onDistrictToggle: (districtId: string) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveVideo: () => void;
  onSubmit: (e: React.FormEvent, isDraft: boolean) => void;
  onCancel: () => void;
}

export default function CreateRequestFormFields({
  formData,
  images,
  imagePreviews,
  video,
  videoPreview,
  districts,
  isSubmitting,
  onInputChange,
  onDistrictToggle,
  onImageUpload,
  onRemoveImage,
  onVideoUpload,
  onRemoveVideo,
  onSubmit,
  onCancel,
}: CreateRequestFormFieldsProps) {
  return (
    <form onSubmit={(e) => onSubmit(e, false)} className="space-y-6">
      <RequestBasicInfoSection
        formData={{
          title: formData.title,
          description: formData.description,
          category: formData.category,
          subcategory: formData.subcategory,
        }}
        onInputChange={onInputChange}
      />

      {formData.category === 'transport' && (
        <RequestTransportSection
          formData={{
            transportServiceType: formData.transportServiceType,
            transportRoute: formData.transportRoute,
            transportType: formData.transportType,
            transportCapacity: formData.transportCapacity,
            transportDateTime: formData.transportDateTime,
            transportDepartureDateTime: formData.transportDepartureDateTime,
            transportPrice: formData.transportPrice,
            transportPriceType: formData.transportPriceType,
            transportNegotiable: formData.transportNegotiable,
            transportComment: formData.transportComment,
            availableDistricts: formData.availableDistricts,
            transportAllDistricts: formData.transportAllDistricts,
            district: formData.district,
          }}
          onInputChange={onInputChange}
          onDistrictToggle={onDistrictToggle}
        />
      )}

      {formData.category !== 'transport' && (
        <RequestPricingSection
          formData={{
            quantity: formData.quantity,
            unit: formData.unit,
            pricePerUnit: formData.pricePerUnit,
            hasVAT: formData.hasVAT,
            vatRate: formData.vatRate,
            negotiableQuantity: formData.negotiableQuantity,
            negotiablePrice: formData.negotiablePrice,
            category: formData.category,
            deadline: formData.deadline,
            deadlineStart: formData.deadlineStart,
            deadlineEnd: formData.deadlineEnd,
            negotiableDeadline: formData.negotiableDeadline,
            budget: formData.budget,
            negotiableBudget: formData.negotiableBudget,
          }}
          onInputChange={onInputChange}
        />
      )}

      {formData.category !== 'transport' && (
        <RequestDeliverySection
          formData={{
            district: formData.district,
            deliveryAddress: formData.deliveryAddress,
            gpsCoordinates: formData.gpsCoordinates,
            availableDistricts: formData.availableDistricts,
            category: formData.category,
            deliveryAvailable: formData.deliveryAvailable,
            pickupAvailable: formData.pickupAvailable,
          }}
          districts={districts}
          onInputChange={onInputChange}
          onDistrictToggle={onDistrictToggle}
        />
      )}

      <RequestMediaSection
        images={images}
        imagePreviews={imagePreviews}
        video={video}
        videoPreview={videoPreview}
        onImageUpload={onImageUpload}
        onRemoveImage={onRemoveImage}
        onVideoUpload={onVideoUpload}
        onRemoveVideo={onRemoveVideo}
      />

      <Card>
        <CardHeader>
          <CardTitle>Дополнительно</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.category !== 'transport' && (
            <div>
              <Label>Срок актуальности запроса (необязательно)</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <Label htmlFor="startDate" className="text-sm text-muted-foreground">Дата начала</Label>
                  <div className="flex gap-2">
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => onInputChange('startDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      max={formData.expiryDate || undefined}
                    />
                    {formData.startDate && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onInputChange('startDate', '')}
                      >
                        <Icon name="X" className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="expiryDate" className="text-sm text-muted-foreground">Дата окончания</Label>
                  <div className="flex gap-2">
                    <Input
                      id="expiryDate"
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => onInputChange('expiryDate', e.target.value)}
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
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
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="publicationDuration">Срок публикации *</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="publicationDuration"
                type="date"
                value={formData.publicationDuration}
                onChange={(e) => onInputChange('publicationDuration', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                max={
                  formData.transportServiceType === 'Пассажирские перевозки' && formData.transportDepartureDateTime
                    ? formData.transportDepartureDateTime.split('T')[0]
                    : undefined
                }
                required
              />
              {formData.publicationDuration && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onInputChange('publicationDuration', '')}
                >
                  <Icon name="X" className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formData.transportServiceType === 'Пассажирские перевозки' && formData.transportDepartureDateTime
                ? `Не позже даты выезда: ${formData.transportDepartureDateTime.split('T')[0]}`
                : 'Дата, до которой запрос будет активен'}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          size="lg"
          disabled={
            isSubmitting ||
            !formData.category ||
            (formData.category === 'transport'
              ? !formData.transportServiceType || !formData.transportRoute || !formData.transportType || !formData.publicationDuration
              : !formData.title || !formData.district)
          }
        >
          {isSubmitting ? (
            <>
              <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
              Отправка...
            </>
          ) : (
            <>
              <Icon name="Send" className="mr-2 h-4 w-4" />
              Опубликовать запрос
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Отмена
        </Button>
      </div>
    </form>
  );
}