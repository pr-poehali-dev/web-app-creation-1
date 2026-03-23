import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface TradingVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TradingVerificationDialog({
  open,
  onOpenChange,
}: TradingVerificationDialogProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Требуется верификация</DialogTitle>
          <DialogDescription>
            Для создания контрактов необходимо пройти верификацию. Это позволяет подтвердить
            вашу надежность как участника торговой площадки.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              navigate('/verification');
            }}
          >
            Пройти верификацию
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
