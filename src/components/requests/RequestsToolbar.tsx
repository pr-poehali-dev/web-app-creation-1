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
    <div className="flex items-center justify-between gap-2 mb-4">
      <BackButton />
      {isAuthenticated && (
        <Button onClick={() => navigate('/create-request')} className="flex items-center gap-2 whitespace-nowrap">
          <Icon name="Plus" className="h-4 w-4" />
          <span>Создать запрос</span>
        </Button>
      )}
    </div>
  );
}
