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
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [addressInput, setAddressInput] = useState(formData.fullAddress);

  useEffect(() => {
    if (addressInput && addressInput.length > 2) {
      const settlement = findSettlementByName(addressInput);
      if (settlement) {
        onInputChange('district', settlement.districtId);
      }
    }
  }, [addressInput, onInputChange]);

  const filteredDistricts = useMemo(() => {
    if (!search) return districts;
    return districts.filter(d => 
      d.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [districts, search]);

  const filteredSettlements = useMemo(() => {
    if (!addressInput || addressInput.length < 2) return [];
    return SETTLEMENTS.filter(s => 
      s.name.toLowerCase().includes(addressInput.toLowerCase())
    ).slice(0, 5);
  }, [addressInput]);

  const selectedDistrictName = districts.find(d => d.id === formData.district)?.name || 'Выберите район';

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
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {selectedDistrictName}
                <Icon name="ChevronsUpDown" className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Поиск района..." 
                  value={search}
                  onValueChange={setSearch}
                />
                <CommandList>
                  <CommandEmpty>Район не найден</CommandEmpty>
                  <CommandGroup>
                    {filteredDistricts.map((district) => (
                      <CommandItem
                        key={district.id}
                        value={district.id}
                        onSelect={() => {
                          onInputChange('district', district.id);
                          setOpen(false);
                          setSearch('');
                        }}
                      >
                        <Icon
                          name="Check"
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.district === district.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {district.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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