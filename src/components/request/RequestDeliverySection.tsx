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
import type { District } from '@/contexts/DistrictContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const MapModal = lazy(() => import('@/components/auction/MapModal'));

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
  const [districtInput, setDistrictInput] = useState('');
  const [addressInput, setAddressInput] = useState(formData.deliveryAddress);
  const [isDistrictInitialized, setIsDistrictInitialized] = useState(false);
  const [isDistrictsOpen, setIsDistrictsOpen] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  useEffect(() => {
    const selectedDistrict = districts.find(d => d.id === formData.district);
    if (selectedDistrict && !isDistrictInitialized) {
      setDistrictInput(selectedDistrict.name);
      setIsDistrictInitialized(true);
    }
  }, [formData.district, districts, isDistrictInitialized]);

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
        <CardTitle>Адрес доставки</CardTitle>
        <CardDescription>
          Укажите куда нужно доставить товар или оказать услугу
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Label htmlFor="district">Регион доставки *</Label>
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
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="deliveryAddress">Точный адрес доставки *</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowMapModal(true)}
              className="flex items-center gap-2"
            >
              <Icon name="MapPin" className="h-4 w-4" />
              Указать на карте
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
            required
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

        <Collapsible open={isDistrictsOpen} onOpenChange={setIsDistrictsOpen}>
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <Label>Принимаются отклики из регионов</Label>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 border-2"
              >
                <Icon 
                  name={isDistrictsOpen ? "ChevronUp" : "ChevronDown"} 
                  className="h-5 w-5"
                />
              </Button>
            </CollapsibleTrigger>
            {formData.availableDistricts.map(districtId => {
              const district = districts.find(d => d.id === districtId);
              if (!district) return null;
              return (
                <button
                  key={districtId}
                  type="button"
                  onClick={() => onDistrictToggle(districtId)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                >
                  {district.name}
                  <Icon name="X" className="h-3 w-3" />
                </button>
              );
            })}
          </div>
          <CollapsibleContent>
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
          </CollapsibleContent>
        </Collapsible>
      </CardContent>

      {showMapModal && (
        <Suspense fallback={null}>
          <MapModal
            isOpen={showMapModal}
            onClose={() => setShowMapModal(false)}
            onAddressChange={(address, districtName) => {
              if (address) {
                setAddressInput(address);
                onInputChange('deliveryAddress', address);
              }
              if (districtName) {
                const matchedDistrict = districts.find(d => 
                  d.name.toLowerCase().includes(districtName.toLowerCase()) ||
                  districtName.toLowerCase().includes(d.name.toLowerCase())
                );
                if (matchedDistrict) {
                  setDistrictInput(matchedDistrict.name);
                  onInputChange('district', matchedDistrict.id);
                }
              }
            }}
          />
        </Suspense>
      )}
    </Card>
  );
}