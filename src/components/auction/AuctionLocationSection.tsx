import { useState, lazy, Suspense, useEffect } from 'react';
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
  const [showDistrictNotification, setShowDistrictNotification] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('districtSoundEnabled');
    return saved === null ? true : saved === 'true';
  });

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

  const handleMapAddressChange = (address: string, districtName: string, coords?: string) => {
    console.log('🗺️ MapModal callback:', { address, districtName, coords });
    
    if (address) {
      onInputChange('fullAddress', address);
    }
    
    if (coords) {
      onInputChange('gpsCoordinates', coords);
    }
    
    if (districtName) {
      const normalizedDistrictName = districtName.toLowerCase().trim();
      console.log('🔍 Searching for district:', normalizedDistrictName);
      console.log('📋 Total districts in database:', districts.length);
      
      // Попытка найти точное совпадение или частичное совпадение
      const matchedDistrict = districts.find(d => {
        const normalizedDbName = d.name.toLowerCase().trim();
        
        // Точное совпадение
        if (normalizedDbName === normalizedDistrictName) return true;
        
        // Частичное совпадение (название из OpenStreetMap содержится в названии из базы)
        if (normalizedDbName.includes(normalizedDistrictName)) return true;
        
        // Обратное частичное совпадение (название из базы содержится в названии из OpenStreetMap)
        if (normalizedDistrictName.includes(normalizedDbName)) return true;
        
        // Убираем служебные слова для более точного сопоставления
        const cleanDbName = normalizedDbName
          .replace(/район/g, '')
          .replace(/округ/g, '')
          .replace(/улус/g, '')
          .replace(/административный/g, '')
          .replace(/городской/g, '')
          .replace(/муниципальный/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        const cleanOsmName = normalizedDistrictName
          .replace(/район/g, '')
          .replace(/округ/g, '')
          .replace(/улус/g, '')
          .replace(/административный/g, '')
          .replace(/городской/g, '')
          .replace(/муниципальный/g, '')
          .replace(/raion/gi, '')
          .replace(/okrug/gi, '')
          .replace(/district/gi, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (cleanDbName && cleanOsmName && cleanDbName === cleanOsmName) return true;
        if (cleanDbName && cleanOsmName && cleanDbName.includes(cleanOsmName)) return true;
        if (cleanDbName && cleanOsmName && cleanOsmName.includes(cleanDbName)) return true;
        
        // Проверка первого слова (часто это основное название района)
        const firstWordDb = cleanDbName.split(' ')[0];
        const firstWordOsm = cleanOsmName.split(' ')[0];
        if (firstWordDb && firstWordOsm && firstWordDb.length > 3 && firstWordOsm.length > 3) {
          if (firstWordDb === firstWordOsm) return true;
          if (firstWordDb.includes(firstWordOsm) || firstWordOsm.includes(firstWordDb)) return true;
        }
        
        return false;
      });
      
      if (matchedDistrict) {
        console.log('✅ District matched:', matchedDistrict.name);
        onInputChange('district', matchedDistrict.id);
        setDistrictSearch('');
        setIsDropdownOpen(false);
        
        // Показать уведомление
        setShowDistrictNotification(true);
        
        // Воспроизвести звук успеха (если включен)
        if (soundEnabled) {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSyAzvLZiTYIGWi+8OKbTRAMUKzn77RdGgU7k9jwyHgrBSh+zPLaizsIHGS56+mjUBELTKXh8LJjHAU2jdXvwHUmBSl9y+/aiDkIHGe96+mjUBEMT6jr77RdGgU7ldjvx3YpBSh+zPDaizsIG2S46+mjUBEMTqfr77RdGgU7lNjvx3YpBSh9y+/aiDkIG2S46+mjUBEMTqfr77RdGgU7lNjvx3YpBSh9y+/aiDkIG2O46+mjUBEMTqfr77RdGgU7lNjvx3YpBSh9y+/aiDkIG2O46+mjUBEMTqfr77RdGgU7lNjvx3YpBSh9y+/aiDkIG2O46+mjUBEMTqfr77RdGgU7lNjvx3YpBSh9y+/aiDkIG2O46+mjUBEMTqfr77RdGgU7lNjvx3YpBSh9y+/aiDkIG2O46+mjUBEMTqfr77RdGgU7lNjvx3YpBSh9y+/aiDkIG2O46+mjUBEMTqfr77RdGgU7lNjvx3YpBSh9y+/aiDkIG2O46+mjUBEMTqfr77RdGgU7lNjvx3YpBSh9y+/aiDkIG2O46+mjUBEMTqfr77RdGgU7lNjvx3YpBSh9y+/aiDkIG2O46+mjUBEMTqfr77RdGgU7lNjvx3YpBSh9y+/aiDkIG2O46+mjUBEMTqfr77RdGgU7lNjvx3YpBSh9y+/aiDkIG2O46+mjUBEMTqfr77RdGgU7lNjvx3YpBSh9y+/aiDkIG2O46+mjUBEMTqfr77RdGgU7lNjvx3YpBSh9y+/aiDkIG2O46+mjUBEMTqfr77RdGgU7lNjvx3YpBSh9y+/aiDkIG2O46+mjUBEMTqfr77RdGgU7lNjvx3YpBSh9y+/aiDkIG2O46+mjUBEMTqfr77RdGgU7lNjvx3YpBSh9y+/aiDkIG2O46+mjUBEMTqfr77RdGgU7lNjvx3YpBSh9y+/aiDkIG2O46+mjUBEMTqfr77RdGgU7lNjvx3YpBSh9y+/aiDkIG2O46+mjUBEMTqfr77RdGgU7');
          audio.volume = 0.3;
          audio.play().catch(() => {
            // Игнорируем ошибки воспроизведения
          });
        }
      } else {
        console.log('❌ No district match found');
        console.log('📊 Available districts count:', districts.length);
        console.log('🔤 Looking for:', normalizedDistrictName);
        console.log('📝 Sample districts from DB:', districts.slice(0, 10).map(d => d.name).join(', '));
        
        // Попробуем найти похожие
        const similar = districts.filter(d => {
          const name = d.name.toLowerCase();
          return name.includes(normalizedDistrictName.split(' ')[0]) || 
                 normalizedDistrictName.includes(name.split(' ')[0]);
        });
        
        if (similar.length > 0) {
          console.log('🔎 Similar districts found:', similar.map(d => d.name).join(', '));
        }
      }
    }
  };

  useEffect(() => {
    if (showDistrictNotification) {
      const timer = setTimeout(() => setShowDistrictNotification(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showDistrictNotification]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Местонахождение</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Label htmlFor="district">Выбери район местонахождения *</Label>
          <div className="relative">
            <Input
              id="district"
              value={isDropdownOpen ? districtSearch : (selectedDistrict?.name || '')}
              onChange={(e) => setDistrictSearch(e.target.value)}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Начните вводить название района..."
              className={`pr-8 transition-all ${showDistrictNotification ? 'ring-2 ring-green-500' : ''}`}
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
          
          {showDistrictNotification && (
            <div className="absolute left-0 right-0 -bottom-8 z-30 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white text-sm rounded-md shadow-lg">
                <Icon name="CheckCircle2" className="h-4 w-4" />
                <span>Район определён автоматически</span>
              </div>
            </div>
          )}
          
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
            className="text-xs"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Местонахождение на карте (опционально)</Label>
            <div className="flex items-center gap-2">
              <Label htmlFor="soundToggle" className="text-xs text-muted-foreground cursor-pointer">Звук</Label>
              <button
                id="soundToggle"
                type="button"
                onClick={() => {
                  const newValue = !soundEnabled;
                  setSoundEnabled(newValue);
                  localStorage.setItem('districtSoundEnabled', String(newValue));
                }}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  soundEnabled ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowMapModal(true)}
            className="flex items-center gap-2 px-4 py-2 border-2 border-primary/20 rounded-md hover:border-primary/40 hover:bg-primary/5 transition-all"
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
            onAddressChange={handleMapAddressChange}
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