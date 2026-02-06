import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';

export default function EditRequestHeader() {
  const navigate = useNavigate();

  return (
    <div className="mb-6">
      <Button variant="ghost" size="sm" onClick={() => {
        localStorage.setItem('requests_updated', 'true');
        navigate('/zaprosy');
      }}>
        <Icon name="ArrowLeft" className="w-5 h-5 mr-2" />
        Назад
      </Button>
    </div>
  );
}
