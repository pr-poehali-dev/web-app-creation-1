import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';

interface AuctionLocationSectionProps {
  formData: {
    district: string;
    fullAddress: string;
    gpsCoordinates?: string;
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
  const [districtSearch, setDistrictSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeliveryFilterEnabled, setIsDeliveryFilterEnabled] = useState(false);
  const [deliveryDistrictsFilter, setDeliveryDistrictsFilter] = useState('');

  const filteredDistricts = districts.filter(d => 
    d.name.toLowerCase().includes(districtSearch.toLowerCase())
  );

  const filteredDeliveryDistricts = districts.filter(d => 
    d.name.toLowerCase().includes(deliveryDistrictsFilter.toLowerCase())
  );

  const selectedDistrict = districts.find(d => d.id === formData.district);

  const handleSelectDistrict = (districtId: string) => {
    onInputChange('district', districtId);
    setIsDropdownOpen(false);
    setDistrictSearch('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Местонахождение</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Label htmlFor="district">Район местонахождения *</Label>
          <div className="relative">
            <Input
              id="district"
              value={isDropdownOpen ? districtSearch : (selectedDistrict?.name || '')}
              onChange={(e) => setDistrictSearch(e.target.value)}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Начните вводить название района..."
              className="pr-8"
              required
            />
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <Icon name={isDropdownOpen ? "ChevronUp" : "ChevronDown"} className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          
          {isDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute z-20 w-full mt-1 max-h-60 overflow-auto bg-background border border-input rounded-md shadow-lg">
                {filteredDistricts.length > 0 ? (
                  filteredDistricts.map(district => (
                    <button
                      key={district.id}
                      type="button"
                      onClick={() => handleSelectDistrict(district.id)}
                      className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors ${
                        formData.district === district.id ? 'bg-accent font-medium' : ''
                      }`}
                    >
                      {district.name}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Районы не найдены
                  </div>
                )}
              </div>
            </>
          )}
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
          <Label htmlFor="gpsCoordinates">GPS-координаты (опционально)</Label>
          <div className="relative">
            <Input
              id="gpsCoordinates"
              value={formData.gpsCoordinates || ''}
              onChange={(e) => onInputChange('gpsCoordinates', e.target.value)}
              placeholder="Например: 41.2995, 69.2401"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const coords = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
                      onInputChange('gpsCoordinates', coords);
                    },
                    (error) => {
                      console.error('Ошибка получения координат:', error);
                    }
                  );
                }
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-accent rounded-md transition-colors"
              title="Получить текущие координаты"
            >
              <Icon name="MapPin" className="h-4 w-4 text-primary" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Укажите координаты в формате: широта, долгота
          </p>
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

        {formData.availableDeliveryTypes.includes('delivery') && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label>Другие районы</Label>
              <button
                type="button"
                onClick={() => {
                  setIsDeliveryFilterEnabled(!isDeliveryFilterEnabled);
                  setDeliveryDistrictsFilter('');
                }}
                className={`px-2 py-0.5 text-xs font-bold uppercase rounded-md border-2 transition-colors ${
                  isDeliveryFilterEnabled 
                    ? 'border-green-500 text-green-600 hover:bg-green-50' 
                    : 'border-gray-400 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {isDeliveryFilterEnabled ? 'есть' : 'нет'}
              </button>
            </div>
            
            {isDeliveryFilterEnabled && (
              <>
                <div className="mb-3">
                  <Input
                    value={deliveryDistrictsFilter}
                    onChange={(e) => setDeliveryDistrictsFilter(e.target.value)}
                    placeholder="Введите название района для фильтрации..."
                    className="w-full"
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredDeliveryDistricts.map(district => (
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
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}