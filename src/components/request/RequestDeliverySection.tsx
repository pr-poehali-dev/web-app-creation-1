import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { findSettlementByName, SETTLEMENTS } from '@/data/settlements';
import { useDistrict, type District } from '@/contexts/DistrictContext';
import { DISTRICTS } from '@/data/districts';

const MapModal = lazy(() => import('@/components/auction/MapModal'));

interface RequestDeliverySectionProps {
  formData: {
    district: string;
    deliveryAddress: string;
    gpsCoordinates: string;
    availableDistricts: string[];
    category?: string;
    deliveryAvailable: boolean;
    pickupAvailable: boolean;
  };
  districts: District[];
  onInputChange: (field: string, value: string | boolean) => void;
  onDistrictToggle: (districtId: string) => void;
}

export default function RequestDeliverySection({
  formData,
  districts,
  onInputChange,
  onDistrictToggle,
}: RequestDeliverySectionProps) {
  const isService = formData.category === 'utilities';
  const isAddressRequired = formData.deliveryAvailable;
  const { detectedDistrictId } = useDistrict();
  const [districtInput, setDistrictInput] = useState('');
  const [addressInput, setAddressInput] = useState(formData.deliveryAddress);
  const [isDistrictsOpen, setIsDistrictsOpen] = useState(false);
  const [districtFilter, setDistrictFilter] = useState('');
  const [showMapModal, setShowMapModal] = useState(false);
  const [allDistrictsSelected, setAllDistrictsSelected] = useState(false);

  // Автоопределение района по геолокации при первой загрузке
  useEffect(() => {
    if (!formData.district && detectedDistrictId) {
      const found = DISTRICTS.find(d => d.id === detectedDistrictId);
      if (found) {
        setDistrictInput(found.name);
        onInputChange('district', detectedDistrictId);
      }
    }
  }, [detectedDistrictId]);

  useEffect(() => {
    const allSelected = districts.filter(d => d.id !== 'all').every(d => formData.availableDistricts.includes(d.id));
    setAllDistrictsSelected(allSelected);
  }, [formData.availableDistricts, districts]);

  const handleAllDistrictsToggle = () => {
    if (allDistrictsSelected) {
      districts.filter(d => d.id !== 'all').forEach(d => {
        if (formData.availableDistricts.includes(d.id)) {
          onDistrictToggle(d.id);
        }
      });
    } else {
      districts.filter(d => d.id !== 'all').forEach(d => {
        if (!formData.availableDistricts.includes(d.id)) {
          onDistrictToggle(d.id);
        }
      });
    }
  };

  useEffect(() => {
    const selectedDistrict = districts.find(d => d.id === formData.district);
    if (selectedDistrict) {
      setDistrictInput(selectedDistrict.name);
    }
  }, [formData.district, districts]);

  const filteredDistricts = useMemo(() => {
    if (!districtInput || districtInput.length < 1) return [];
    
    const currentDistrict = districts.find(d => d.id === formData.district);
    if (currentDistrict && districtInput === currentDistrict.name) {
      return [];
    }
    
    return districts.filter(d => 
      d.name.toLowerCase().includes(districtInput.toLowerCase()) && d.id !== 'all'
    ).slice(0, 5);
  }, [districts, districtInput, formData.district]);

  const filteredSettlements = useMemo(() => {
    if (!addressInput || addressInput.length < 2) return [];
    return SETTLEMENTS.filter(s => 
      s.name.toLowerCase().includes(addressInput.toLowerCase())
    ).slice(0, 5);
  }, [addressInput]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isService ? 'Место оказания услуг' : 'Адрес доставки'}</CardTitle>
        <CardDescription>
          {isService ? 'Укажите район, где нужно оказать услугу' : 'Укажите куда нужно доставить товар'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isService && (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="deliveryAvailable"
                checked={formData.deliveryAvailable}
                onCheckedChange={(checked) => onInputChange('deliveryAvailable', !!checked)}
              />
              <label htmlFor="deliveryAvailable" className="text-sm font-medium cursor-pointer">
                Доставка
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="pickupAvailable"
                checked={formData.pickupAvailable}
                onCheckedChange={(checked) => onInputChange('pickupAvailable', !!checked)}
              />
              <label htmlFor="pickupAvailable" className="text-sm font-medium cursor-pointer">
                Самовывоз
              </label>
            </div>
          </div>
        )}

        <div className="relative">
          <Label htmlFor="district">Выбери район местоположения *</Label>
          <Input
            id="district"
            value={districtInput}
            onChange={(e) => {
              const value = e.target.value;
              setDistrictInput(value);
              
              const matchedDistrict = districts.find(d => 
                d.name.toLowerCase() === value.toLowerCase() && d.id !== 'all'
              );
              if (matchedDistrict) {
                onInputChange('district', matchedDistrict.id);
              }
            }}
            placeholder="Начните вводить название региона..."
            required
          />
          {filteredDistricts.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md">
              {filteredDistricts.map((district) => (
                <button
                  key={district.id}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2"
                  onClick={() => {
                    setDistrictInput(district.name);
                    onInputChange('district', district.id);
                  }}
                >
                  <Icon name="MapPin" className="h-4 w-4 text-muted-foreground" />
                  <span>{district.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <Label htmlFor="deliveryAddress">
              {isService ? 'Точный адрес (необязательно)' : isAddressRequired ? 'Точный адрес доставки *' : 'Точный адрес (необязательно)'}
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowMapModal(true)}
              className="flex items-center gap-1.5 text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Icon name="MapPin" className="h-3.5 w-3.5" />
              <span className="whitespace-nowrap">Указать на карте</span>
            </Button>
          </div>
          <Input
            id="deliveryAddress"
            value={addressInput}
            onChange={(e) => {
              setAddressInput(e.target.value);
              onInputChange('deliveryAddress', e.target.value);
            }}
            placeholder="Населенный пункт, улица, дом, офис, подъезд"
            required={isAddressRequired}
            className="text-xs"
          />
          {filteredSettlements.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md">
              {filteredSettlements.map((settlement) => (
                <button
                  key={settlement.id}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2"
                  onClick={() => {
                    setAddressInput(settlement.name);
                    onInputChange('deliveryAddress', settlement.name);
                    onInputChange('district', settlement.districtId);
                  }}
                >
                  <Icon name="MapPin" className="h-4 w-4 text-muted-foreground" />
                  <span>{settlement.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label>Принимаются отклики из районов</Label>

          {/* Кнопка открыть/скрыть */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsDistrictsOpen(v => !v)}
            className="gap-1.5 text-xs"
          >
            <Icon name={isDistrictsOpen ? 'ChevronUp' : 'ChevronDown'} size={14} />
            {isDistrictsOpen
              ? 'Скрыть список районов'
              : allDistrictsSelected
                ? 'Все районы выбраны'
                : formData.availableDistricts.length > 0
                  ? `Выбрано районов: ${formData.availableDistricts.length}`
                  : 'Выбрать районы'}
          </Button>

          {isDistrictsOpen && (
            <div className="border rounded-lg p-3 space-y-3">
              <Input
                placeholder="Поиск района..."
                value={districtFilter}
                onChange={e => setDistrictFilter(e.target.value)}
                className="h-8 text-sm"
              />
              {/* Все районы */}
              <div className="flex items-center space-x-2 border-b pb-2">
                <Checkbox
                  id="all-districts"
                  checked={allDistrictsSelected}
                  onCheckedChange={handleAllDistrictsToggle}
                />
                <label
                  htmlFor="all-districts"
                  className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Все районы
                </label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {districts
                  .filter(d => d.id !== 'all' && d.name.toLowerCase().includes(districtFilter.toLowerCase()))
                  .map(district => (
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
            </div>
          )}

          {/* Теги выбранных */}
          {!isDistrictsOpen && formData.availableDistricts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {allDistrictsSelected ? (
                <button
                  type="button"
                  onClick={handleAllDistrictsToggle}
                  className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                >
                  Все районы <Icon name="X" size={12} />
                </button>
              ) : (
                formData.availableDistricts.filter(id => id !== 'all').map(districtId => {
                  const district = districts.find(d => d.id === districtId);
                  if (!district) return null;
                  return (
                    <button
                      key={districtId}
                      type="button"
                      onClick={() => onDistrictToggle(districtId)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                    >
                      {district.name} <Icon name="X" size={12} />
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </CardContent>

      {showMapModal && (
        <Suspense fallback={null}>
          <MapModal
            isOpen={showMapModal}
            onClose={() => setShowMapModal(false)}
            coordinates={formData.gpsCoordinates || ''}
            onCoordinatesChange={(coords) => onInputChange('gpsCoordinates', coords)}
            onAddressChange={(address, districtName, coords) => {
              console.log('📬 onAddressChange вызван:', { address, districtName, coords });
              
              if (address) {
                setAddressInput(address);
                onInputChange('deliveryAddress', address);
              }
              
              if (coords) {
                onInputChange('gpsCoordinates', coords);
              }
              
              if (districtName) {
                const normalizedDistrictName = districtName.toLowerCase().trim();
                console.log('🔍 Ищу район:', normalizedDistrictName);
                console.log('📊 Всего районов в базе:', districts.length);
                
                const matchedDistrict = districts.find(d => {
                  const normalizedDbName = d.name.toLowerCase().trim();
                  
                  if (normalizedDbName === normalizedDistrictName) return true;
                  if (normalizedDbName.includes(normalizedDistrictName)) return true;
                  if (normalizedDistrictName.includes(normalizedDbName)) return true;
                  
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
                  
                  const firstWordDb = cleanDbName.split(' ')[0];
                  const firstWordOsm = cleanOsmName.split(' ')[0];
                  if (firstWordDb && firstWordOsm && firstWordDb.length > 3 && firstWordOsm.length > 3) {
                    if (firstWordDb === firstWordOsm) return true;
                    if (firstWordDb.includes(firstWordOsm) || firstWordOsm.includes(firstWordDb)) return true;
                  }
                  
                  return false;
                });
                
                if (matchedDistrict) {
                  console.log('✅ Район найден:', matchedDistrict.name);
                  onInputChange('district', matchedDistrict.id);
                } else {
                  console.log('❌ Район не найден:', normalizedDistrictName);
                  console.log('📝 Примеры районов:', districts.slice(0, 5).map(d => d.name));
                }
              }
            }}
          />
        </Suspense>
      )}
    </Card>
  );
}