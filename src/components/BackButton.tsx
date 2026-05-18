import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface BackButtonProps {
  className?: string;
  fallbackUrl?: string;
}

export default function BackButton({ className = '', fallbackUrl = '/predlozheniya' }: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackUrl);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={`flex items-center gap-2 mb-4 ${className}`}
    >
      <Icon name="ArrowLeft" className="h-4 w-4" />
      <span>Назад</span>
    </Button>
  );
}