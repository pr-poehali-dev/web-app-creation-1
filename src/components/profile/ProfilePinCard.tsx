import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import PinSetupScreen from '@/components/pin/PinSetupScreen';
import { clearPin } from '@/utils/pinAuth';

interface ProfilePinCardProps {
  hasPin: boolean;
  onPinChange: (hasPin: boolean) => void;
}

export default function ProfilePinCard({ hasPin, onPinChange }: ProfilePinCardProps) {
  const [showSetup, setShowSetup] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const { toast } = useToast();

  const handleSetupComplete = () => {
    setShowSetup(false);
    onPinChange(true);
  };

  const handleRemovePin = async () => {
    setIsRemoving(true);
    const result = await clearPin();
    setIsRemoving(false);
    if (result.success) {
      onPinChange(false);
      toast({ title: 'PIN-код удалён' });
    } else {
      toast({ variant: 'destructive', title: 'Ошибка', description: result.error || 'Не удалось удалить PIN-код' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>PIN-код для входа</CardTitle>
        <CardDescription>Быстрый и защищённый вход в аккаунт по 4 цифрам</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Icon name="ShieldCheck" className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{hasPin ? 'PIN-код установлен' : 'PIN-код не установлен'}</p>
              <p className="text-sm text-muted-foreground">
                {hasPin ? 'Защищает вход в аккаунт с этого устройства' : 'Создайте PIN для быстрого входа'}
              </p>
            </div>
          </div>
          {hasPin ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowSetup(true)}>
                Изменить
              </Button>
              <Button variant="outline" size="sm" onClick={handleRemovePin} disabled={isRemoving}>
                {isRemoving ? <Icon name="Loader2" className="h-4 w-4 animate-spin" /> : 'Удалить'}
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setShowSetup(true)}>
              Создать PIN
            </Button>
          )}
        </div>
      </CardContent>

      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="p-0 sm:max-w-sm">
          <DialogHeader className="sr-only">
            <DialogTitle>Настройка PIN-кода</DialogTitle>
          </DialogHeader>
          <PinSetupScreen onComplete={handleSetupComplete} embedded />
        </DialogContent>
      </Dialog>
    </Card>
  );
}