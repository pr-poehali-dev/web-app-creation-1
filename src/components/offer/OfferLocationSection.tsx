import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import type { DeliveryType } from '@/types/offer';

interface District {
  id: string;
  name: string;
}

interface OfferLocationSectionProps {
  formData: {
    district: string;
    fullAddress: string;
    availableDistricts: string[];
    availableDeliveryTypes: DeliveryType[];
  };
  districts: District[];
  onInputChange: (field: string, value: string) => void;
  onDistrictToggle: (districtId: string) => void;
  onDeliveryTypeToggle: (type: DeliveryType) => void;
}

export default function OfferLocationSection({
  formData,
  districts,
  onInputChange,
  onDistrictToggle,
  onDeliveryTypeToggle
}: OfferLocationSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Местоположение и доставка</CardTitle>
        <CardDescription>
          Укажите где находится товар и куда возможна доставка
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="district">Район местонахождения *</Label>
          <select
            id="district"
            value={formData.district}
            onChange={(e) => onInputChange('district', e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
          >
            <option value="">Выберите район</option>
            {districts.map(district => (
              <option key={district.id} value={district.id}>{district.name}</option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="fullAddress">Полный адрес (необязательно)</Label>
          <Input
            id="fullAddress"
            value={formData.fullAddress}
            onChange={(e) => onInputChange('fullAddress', e.target.value)}
            placeholder="Улица, дом, офис"
          />
        </div>

        <div>
          <Label className="mb-3 block">Доступно для заказа из районов *</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {districts.map(district => (
              <div key={district.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`district-${district.id}`}
                  checked={formData.availableDistricts.includes(district.id)}
                  onCheckedChange={() => onDistrictToggle(district.id)}
                />
                <label
                  htmlFor={`district-${district.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {district.name}
                </label>
              </div>
            ))}
          </div>
          {formData.availableDistricts.length === 0 && (
            <p className="text-xs text-destructive mt-2">
              Выберите хотя бы один район
            </p>
          )}
        </div>

        <div>
          <Label className="mb-3 block">Способы получения *</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="delivery-pickup"
                checked={formData.availableDeliveryTypes.includes('pickup')}
                onCheckedChange={() => onDeliveryTypeToggle('pickup')}
              />
              <label
                htmlFor="delivery-pickup"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
              >
                <Icon name="Store" className="h-4 w-4" />
                Самовывоз
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="delivery-delivery"
                checked={formData.availableDeliveryTypes.includes('delivery')}
                onCheckedChange={() => onDeliveryTypeToggle('delivery')}
              />
              <label
                htmlFor="delivery-delivery"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
              >
                <Icon name="Truck" className="h-4 w-4" />
                Доставка
              </label>
            </div>
          </div>
          {formData.availableDeliveryTypes.length === 0 && (
            <p className="text-xs text-destructive mt-2">
              Выберите хотя бы один способ получения
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
