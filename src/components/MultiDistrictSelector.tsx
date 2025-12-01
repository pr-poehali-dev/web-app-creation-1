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
import Icon from '@/components/ui/icon';
import { useDistrict } from '@/contexts/DistrictContext';

interface MultiDistrictSelectorProps {
  className?: string;
  showBadges?: boolean;
}

export default function MultiDistrictSelector({ className = '', showBadges = true }: MultiDistrictSelectorProps) {
  const { selectedDistricts, toggleDistrict, districts, setSelectedDistricts, isDetecting, requestGeolocation } = useDistrict();
  const [open, setOpen] = useState(false);

  const availableDistricts = districts.filter(d => d.id !== 'all');
  const selectedCount = selectedDistricts.length;

  const handleSelectAll = () => {
    setSelectedDistricts([]);
  };

  const handleSelectYakutsk = () => {
    setSelectedDistricts(['yakutsk']);
  };

  const handleSelectAllUluses = () => {
    const ulusDistricts = availableDistricts
      .filter(d => d.id !== 'yakutsk')
      .map(d => d.id);
    setSelectedDistricts(ulusDistricts);
  };

  const handleToggleDistrict = (districtId: string) => {
    toggleDistrict(districtId);
  };

  const handleDetectLocation = async () => {
    await requestGeolocation();
  };

  const getDisplayText = () => {
    if (selectedCount === 0) {
      return 'Все районы';
    }
    if (selectedCount === 1) {
      const district = districts.find(d => d.id === selectedDistricts[0]);
      return district?.name || 'Выбран 1 район';
    }
    return `Выбрано: ${selectedCount} ${selectedCount < 5 ? 'района' : 'районов'}`;
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <Icon name="MapPin" className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{getDisplayText()}</span>
            </div>
            <Icon name="ChevronsUpDown" className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command shouldFilter={true}>
            <CommandInput placeholder="Поиск района..." />
            <CommandList>
              <CommandEmpty>Район не найден</CommandEmpty>
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
                      Определить мой район
                    </>
                  )}
                </Button>
              </CommandGroup>
              <CommandGroup>
                <CommandItem
                  value="all-districts"
                  keywords={['все', 'районы', 'all']}
                  onSelect={() => handleSelectAll()}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-4 h-4 border-2 border-primary rounded flex items-center justify-center">
                      {selectedCount === 0 && (
                        <Icon name="Check" className="h-3 w-3 text-primary" />
                      )}
                    </div>
                    <Icon name="Globe" className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Все районы</span>
                  </div>
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="Выберите районы">
                {availableDistricts.map((district) => {
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
                onClick={handleSelectYakutsk}
                className="flex-1 h-7 text-xs"
              >
                <Icon name="Building2" className="mr-1 h-3 w-3" />
                Только Якутск
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllUluses}
                className="flex-1 h-7 text-xs"
              >
                <Icon name="MapPin" className="mr-1 h-3 w-3" />
                Все улусы
              </Button>
            </div>
            {selectedCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Выбрано: {selectedCount}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-7 text-xs"
                >
                  Сбросить
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {showBadges && selectedCount > 0 && (
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
          {selectedCount > 3 && (
            <Badge variant="outline">
              +{selectedCount - 3} еще
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}