import { Link, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface District {
  id: string;
  name: string;
}

interface HeaderMobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  menuRef: React.RefObject<HTMLDivElement>;
  districts: District[];
  selectedDistricts: string[];
  onOpenDistrictsModal: () => void;
  onResetDistricts: () => void;
}

export default function HeaderMobileMenu({ 
  isOpen, 
  onClose, 
  currentPath,
  menuRef,
  districts,
  selectedDistricts,
  onOpenDistrictsModal,
  onResetDistricts
}: HeaderMobileMenuProps) {
  const location = useLocation();

  if (!isOpen) return null;

  const shouldShowDistricts = () => {
    const hiddenPaths = ['/', '/support'];
    return !hiddenPaths.includes(location.pathname);
  };

  return (
    <div 
      ref={menuRef}
      className="md:hidden border-t py-4 space-y-2 touch-pan-y"
    >
      <Link
        to="/predlozheniya"
        className="block mx-4 px-3 py-2 text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary rounded-md border-2 border-primary/20 hover:border-primary/40 transition-colors"
        onClick={onClose}
      >
        Предложения
      </Link>
      <Link
        to="/zaprosy"
        className="block mx-4 px-3 py-2 text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary rounded-md border-2 border-primary/20 hover:border-primary/40 transition-colors"
        onClick={onClose}
      >
        Запросы
      </Link>
      <Link
        to="/auction"
        className="block mx-4 px-3 py-2 text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary rounded-md border-2 border-primary/20 hover:border-primary/40 transition-colors"
        onClick={onClose}
      >
        Аукционы
      </Link>
      <Link
        to="/trading"
        className="block mx-4 px-3 py-2 text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary rounded-md border-2 border-primary/20 hover:border-primary/40 transition-colors"
        onClick={onClose}
      >
        <span className="flex items-center gap-2">
          Контракты
          <Badge variant="secondary" className="text-xs">Новое</Badge>
        </span>
      </Link>
      <Link
        to="/support"
        className="block mx-4 px-3 py-2 text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary rounded-md border-2 border-primary/20 hover:border-primary/40 transition-colors"
        onClick={onClose}
      >
        Поддержка
      </Link>
      
      {shouldShowDistricts() && (
        <div className="mx-4 mt-4 pt-4 border-t space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground">Районы</h4>
            {selectedDistricts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetDistricts}
                className="h-7 text-xs text-muted-foreground hover:text-destructive"
              >
                <Icon name="X" className="h-3 w-3 mr-1" />
                Сбросить
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            className="w-full justify-between h-11"
            onClick={onOpenDistrictsModal}
          >
            <span className="flex items-center gap-2">
              <Icon name="MapPin" className="h-4 w-4" />
              {selectedDistricts.length === 0 
                ? 'Выбрать районы' 
                : selectedDistricts.length === districts.length
                  ? 'Выбраны все районы'
                  : `Выбрано: ${selectedDistricts.length}`
              }
            </span>
            <Icon name="ChevronRight" className="h-4 w-4" />
          </Button>

          {selectedDistricts.length > 0 && selectedDistricts.length < districts.length && (
            <div className="flex flex-wrap gap-2">
              {selectedDistricts.slice(0, 5).map((districtId) => {
                const district = districts.find(d => d.id === districtId);
                return (
                  <Badge
                    key={districtId}
                    variant="secondary"
                    className="text-xs"
                  >
                    {district?.name}
                  </Badge>
                );
              })}
              {selectedDistricts.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{selectedDistricts.length - 5} ещё
                </Badge>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}