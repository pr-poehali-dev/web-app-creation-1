import { useState, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';

const MapModal = lazy(() => import('./MapModal'));

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
  const [showMapModal, setShowMapModal] = useState(false);

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
          <Label>Местонахождение на карте (опционально)</Label>
          <button
            type="button"
            onClick={() => setShowMapModal(true)}
            className="flex items-center gap-2 px-4 py-2 mt-2 border-2 border-primary/20 rounded-md hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <Icon name="Map" className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {formData.gpsCoordinates ? 'Изменить на карте' : 'Указать на карте'}
            </span>
          </button>
          {formData.gpsCoordinates && (
            <p className="text-xs text-muted-foreground mt-2">
              Координаты: {formData.gpsCoordinates}
            </p>
          )}
        </div>

        <Suspense fallback={<div>Загрузка карты...</div>}>
          <MapModal
            isOpen={showMapModal}
            onClose={() => setShowMapModal(false)}
            coordinates={formData.gpsCoordinates || ''}
            onCoordinatesChange={(coords) => onInputChange('gpsCoordinates', coords)}
          />
        </Suspense>

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