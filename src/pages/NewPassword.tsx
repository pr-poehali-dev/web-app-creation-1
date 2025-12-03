import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

export default function NewPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const validatePassword = (password: string): { isValid: boolean; error: string } => {
    if (password.length < 6) {
      return { isValid: false, error: 'Минимум 6 символов' };
    }
    if (!/[A-ZА-ЯЁ]/.test(password)) {
      return { isValid: false, error: 'Должна быть хотя бы одна заглавная буква' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { isValid: false, error: 'Должен быть спец символ' };
    }
    return { isValid: true, error: '' };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNewPasswordError('');
    setConfirmPasswordError('');

    if (!newPassword) {
      setNewPasswordError('Введите новый пароль');
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setNewPasswordError(validation.error);
      return;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Повторите пароль');
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Пароли не совпадают');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      toast({
        title: 'Успешно',
        description: 'Пароль успешно изменен. Войдите с новым паролем',
      });
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    }, 1000);
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
    setNewPasswordError('');
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setConfirmPasswordError('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center gap-2 mb-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate('/reset-password')}
              disabled={isSubmitting}
            >
              <Icon name="ArrowLeft" className="h-4 w-4 mr-1" />
              Назад
            </Button>
          </div>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Icon name="ShieldCheck" className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Новый пароль</CardTitle>
          <CardDescription>
            Создайте новый пароль для вашего аккаунта
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Новый пароль</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Введите новый пароль"
                value={newPassword}
                onChange={handleNewPasswordChange}
                className={newPasswordError ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {newPasswordError && <p className="text-sm text-destructive">{newPasswordError}</p>}
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="flex items-center gap-1">
                  <Icon name="Check" className="h-3 w-3" />
                  Минимум 6 символов
                </p>
                <p className="flex items-center gap-1">
                  <Icon name="Check" className="h-3 w-3" />
                  Одна заглавная буква
                </p>
                <p className="flex items-center gap-1">
                  <Icon name="Check" className="h-3 w-3" />
                  Один спец символ (!@#$%^&*)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Повторите пароль</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Повторите новый пароль"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className={confirmPasswordError ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {confirmPasswordError && (
                <p className="text-sm text-destructive">{confirmPasswordError}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                'Изменить пароль'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}