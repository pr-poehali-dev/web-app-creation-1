import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    if (!email) {
      setEmailError('Введите эл.почту');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Эл.почта введена неправильно');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const existingEmails = ['demo@example.com', 'user@example.com'];
      
      if (existingEmails.includes(email.toLowerCase())) {
        toast({
          title: 'Успешно',
          description: 'Ссылка для восстановления пароля отправлена на вашу почту',
        });
        setTimeout(() => {
          navigate('/new-password');
        }, 2000);
      } else {
        setEmailError('Эл.почта введена неправильно');
      }
      
      setIsSubmitting(false);
    }, 1000);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Icon name="KeyRound" className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Восстановление пароля</CardTitle>
          <CardDescription>
            Введите вашу эл.почту для получения ссылки восстановления пароля
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Эл.почта</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@company.com"
                value={email}
                onChange={handleEmailChange}
                className={emailError ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {emailError && <p className="text-sm text-destructive">{emailError}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                  Отправка...
                </>
              ) : (
                'Восстановить пароль'
              )}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => navigate('/login')}
                disabled={isSubmitting}
              >
                <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
                Вернуться к входу
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}