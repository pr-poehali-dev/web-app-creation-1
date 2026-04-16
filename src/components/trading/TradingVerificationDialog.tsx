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
  mode?: 'not-verified' | 'restricted-type';
}

export default function TradingVerificationDialog({
  open,
  onOpenChange,
  mode = 'not-verified',
}: TradingVerificationDialogProps) {
  const navigate = useNavigate();

  const isRestricted = mode === 'restricted-type';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isRestricted ? 'Создание контрактов недоступно' : 'Требуется верификация'}
          </DialogTitle>
          <DialogDescription>
            {isRestricted
              ? 'Создавать форвардные и бартерные контракты могут только верифицированные ИП и юридические лица. Вы можете откликаться на уже опубликованные контракты.'
              : 'Создавать контракты могут только верифицированные ИП и юридические лица. Пройдите верификацию, чтобы получить доступ.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
          {!isRestricted && (
            <Button
              onClick={() => {
                onOpenChange(false);
                navigate('/verification');
              }}
            >
              Верификация
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
