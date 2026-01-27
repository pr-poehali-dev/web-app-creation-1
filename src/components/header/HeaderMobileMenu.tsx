import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import RegionDistrictSelector from '@/components/RegionDistrictSelector';

interface HeaderMobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  menuRef: React.RefObject<HTMLDivElement>;
}

export default function HeaderMobileMenu({ 
  isOpen, 
  onClose, 
  currentPath,
  menuRef 
}: HeaderMobileMenuProps) {
  if (!isOpen) return null;

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
      <div className="px-4 pt-2">
        <RegionDistrictSelector showBadges={false} />
      </div>
    </div>
  );
}
