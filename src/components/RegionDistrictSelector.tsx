import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useDistrict } from '@/contexts/DistrictContext';

interface RegionDistrictSelectorProps {
  className?: string;
  showBadges?: boolean;
}

export default function RegionDistrictSelector({ className = '', showBadges = true }: RegionDistrictSelectorProps) {
  const { 
    selectedRegion, 
    setSelectedRegion, 
    selectedDistricts, 
    toggleDistrict, 
    setSelectedDistricts,
    regions, 
    districts,
    isDetecting, 
    requestGeolocation,
    detectedCity
  } = useDistrict();
  
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'region' | 'district'>('region');

  const availableRegions = regions.filter(r => r.id !== 'all');
  const selectedRegionData = regions.find(r => r.id === selectedRegion);

  const handleSelectRegion = (regionId: string) => {
    if (regionId === 'all') {
      setSelectedRegion('all');
      setSelectedDistricts([]);
      setActiveTab('region');
    } else {
      setSelectedRegion(regionId);
      setActiveTab('district');
    }
  };

  const handleToggleDistrict = (districtId: string) => {
    toggleDistrict(districtId);
  };

  const handleSelectAllDistricts = () => {
    if (selectedRegion === 'all') return;
    setSelectedDistricts(districts.map(d => d.id));
  };

  const handleClearDistricts = () => {
    setSelectedDistricts([]);
  };

  const handleDetectLocation = async () => {
    await requestGeolocation();
    setActiveTab('district');
  };

  const getDisplayText = () => {
    if (selectedRegion === 'all') {
      return 'Все регионы';
    }
    
    if (selectedDistricts.length === 0) {
      return selectedRegionData?.name || 'Выбран регион';
    }
    
    if (selectedDistricts.length === 1) {
      const district = districts.find(d => d.id === selectedDistricts[0]);
      return district?.name || selectedRegionData?.name;
    }
    
    const count = selectedDistricts.length;
    return `${count} ${count === 1 ? 'район' : count < 5 ? 'района' : 'районов'} в ${selectedRegionData?.name || 'регионе'}`;
  };

  const getSubtitleText = () => {
    if (selectedRegion !== 'all' && detectedCity && detectedCity !== 'Не определен') {
      return detectedCity;
    }
    return null;
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto py-2"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Icon name="MapPin" className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex flex-col items-start min-w-0">
                <span className="truncate text-sm font-medium">{getDisplayText()}</span>
                {getSubtitleText() && (
                  <span className="text-xs text-muted-foreground truncate w-full">{getSubtitleText()}</span>
                )}
              </div>
            </div>
            <Icon name="ChevronsUpDown" className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'region' | 'district')}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="region">Регион</TabsTrigger>
              <TabsTrigger value="district" disabled={selectedRegion === 'all'}>
                Районы {selectedDistricts.length > 0 && `(${selectedDistricts.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="region" className="m-0">
              <Command shouldFilter={true}>
                <CommandInput placeholder="Поиск региона..." />
                <CommandList>
                  <CommandEmpty>Регион не найден</CommandEmpty>
                  <CommandGroup>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDetectLocation}
                      disabled={isDetecting}
                      className="w-full justify-start mb-2 h-8"
                    >
                      {isDetecting ? (
                        <>
                          <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                          Определяем...
                        </>
                      ) : (
                        <>
                          <Icon name="MapPinned" className="mr-2 h-4 w-4" />
                          Определить мой регион
                        </>
                      )}
                    </Button>
                  </CommandGroup>
                  <CommandGroup>
                    <CommandItem
                      value="all-regions"
                      keywords={['все', 'регионы', 'all']}
                      onSelect={() => handleSelectRegion('all')}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-4 h-4 border-2 border-primary rounded flex items-center justify-center">
                          {selectedRegion === 'all' && (
                            <Icon name="Check" className="h-3 w-3 text-primary" />
                          )}
                        </div>
                        <Icon name="Globe" className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Все регионы</span>
                      </div>
                    </CommandItem>
                  </CommandGroup>
                  <CommandGroup heading="Выберите регион">
                    {availableRegions.map((region) => {
                      const isSelected = selectedRegion === region.id;
                      return (
                        <CommandItem
                          key={region.id}
                          value={region.name}
                          onSelect={() => handleSelectRegion(region.id)}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                              {isSelected && (
                                <Icon name="Check" className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <Icon name="MapPin" className="h-4 w-4 text-muted-foreground" />
                            <span>{region.name}</span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </TabsContent>

            <TabsContent value="district" className="m-0">
              <Command shouldFilter={true}>
                <CommandInput placeholder="Поиск района..." />
                <CommandList>
                  <CommandEmpty>Район не найден</CommandEmpty>
                  <CommandGroup heading={`Районы: ${selectedRegionData?.name || ''}`}>
                    {districts.map((district) => {
                      const isSelected = selectedDistricts.includes(district.id);
                      return (
                        <CommandItem
                          key={district.id}
                          value={district.name}
                          onSelect={() => handleToggleDistrict(district.id)}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                              {isSelected && (
                                <Icon name="Check" className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <Icon name="MapPin" className="h-4 w-4 text-muted-foreground" />
                            <span>{district.name}</span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
              <div className="border-t p-3 space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllDistricts}
                    className="flex-1 h-7 text-xs"
                  >
                    <Icon name="CheckSquare" className="mr-1 h-3 w-3" />
                    Выбрать все
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearDistricts}
                    className="flex-1 h-7 text-xs"
                  >
                    <Icon name="X" className="mr-1 h-3 w-3" />
                    Сбросить
                  </Button>
                </div>
                {selectedDistricts.length > 0 && (
                  <div className="text-center text-sm text-muted-foreground">
                    Выбрано районов: {selectedDistricts.length}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>

      {showBadges && selectedDistricts.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedDistricts.slice(0, 3).map((districtId) => {
            const district = districts.find(d => d.id === districtId);
            return (
              <Badge
                key={districtId}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80"
                onClick={() => toggleDistrict(districtId)}
              >
                {district?.name}
                <Icon name="X" className="ml-1 h-3 w-3" />
              </Badge>
            );
          })}
          {selectedDistricts.length > 3 && (
            <Badge variant="outline">
              +{selectedDistricts.length - 3} еще
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
