import { useState } from 'react';
import Icon from '@/components/ui/icon';
import PinDots from './PinDots';
import PinKeypad from './PinKeypad';
import { verifyPin } from '@/utils/pinAuth';

interface PinLockScreenProps {
  userName?: string;
  onSuccess: () => void;
  onForgotPin: () => void;
}

export default function PinLockScreen({ userName, onSuccess, onForgotPin }: PinLockScreenProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [message, setMessage] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleDigit = async (digit: string) => {
    if (value.length >= 4 || isChecking) return;
    const next = value + digit;
    setValue(next);
    setError(false);

    if (next.length === 4) {
      setIsChecking(true);
      const result = await verifyPin(next);
      setIsChecking(false);

      if (!result.success) {
        setError(true);
        if (result.locked_until) {
          setMessage('Слишком много попыток. Попробуйте позже');
        } else if (typeof result.attempts_left === 'number') {
          setMessage(`Неверный PIN-код. Осталось попыток: ${result.attempts_left}`);
        } else {
          setMessage('Неверный PIN-код');
        }
        setTimeout(() => {
          setValue('');
          setError(false);
        }, 500);
        return;
      }

      onSuccess();
    }
  };

  const handleBackspace = () => {
    if (isChecking) return;
    setValue((v) => v.slice(0, -1));
    setMessage('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Icon name="Lock" className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Введите PIN-код</h1>
          {userName && <p className="text-sm text-muted-foreground">{userName}</p>}
          {message && <p className="text-sm text-destructive">{message}</p>}
        </div>

        <PinDots length={4} filled={value.length} error={error} />

        <PinKeypad onDigit={handleDigit} onBackspace={handleBackspace} disabled={isChecking} />

        <button
          onClick={onForgotPin}
          className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
        >
          Забыли PIN-код?
        </button>
      </div>
    </div>
  );
}
