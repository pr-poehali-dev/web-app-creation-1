import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed top-0 left-0 w-full h-full z-[9999] md:hidden bg-background flex flex-col"
      style={{ position: 'fixed', inset: 0 }}
    >
      {/* Fixed Header */}
      <div className="shrink-0 bg-background border-b px-4 py-3 flex items-center gap-3 min-h-[56px]">
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

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {selectedRegion === 'all' ? (
          // Region selection view
          <div className="p-4 space-y-3">
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

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground px-2 py-1">Выберите регион</p>
              {availableRegions.map((region) => (
                <button
                  key={region.id}
                  onClick={() => handleSelectRegion(region.id)}
                  className="w-full flex items-center gap-2 px-3 py-3 hover:bg-muted rounded-md transition-colors"
                >
                  <Icon name="MapPin" className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">{region.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // District selection view
          <div className="flex flex-col">
            {/* Region info sticky header */}
            <div className="sticky top-0 z-10 border-b px-4 py-3 bg-background">
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
                  Сбросить регион
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b bg-muted/20">
              <input
                type="text"
                placeholder="Поиск района..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Districts list */}
            <div className="px-4 pb-32">
              <p className="text-sm font-medium text-muted-foreground py-3">
                Районы: {selectedRegionData?.name || ''}
              </p>
              {filteredDistricts.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Район не найден
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredDistricts.map((district) => {
                    const isSelected = selectedDistricts.includes(district.id);
                    const count = districtCounts[district.id] || 0;
                    return (
                      <button
                        key={district.id}
                        onClick={() => handleToggleDistrict(district.id)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-3 hover:bg-muted rounded-md transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 border-2 rounded flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <Icon name="Check" className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <Icon name="MapPin" className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm">{district.name}</span>
                        </div>
                        {count > 0 && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {count}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Footer - only for districts view */}
      {selectedRegion !== 'all' && (
        <div className="shrink-0 border-t p-3 bg-background space-y-2">
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
              Сбросить районы
            </Button>
          </div>

          {selectedDistricts.length > 0 && (
            <div className="text-center text-sm text-muted-foreground py-1">
              Выбрано районов: <span className="font-bold text-foreground">{selectedDistricts.length}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}