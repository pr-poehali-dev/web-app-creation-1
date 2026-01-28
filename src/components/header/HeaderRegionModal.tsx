import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useDistrict } from '@/contexts/DistrictContext';

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

  if (!isOpen) return null;

  const availableRegions = regions.filter(r => r.id !== 'all');
  const selectedRegionData = regions.find(r => r.id === selectedRegion);

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

  const isAllSelected = selectedDistricts.length === districts.length && districts.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end" onClick={onClose}>
      <div 
        className="bg-background w-full rounded-t-2xl max-h-[80vh] overflow-hidden flex flex-col safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b px-4 py-3 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold">
            {selectedRegion === 'all' ? 'Выбор региона' : 'Выбор районов'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-md transition-colors"
          >
            <Icon name="X" className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {selectedRegion === 'all' ? (
            // Region selection view
            <div className="p-4 space-y-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDetectLocation}
                disabled={isDetecting}
                className="w-full justify-start h-11"
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

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-muted-foreground px-2">Выберите регион</h4>
                {availableRegions.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => handleSelectRegion(region.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
                  >
                    <Icon name="MapPin" className="h-5 w-5 text-muted-foreground shrink-0" />
                    <span className="font-medium">{region.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // District selection view
            <div className="flex flex-col h-full">
              {/* Region header with reset */}
              <div className="border-b px-4 py-3 bg-muted/50 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold">
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
                  className="h-8 text-xs"
                >
                  <Icon name="X" className="h-3 w-3 mr-1" />
                  Сбросить
                </Button>
              </div>

              {/* Search */}
              <div className="p-4 border-b">
                <div className="relative">
                  <Icon name="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Поиск района..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Districts list */}
              <div className="flex-1 overflow-y-auto p-4">
                {filteredDistricts.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Район не найден
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-muted-foreground px-2 mb-3">
                      Районы: {selectedRegionData?.name || ''}
                    </div>
                    {filteredDistricts.map((district) => {
                      const isSelected = selectedDistricts.includes(district.id);
                      return (
                        <button
                          key={district.id}
                          onClick={() => handleToggleDistrict(district.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary/10' 
                              : 'border-primary/20 hover:border-primary/40 hover:bg-primary/5'
                          }`}
                        >
                          <div className={`w-5 h-5 border-2 rounded flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <Icon name="Check" className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <Icon name="MapPin" className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium text-left flex-1">{district.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="border-t p-4 bg-background space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllDistricts}
                    disabled={isAllSelected}
                    className="flex-1 mr-2"
                  >
                    <Icon name="CheckSquare" className="h-4 w-4 mr-2" />
                    Выбрать все
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearDistricts}
                    disabled={selectedDistricts.length === 0}
                    className="flex-1 ml-2"
                  >
                    <Icon name="X" className="h-4 w-4 mr-2" />
                    Сбросить
                  </Button>
                </div>

                {selectedDistricts.length > 0 && (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Icon name="MapPin" className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      Выбрано районов: {selectedDistricts.length}
                    </span>
                  </div>
                )}

                <Button
                  onClick={onClose}
                  className="w-full"
                  size="lg"
                >
                  Применить
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
