import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { District } from '@/contexts/DistrictContext';

interface RequestDeliverySectionProps {
  formData: {
    district: string;
    deliveryAddress: string;
    availableDistricts: string[];
  };
  districts: District[];
  onInputChange: (field: string, value: string) => void;
  onDistrictToggle: (districtId: string) => void;
}

export default function RequestDeliverySection({
  formData,
  districts,
  onInputChange,
  onDistrictToggle,
}: RequestDeliverySectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Адрес доставки</CardTitle>
        <CardDescription>
          Укажите куда нужно доставить товар или оказать услугу
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="district">Район доставки *</Label>
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
          <Label htmlFor="deliveryAddress">Точный адрес доставки *</Label>
          <Input
            id="deliveryAddress"
            value={formData.deliveryAddress}
            onChange={(e) => onInputChange('deliveryAddress', e.target.value)}
            placeholder="Улица, дом, офис, подъезд"
            required
          />
        </div>

        <div>
          <Label className="mb-3 block">Принимаются отклики из районов *</Label>
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
      </CardContent>
    </Card>
  );
}
