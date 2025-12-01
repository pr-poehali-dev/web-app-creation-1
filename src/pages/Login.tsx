import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { authenticateUser, saveSession } from '@/utils/auth';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('lastLoginEmail') || '';
  });
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('rememberMe') === 'true';
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const credentials = localStorage.getItem('rememberMeCredentials');
    if (credentials && rememberMe) {
      try {
        const { email: savedEmail, password: savedPassword } = JSON.parse(credentials);
        const user = authenticateUser(savedEmail, savedPassword);
        
        if (user) {
          saveSession(user);
          onLogin();
          navigate('/');
          toast({
            title: 'Успешно',
            description: `Добро пожаловать, ${user.firstName} ${user.lastName}!`,
          });
        } else {
          localStorage.removeItem('rememberMeCredentials');
        }
      } catch (error) {
        console.error('Auto-login failed:', error);
        localStorage.removeItem('rememberMeCredentials');
      }
    }
  }, []);

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
      localStorage.setItem('lastLoginEmail', email);
      localStorage.setItem('rememberMe', rememberMe.toString());
      
      if (rememberMe) {
        localStorage.setItem('rememberMeCredentials', JSON.stringify({ email, password }));
      } else {
        localStorage.removeItem('rememberMeCredentials');
      }
      
      saveSession(user);
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
                name="email"
                type="email"
                placeholder="example@company.com"
                value={email}
                onChange={handleEmailChange}
                autoComplete="email"
                className={emailError ? 'border-destructive' : ''}
              />
              {emailError && <p className="text-sm text-destructive">{emailError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  <Icon name={showPassword ? 'EyeOff' : 'Eye'} className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Запомнить меня
                </label>
              </div>
              <Button
                type="button"
                variant="link"
                className="px-0 text-sm h-auto"
                onClick={() => navigate('/reset-password')}
              >
                Забыли пароль?
              </Button>
            </div>

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