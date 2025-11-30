import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { authenticateUser } from '@/utils/auth';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setEmailError('Введите email');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Некорректный формат email');
      return;
    }

    if (!password) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Введите пароль',
      });
      return;
    }

    const user = authenticateUser(email, password);
    
    if (user) {
      onLogin();
      navigate('/');
      toast({
        title: 'Успешно',
        description: `Добро пожаловать, ${user.firstName} ${user.lastName}!`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Email или пароль введены некорректно',
      });
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Icon name="Lock" className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Вход в систему</CardTitle>
          <CardDescription>Введите ваши учетные данные для входа</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@company.com"
                value={email}
                onChange={handleEmailChange}
                className={emailError ? 'border-destructive' : ''}
              />
              {emailError && <p className="text-sm text-destructive">{emailError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="button"
              variant="link"
              className="px-0 text-sm"
              onClick={() => navigate('/reset-password')}
            >
              Забыли пароль?
            </Button>

            <Button type="submit" className="w-full">
              Войти
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Нет аккаунта? </span>
              <Button
                type="button"
                variant="link"
                className="px-1"
                onClick={() => navigate('/register')}
              >
                Зарегистрироваться
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}