import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useState } from 'react';

interface District {
  id: string;
  name: string;
}

interface HeaderDistrictsModalProps {
  isOpen: boolean;
  onClose: () => void;
  districts: District[];
  selectedDistricts: string[];
  toggleDistrict: (districtId: string) => void;
  setSelectedDistricts: (districts: string[]) => void;
}

export default function HeaderDistrictsModal({
  isOpen,
  onClose,
  districts,
  selectedDistricts,
  toggleDistrict,
  setSelectedDistricts
}: HeaderDistrictsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredDistricts = districts.filter(district => 
    district.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end" onClick={onClose}>
      <div 
        className="bg-background w-full rounded-t-2xl max-h-[85vh] overflow-hidden flex flex-col safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-background border-b px-4 py-3 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold">Выбор районов</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <Icon name="X" className="h-5 w-5" />
          </Button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-3 overscroll-contain">
          {/* Search */}
          <div className="relative">
            <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Поиск района..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          {/* Selected count */}
          {selectedDistricts.length > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-primary">
                Выбрано: {selectedDistricts.length} {selectedDistricts.length === districts.length ? '(все)' : ''}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDistricts([])}
                className="text-xs h-7"
              >
                Сбросить
              </Button>
            </div>
          )}

          {/* Select all button */}
          <Button
            variant="outline"
            className="w-full justify-start h-11"
            onClick={() => {
              if (selectedDistricts.length === districts.length) {
                setSelectedDistricts([]);
              } else {
                setSelectedDistricts(districts.map(d => d.id));
              }
            }}
          >
            <Icon 
              name={selectedDistricts.length === districts.length ? "CheckSquare" : "Square"} 
              className="h-4 w-4 mr-2" 
            />
            {selectedDistricts.length === districts.length ? 'Отменить все' : 'Выбрать все'}
          </Button>

          {/* Districts list */}
          <div className="space-y-2 pb-2">
            {filteredDistricts.length > 0 ? (
              filteredDistricts.map((district) => {
                const isSelected = selectedDistricts.includes(district.id);
                return (
                  <button
                    key={district.id}
                    onClick={() => toggleDistrict(district.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/40 hover:bg-primary/5'
                    }`}
                  >
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <Icon name="Check" className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <Icon name="MapPin" className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium text-left">{district.name}</span>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="Search" className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Районы не найдены</p>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-background border-t p-4 z-10">
          <Button
            className="w-full h-11"
            onClick={onClose}
          >
            Применить ({selectedDistricts.length})
          </Button>
        </div>
      </div>
    </div>
  );
}