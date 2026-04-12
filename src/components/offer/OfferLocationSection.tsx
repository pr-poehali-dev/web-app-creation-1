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
import { useDistrict } from '@/contexts/DistrictContext';

const MapModal = lazy(() => import('@/components/auction/MapModal'));
import { findSettlementByName, SETTLEMENTS } from '@/data/settlements';
import { DISTRICTS } from '@/data/districts';
import type { DeliveryType } from '@/types/offer';

interface District {
  id: string;
  name: string;
}

interface OfferLocationSectionProps {
  formData: {
    district: string;
    fullAddress: string;
    gpsCoordinates: string;
    availableDistricts: string[];
    availableDeliveryTypes: DeliveryType[];
    category?: string;
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
  const isService = formData.category === 'utilities' || formData.category === 'transport';
  const { detectedDistrictId } = useDistrict();
  const [districtInput, setDistrictInput] = useState(() => {
    const id = formData.district || detectedDistrictId || '';
    const found = DISTRICTS.find(d => d.id === id);
    return found ? found.name : '';
  });
  const [addressInput, setAddressInput] = useState(formData.fullAddress);
  const [showDistrictDelivery, setShowDistrictDelivery] = useState(true);
  const [districtsOpen, setDistrictsOpen] = useState(false);
  const [districtFilter, setDistrictFilter] = useState('');
  const [showMapModal, setShowMapModal] = useState(false);

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

  // Фильтруем районы для доставки: только из того же региона, исключая текущий и 'all'
  const deliveryDistricts = useMemo(() => {
    const currentDistrict = DISTRICTS.find(d => d.id === formData.district);
    if (!currentDistrict) return [];
    
    return DISTRICTS.filter(d => 
      d.regionId === currentDistrict.regionId && 
      d.id !== 'all' && 
      d.id !== formData.district
    );
  }, [formData.district]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Местоположение и доставка</CardTitle>
        <CardDescription>
          Укажите где находится товар и куда возможна доставка
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            <Label htmlFor="fullAddress">
              Полный адрес {formData.availableDeliveryTypes.length === 1 && formData.availableDeliveryTypes.includes('pickup') ? '*' : '(необязательно)'}
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
            id="fullAddress"
            value={addressInput}
            onChange={(e) => {
              setAddressInput(e.target.value);
              onInputChange('fullAddress', e.target.value);
            }}
            placeholder="Населенный пункт, улица, дом, офис"
            required={formData.availableDeliveryTypes.length === 1 && formData.availableDeliveryTypes.includes('pickup')}
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
                    onInputChange('fullAddress', settlement.name);
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

        {!isService && (
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
        )}

        {formData.availableDeliveryTypes.includes('delivery') && (
          <div>
            <Label className="mb-3 block">Доставка в другие районы:</Label>
            <div className="space-y-3">
              {/* Нет */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="district-delivery-no"
                  checked={!showDistrictDelivery}
                  onCheckedChange={(checked) => {
                    setShowDistrictDelivery(!checked);
                    if (checked) {
                      setDistrictsOpen(false);
                      formData.availableDistricts.forEach(id => onDistrictToggle(id));
                    }
                  }}
                />
                <label
                  htmlFor="district-delivery-no"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Нет
                </label>
              </div>

              {showDistrictDelivery && (
                <>
                  {deliveryDistricts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Сначала выберите район местоположения, чтобы указать районы доставки
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {/* Кнопка открыть/скрыть */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDistrictsOpen(v => !v)}
                        className="gap-1.5 text-xs"
                      >
                        <Icon name={districtsOpen ? 'ChevronUp' : 'ChevronDown'} size={14} />
                        {districtsOpen
                          ? 'Скрыть список районов'
                          : formData.availableDistricts.length > 0
                            ? `Выбрано районов: ${formData.availableDistricts.length}`
                            : 'Выбрать районы доставки'}
                      </Button>

                      {districtsOpen && (
                        <div className="border rounded-lg p-3 space-y-3">
                          <Input
                            placeholder="Поиск района..."
                            value={districtFilter}
                            onChange={e => setDistrictFilter(e.target.value)}
                            className="h-8 text-sm"
                          />
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                            {deliveryDistricts
                              .filter(d => d.name.toLowerCase().includes(districtFilter.toLowerCase()))
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
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <Suspense fallback={<div />}>
        <MapModal
          isOpen={showMapModal}
          onClose={() => setShowMapModal(false)}
          coordinates={formData.gpsCoordinates || ''}
          onCoordinatesChange={(coords) => onInputChange('gpsCoordinates', coords)}
          onAddressChange={(address, districtName, coords) => {
              console.log('🔔 OfferLocationSection: onAddressChange ВЫЗВАН!');
              console.log('📬 onAddressChange вызван:', { address, districtName, coords });
              
              if (address) {
                setAddressInput(address);
                onInputChange('fullAddress', address);
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
                  setDistrictInput(matchedDistrict.name);
                  onInputChange('district', matchedDistrict.id);
                } else {
                  console.log('❌ Район не найден:', normalizedDistrictName);
                  console.log('📝 Примеры районов:', districts.slice(0, 5).map(d => d.name));
                }
              }
            }}
          />
      </Suspense>
    </Card>
  );
}