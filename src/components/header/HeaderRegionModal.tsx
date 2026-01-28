import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useDistrict } from '@/contexts/DistrictContext';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface HeaderRegionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HeaderRegionModal({ isOpen, onClose }: HeaderRegionModalProps) {
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
  
  const [searchQuery, setSearchQuery] = useState('');

  const availableRegions = useMemo(() => regions.filter(r => r.id !== 'all'), [regions]);
  const selectedRegionData = useMemo(() => regions.find(r => r.id === selectedRegion), [regions, selectedRegion]);

  const handleSelectRegion = (regionId: string) => {
    setSelectedRegion(regionId);
    if (regionId === 'all') {
      setSelectedDistricts([]);
    }
  };

  const filteredDistricts = useMemo(() => {
    if (!searchQuery) return districts;
    return districts.filter(d => 
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [districts, searchQuery]);

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

  const districtCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    districts.forEach(district => {
      counts[district.id] = 0;
    });
    return counts;
  }, [districts]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] md:hidden bg-background">
      <div className="h-full w-full flex flex-col">
        {/* Header */}
        <div className="bg-background border-b px-4 py-3 flex items-center gap-3 safe-top">
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
          >
            <Icon name="ArrowLeft" className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-bold flex-1">
            {selectedRegion === 'all' ? 'Выбор региона' : 'Выбор районов'}
          </h3>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {selectedRegion === 'all' ? (
            // Region selection view
            <div className="p-4">
              <Command shouldFilter={true} className="border rounded-lg">
                <CommandInput placeholder="Поиск региона..." />
                <CommandList className="max-h-none">
                  <CommandEmpty>Регион не найден</CommandEmpty>
                  <CommandGroup>
                    <div className="p-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDetectLocation}
                        disabled={isDetecting}
                        className="w-full justify-start h-10"
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
                    </div>
                  </CommandGroup>
                  <CommandGroup heading="Выберите регион">
                    {availableRegions.map((region) => (
                      <CommandItem
                        key={region.id}
                        value={region.name}
                        onSelect={() => handleSelectRegion(region.id)}
                        className="py-3"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <Icon name="MapPin" className="h-4 w-4 text-muted-foreground" />
                          <span>{region.name}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          ) : (
            // District selection view
            <div className="flex flex-col pb-24">
              {/* Region header with reset */}
              <div className="border-b px-4 py-3 bg-muted/50 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      {selectedRegionData?.name}
                    </span>
                    {detectedCity && detectedCity !== 'Не определен' && (
                      <span className="text-xs text-muted-foreground">
                        {detectedCity}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelectRegion('all')}
                    className="h-7 text-xs"
                  >
                    <Icon name="X" className="h-3 w-3 mr-1" />
                    Сбросить
                  </Button>
                </div>
              </div>

              {/* Districts with search */}
              <div className="p-4">
                <Command shouldFilter={false} className="border rounded-lg">
                  <CommandInput 
                    placeholder="Поиск района..." 
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList className="max-h-none">
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
                                  <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                                    isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                                  }`}>
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

              {/* Actions footer - fixed at bottom */}
              <div className="fixed bottom-0 left-0 right-0 border-t p-3 bg-background space-y-2 safe-bottom z-20">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllDistricts}
                    className="flex-1 h-9 text-xs"
                  >
                    <Icon name="CheckSquare" className="mr-1 h-3 w-3" />
                    Выбрать все
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearDistricts}
                    className="flex-1 h-9 text-xs"
                  >
                    <Icon name="X" className="mr-1 h-3 w-3" />
                    Сбросить
                  </Button>
                </div>

                {selectedDistricts.length > 0 && (
                  <div className="text-center text-sm text-muted-foreground py-1">
                    Выбрано районов: <span className="font-bold text-foreground">{selectedDistricts.length}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}