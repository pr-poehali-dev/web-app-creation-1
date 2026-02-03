import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import funcUrl from '../../backend/func2url.json';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [contact, setContact] = useState('');
  const [contactError, setContactError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetMethod, setResetMethod] = useState<'email' | 'telegram'>('email');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!newPassword || !confirmPassword) {
      setPasswordError('Заполните все поля');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Пароль должен содержать минимум 6 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Пароли не совпадают');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(funcUrl['reset-password'], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reset',
          token: token,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Пароль успешно изменён',
        });
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setPasswordError(data.error || 'Не удалось изменить пароль');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Произошла ошибка при смене пароля',
      });
    } finally {
      setIsSubmitting(false);
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

  const formatPhoneNumber = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    
    if (digitsOnly.length === 0) return '';
    
    if (digitsOnly.startsWith('8') && digitsOnly.length >= 1) {
      const normalized = '7' + digitsOnly.slice(1);
      return formatWithMask(normalized);
    }
    
    if (digitsOnly.startsWith('7')) {
      return formatWithMask(digitsOnly);
    }
    
    if (!digitsOnly.startsWith('7') && !digitsOnly.startsWith('8')) {
      return formatWithMask('7' + digitsOnly);
    }
    
    return formatWithMask(digitsOnly);
  };

  const formatWithMask = (digits: string) => {
    if (digits.length === 0) return '';
    
    let formatted = '+7';
    
    if (digits.length > 1) {
      formatted += ' (' + digits.substring(1, Math.min(4, digits.length));
    }
    if (digits.length >= 4) {
      formatted += ') ' + digits.substring(4, Math.min(7, digits.length));
    }
    if (digits.length >= 7) {
      formatted += '-' + digits.substring(7, Math.min(9, digits.length));
    }
    if (digits.length >= 9) {
      formatted += '-' + digits.substring(9, 11);
    }
    
    return formatted;
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (resetMethod === 'email') {
      setContact(value);
    } else {
      const formatted = formatPhoneNumber(value);
      setContact(formatted);
    }
    
    setContactError('');
  };

  if (token) {
    return (
      <div className="flex min-h-screen items-start justify-center bg-background px-4 pt-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
                disabled={isSubmitting}
              >
                <Icon name="ArrowLeft" className="h-4 w-4 mr-1" />
                Вернуться к входу
              </Button>
            </div>
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Icon name="KeyRound" className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold">Новый пароль</CardTitle>
            <CardDescription className="text-sm">
              Минимум 6 символов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-3" autoComplete="off">
              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-sm">Новый пароль</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Минимум 6 символов"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                    className={passwordError ? 'border-destructive pr-10 h-10' : 'pr-10 h-10'}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isSubmitting}
                  >
                    <Icon name={showNewPassword ? 'EyeOff' : 'Eye'} className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm">Подтвердите пароль</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Повторите пароль"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                    className={passwordError ? 'border-destructive pr-10 h-10' : 'pr-10 h-10'}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isSubmitting}
                  >
                    <Icon name={showConfirmPassword ? 'EyeOff' : 'Eye'} className="h-4 w-4" />
                  </button>
                </div>
                {passwordError && <p className="text-xs text-destructive mt-1">{passwordError}</p>}
              </div>

              <Button type="submit" className="w-full h-10 mt-4" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                    Изменение...
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
                  variant={resetMethod === 'email' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setResetMethod('email'); setContact(''); setContactError(''); }}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  <Icon name="Mail" className="mr-2 h-4 w-4" />
                  Email
                </Button>
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

            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}