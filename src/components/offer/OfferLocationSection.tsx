import { useState, useMemo, useEffect } from 'react';
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
  const [districtInput, setDistrictInput] = useState('');
  const [addressInput, setAddressInput] = useState(formData.fullAddress);
  const [isDistrictInitialized, setIsDistrictInitialized] = useState(false);

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
        <CardTitle>Местоположение и доставка</CardTitle>
        <CardDescription>
          Укажите где находится товар и куда возможна доставка
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Label htmlFor="district">Район местонахождения *</Label>
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
            placeholder="Начните вводить название района..."
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
          <Label htmlFor="fullAddress">Полный адрес (необязательно)</Label>
          <Input
            id="fullAddress"
            value={addressInput}
            onChange={(e) => {
              setAddressInput(e.target.value);
              onInputChange('fullAddress', e.target.value);
            }}
            placeholder="Населенный пункт, улица, дом, офис"
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

        <div>
          <Label className="mb-3 block">Доступно для заказа из районов</Label>
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