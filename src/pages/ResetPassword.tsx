import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import SupportContact from '@/components/auth/SupportContact';
import funcUrl from '../../backend/func2url.json';

export default function ResetPassword() {
  const [contact, setContact] = useState('');
  const [contactError, setContactError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetMethod, setResetMethod] = useState<'email' | 'telegram'>('telegram');
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateContact = (contact: string, method: 'email' | 'telegram') => {
    if (method === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(contact);
    } else {
      const phoneRegex = /^\+?[0-9]{10,15}$/;
      return phoneRegex.test(contact);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError('');

    if (!contact) {
      setContactError(resetMethod === 'email' ? 'Введите email' : 'Введите телефон');
      return;
    }

    if (!validateContact(contact, resetMethod)) {
      setContactError(resetMethod === 'email' ? 'Email введен неправильно' : 'Телефон введен неправильно');
      return;
    }

    setIsSubmitting(true);

    try {
      if (resetMethod === 'telegram') {
        const response = await fetch(funcUrl['telegram-verify'], {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'reset-password',
            phone: contact,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          toast({
            title: 'Успешно',
            description: 'Ссылка для восстановления пароля отправлена в Telegram',
          });
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          if (response.status === 404) {
            toast({
              variant: 'destructive',
              title: 'Пользователь не найден',
              description: 'Проверьте правильность введённого номера или зарегистрируйтесь',
              duration: 5000,
            });
          } else if (response.status === 400 && data.error?.includes('Telegram not connected')) {
            toast({
              variant: 'destructive',
              title: 'Telegram не подключен',
              description: 'Пожалуйста, свяжитесь с поддержкой для восстановления доступа',
              duration: 5000,
            });
          } else {
            setContactError(data.error || 'Произошла ошибка');
          }
        }
      } else {
        const response = await fetch(funcUrl['reset-password'], {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'request',
            email: contact,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          toast({
            title: 'Успешно',
            description: 'На указанную почту отправлена ссылка для восстановления пароля',
          });
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          if (response.status === 404) {
            toast({
              variant: 'destructive',
              title: 'Пользователь не найден',
              description: 'Проверьте правильность введённых данных или зарегистрируйтесь',
              duration: 5000,
            });
          } else {
            setContactError(data.error || 'Произошла ошибка при отправке письма');
          }
        }
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Произошла ошибка при отправке запроса',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContact(e.target.value);
    setContactError('');
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
              onClick={() => navigate('/')}
              disabled={isSubmitting}
            >
              <Icon name="ArrowLeft" className="h-4 w-4 mr-1" />
              Вернуться на главную
            </Button>
          </div>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Icon name="KeyRound" className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Восстановление пароля</CardTitle>
          <CardDescription>
            Ссылка для восстановления будет отправлена в Telegram или на почту
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={resetMethod === 'telegram' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setResetMethod('telegram'); setContact(''); setContactError(''); }}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  <Icon name="MessageCircle" className="mr-2 h-4 w-4" />
                  Telegram
                </Button>
                <Button
                  type="button"
                  variant={resetMethod === 'email' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setResetMethod('email'); setContact(''); setContactError(''); }}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  <Icon name="Mail" className="mr-2 h-4 w-4" />
                  Email
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">
                  {resetMethod === 'email' ? 'Email' : 'Телефон'}
                </Label>
                <Input
                  id="contact"
                  type="text"
                  placeholder={resetMethod === 'email' ? 'example@company.com' : '+79991234567'}
                  value={contact}
                  onChange={handleContactChange}
                  className={contactError ? 'border-destructive' : ''}
                  disabled={isSubmitting}
                />
                {contactError && <p className="text-sm text-destructive">{contactError}</p>}
              </div>
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

            <div className="space-y-3">
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Вспомнили пароль? </span>
                <Button
                  type="button"
                  variant="link"
                  className="px-1"
                  onClick={() => navigate('/login')}
                  disabled={isSubmitting}
                >
                  Войти
                </Button>
              </div>

              <SupportContact className="pt-2 border-t" />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}