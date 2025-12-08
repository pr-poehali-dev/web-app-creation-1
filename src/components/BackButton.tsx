import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface BackButtonProps {
  className?: string;
}

export default function BackButton({ className = '' }: BackButtonProps) {
  const navigate = useNavigate();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate(-1)}
      className={`flex items-center gap-2 mb-4 ${className}`}
    >
      <Icon name="ArrowLeft" className="h-4 w-4" />
      <span>Назад</span>
    </Button>
  );
}