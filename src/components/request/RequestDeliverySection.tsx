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
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [addressInput, setAddressInput] = useState(formData.deliveryAddress);

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
        <CardTitle>Адрес доставки</CardTitle>
        <CardDescription>
          Укажите куда нужно доставить товар или оказать услугу
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="district">Район доставки *</Label>
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
          <Label htmlFor="deliveryAddress">Точный адрес доставки *</Label>
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