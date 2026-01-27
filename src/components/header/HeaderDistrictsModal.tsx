import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

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
  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 bg-black/50 z-50 flex items-end" onClick={onClose}>
      <div 
        className="bg-background w-full rounded-t-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-background border-b px-4 py-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">Выбор районов</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <Icon name="X" className="h-5 w-5" />
          </Button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-3">
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
            className="w-full justify-start"
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
          <div className="space-y-2">
            {districts.map((district) => {
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
            })}
          </div>
        </div>

        <div className="sticky bottom-0 bg-background border-t p-4">
          <Button
            className="w-full"
            onClick={onClose}
          >
            Применить
          </Button>
        </div>
      </div>
    </div>
  );
}
