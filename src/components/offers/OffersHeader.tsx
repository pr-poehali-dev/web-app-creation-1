import { useNavigate } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface OffersHeaderProps {
  isAuthenticated: boolean;
}

function OffersHeader({ isAuthenticated }: OffersHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 mb-3">
      <div className="justify-self-start"><BackButton className="!mb-0" /></div>
      <h1 className="text-base md:text-2xl font-bold text-foreground text-center">Предложения</h1>
      {isAuthenticated ? (
        <Button onClick={() => navigate('/create-offer')} size="sm" className="flex items-center gap-1 md:gap-2 whitespace-nowrap justify-self-end px-2.5 md:px-4 md:h-10">
          <Icon name="Plus" className="h-4 w-4" />
          <span className="md:hidden">Создать</span>
          <span className="hidden md:inline">Создать предложение</span>
        </Button>
      ) : <div />}
    </div>
  );
}

export default OffersHeader;
