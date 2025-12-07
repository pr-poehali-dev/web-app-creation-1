import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface AuctionLocationSectionProps {
  formData: {
    district: string;
    fullAddress: string;
    availableDistricts: string[];
    availableDeliveryTypes: ('pickup' | 'delivery')[];
  };
  districts: Array<{ id: string; name: string }>;
  onInputChange: (field: string, value: string) => void;
  onDistrictToggle: (districtId: string) => void;
  onDeliveryTypeToggle: (type: 'pickup' | 'delivery') => void;
}

export default function AuctionLocationSection({ 
  formData, 
  districts, 
  onInputChange, 
  onDistrictToggle, 
  onDeliveryTypeToggle 
}: AuctionLocationSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Местоположение и доставка</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="district">Основной район *</Label>
          <select
            id="district"
            value={formData.district}
            onChange={(e) => onInputChange('district', e.target.value)}
            className="w-full px-3 py-2 border border-input bg-background rounded-md"
            required
          >
            <option value="">Выберите район</option>
            {districts.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="fullAddress">Адрес (опционально)</Label>
          <Input
            id="fullAddress"
            value={formData.fullAddress}
            onChange={(e) => onInputChange('fullAddress', e.target.value)}
            placeholder="Улица, дом"
          />
        </div>

        <div>
          <Label>Районы доставки *</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
            {districts.map(district => (
              <div key={district.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`district-${district.id}`}
                  checked={formData.availableDistricts.includes(district.id)}
                  onCheckedChange={() => onDistrictToggle(district.id)}
                />
                <Label
                  htmlFor={`district-${district.id}`}
                  className="text-sm cursor-pointer"
                >
                  {district.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Способы получения</Label>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pickup"
                checked={formData.availableDeliveryTypes.includes('pickup')}
                onCheckedChange={() => onDeliveryTypeToggle('pickup')}
              />
              <Label htmlFor="pickup" className="cursor-pointer">
                Самовывоз
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="delivery"
                checked={formData.availableDeliveryTypes.includes('delivery')}
                onCheckedChange={() => onDeliveryTypeToggle('delivery')}
              />
              <Label htmlFor="delivery" className="cursor-pointer">
                Доставка
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
