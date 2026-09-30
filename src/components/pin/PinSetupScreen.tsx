import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import PinDots from './PinDots';
import PinKeypad from './PinKeypad';
import { setPin as saveSetPin } from '@/utils/pinAuth';

interface PinSetupScreenProps {
  onComplete: () => void;
  embedded?: boolean;
}

export default function PinSetupScreen({ onComplete, embedded }: PinSetupScreenProps) {
  const [stage, setStage] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const reset = useCallback(() => {
    setStage('create');
    setFirstPin('');
    setValue('');
    setError(false);
  }, []);

  const handleDigit = async (digit: string) => {
    if (value.length >= 4 || isSaving) return;
    const next = value + digit;
    setValue(next);

    if (next.length === 4) {
      if (stage === 'create') {
        setTimeout(() => {
          setFirstPin(next);
          setValue('');
          setStage('confirm');
        }, 150);
        return;
      }

      if (next !== firstPin) {
        setError(true);
        toast({ variant: 'destructive', title: 'PIN-коды не совпадают', description: 'Попробуйте ещё раз' });
        setTimeout(() => {
          reset();
        }, 500);
        return;
      }

      setIsSaving(true);
      const result = await saveSetPin(next);
      setIsSaving(false);

      if (!result.success) {
        setError(true);
        toast({ variant: 'destructive', title: 'Ошибка', description: result.error || 'Не удалось сохранить PIN-код' });
        setTimeout(() => reset(), 500);
        return;
      }

      toast({ title: 'Готово', description: 'PIN-код установлен' });
      onComplete();
    }
  };

  const handleBackspace = () => {
    if (isSaving) return;
    setValue((v) => v.slice(0, -1));
  };

  return (
    <div className={embedded ? 'flex flex-col items-center justify-center bg-background px-4 py-8' : 'min-h-screen flex flex-col items-center justify-center bg-background px-4'}>
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Icon name="ShieldCheck" className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">
            {stage === 'create' ? 'Придумайте PIN-код' : 'Повторите PIN-код'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {stage === 'create'
              ? 'Он понадобится для быстрого и защищённого входа в аккаунт'
              : 'Введите те же 4 цифры ещё раз'}
          </p>
        </div>

        <PinDots length={4} filled={value.length} error={error} />

        <PinKeypad onDigit={handleDigit} onBackspace={handleBackspace} disabled={isSaving} />
      </div>
    </div>
  );
}