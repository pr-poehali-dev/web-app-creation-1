import { useState, useMemo } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');

  const availableRegions = regions.filter(r => r.id !== 'all');
  const selectedRegionData = regions.find(r => r.id === selectedRegion);

  const handleSelectRegion = (regionId: string) => {
    setSelectedRegion(regionId);
    if (regionId === 'all') {
      setSelectedDistricts([]);
    }
  };

  const filteredDistricts = useMemo(() => {
    let result = districts;
    
    if (searchQuery) {
      result = districts.filter(d => 
        d.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return result.sort((a, b) => {
      const aSelected = selectedDistricts.includes(a.id);
      const bSelected = selectedDistricts.includes(b.id);
      
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [districts, searchQuery, selectedDistricts]);

  const districtCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    districts.forEach(district => {
      counts[district.id] = 0;
    });
    
    return counts;
  }, [districts]);

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
  };

  const getDisplayText = () => {
    if (selectedRegion === 'all') {
      return 'Все регионы';
    }
    
    if (selectedDistricts.length > 1) {
      return `+${selectedDistricts.length - 1}`;
    }
    
    return selectedRegionData?.name || 'Выбран регион';
  };

  const getSubtitleText = () => {
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
            className="w-full justify-between h-auto py-1 px-2 group"
          >
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <Icon name="MapPin" className="h-3 w-3 text-muted-foreground group-hover:text-white shrink-0" />
              <div className="flex flex-col items-start min-w-0 gap-0">
                <span className="truncate text-[10px] leading-tight font-medium group-hover:text-white">{getDisplayText()}</span>
                {getSubtitleText() && (
                  <span className="text-[10px] leading-tight font-bold text-foreground group-hover:text-white truncate w-full">{getSubtitleText()}</span>
                )}
              </div>
            </div>
            <Icon name="ChevronsUpDown" className="ml-1.5 h-3.5 w-3.5 shrink-0 opacity-50 group-hover:text-white" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0 flex flex-col max-h-[600px]" align="start">
          {selectedRegion === 'all' ? (
            <div className="p-4">
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
                  <CommandGroup heading="Выберите регион">
                    {availableRegions.map((region) => {
                      return (
                        <CommandItem
                          key={region.id}
                          value={region.name}
                          onSelect={() => handleSelectRegion(region.id)}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <Icon name="MapPin" className="h-4 w-4 text-muted-foreground" />
                            <span>{region.name}</span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          ) : (
            <>
              <div className="border-b px-3 py-2 bg-muted/50 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedRegionData?.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelectRegion('all')}
                    className="h-6 text-xs"
                  >
                    <Icon name="X" className="h-3 w-3 mr-1" />
                    Сбросить
                  </Button>
                </div>
              </div>
              <div className="border-b shrink-0">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Поиск района..." 
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                </Command>
              </div>
              <div className="overflow-y-auto flex-1 min-h-0">
                <Command shouldFilter={false}>
                  <CommandList>
                    {filteredDistricts.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        Район не найден
                      </div>
                    ) : (
                      <CommandGroup heading={`Районы: ${selectedRegionData?.name || ''}`}>
                        {filteredDistricts.map((district) => {
                          const isSelected = selectedDistricts.includes(district.id);
                          const count = districtCounts[district.id] || 0;
                          return (
                            <CommandItem
                              key={district.id}
                              value={district.name}
                              onSelect={() => handleToggleDistrict(district.id)}
                            >
                              <div className="flex items-center justify-between gap-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                                    {isSelected && (
                                      <Icon name="Check" className="h-3 w-3 text-white" />
                                    )}
                                  </div>
                                  <Icon name="MapPin" className="h-4 w-4 text-muted-foreground" />
                                  <span>{district.name}</span>
                                </div>
                                {count > 0 && (
                                  <Badge variant="secondary" className="ml-auto text-xs">
                                    {count}
                                  </Badge>
                                )}
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </div>
              <div className="border-t p-3 space-y-2 shrink-0">
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
            </>
          )}
        </PopoverContent>
      </Popover>

      {showBadges && selectedDistricts.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedDistricts.length === districts.length && districts.length > 0 ? (
            <Badge
              variant="default"
              className="cursor-pointer hover:bg-primary/80 transition-colors"
              onClick={() => setSelectedDistricts([])}
            >
              Выбраны все районы
              <Icon name="X" className="ml-1 h-3 w-3" />
            </Badge>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}