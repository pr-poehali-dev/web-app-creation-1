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

interface ContractRespondVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'not-verified' | 'pending' | 'barter-restricted';
}

export default function ContractRespondVerificationDialog({
  open,
  onOpenChange,
  mode = 'not-verified',
}: ContractRespondVerificationDialogProps) {
  const navigate = useNavigate();

  const config = {
    'not-verified': {
      title: 'Требуется верификация',
      description: 'Откликаться на контракты могут только верифицированные пользователи. Пройдите верификацию, чтобы получить доступ.',
      showVerificationBtn: true,
    },
    'pending': {
      title: 'Верификация на рассмотрении',
      description: 'Ваша верификация находится на рассмотрении. После одобрения вам станет доступен отклик на контракты.',
      showVerificationBtn: false,
    },
    'barter-restricted': {
      title: 'Участие в бартере недоступно',
      description: 'Участвовать в бартерных контрактах могут только верифицированные ИП и юридические лица.',
      showVerificationBtn: false,
    },
  }[mode];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
          {config.showVerificationBtn && (
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
