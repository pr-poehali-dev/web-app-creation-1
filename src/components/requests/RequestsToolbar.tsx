import { useNavigate } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface RequestsToolbarProps {
  isAuthenticated: boolean;
}

export default function RequestsToolbar({ isAuthenticated }: RequestsToolbarProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-3">
      <div className="justify-self-start"><BackButton className="!mb-0" /></div>
      <h1 className="text-lg md:text-2xl font-bold text-foreground text-center">Запросы</h1>
      {isAuthenticated ? (
        <Button onClick={() => navigate('/create-request')} className="flex items-center gap-2 whitespace-nowrap justify-self-end">
          <Icon name="Plus" className="h-4 w-4" />
          <span>Создать запрос</span>
        </Button>
      ) : <div />}
    </div>
  );
}
