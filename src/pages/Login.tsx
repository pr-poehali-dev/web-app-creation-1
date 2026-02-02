import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import SupportContact from '@/components/auth/SupportContact';
import { authenticateUser, saveRememberMe, getRememberMe, clearRememberMe } from '@/utils/auth';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const savedCredentials = getRememberMe();
    if (savedCredentials) {
      setEmail(savedCredentials.email);
      setRememberMe(true);
    }
  }, []);



  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    setIsLoading(true);
    
    toast({
      title: 'Подключение к серверу...',
      description: 'Пожалуйста, подождите. Первый вход может занять до 10 секунд.',
    });

    try {
      const result = await authenticateUser(email, password);
      
      if (result.success && result.user) {
        if (rememberMe) {
          saveRememberMe(email, password);
        } else {
          clearRememberMe();
        }
        
        onLogin();
        
        toast({
          title: 'Успешно',
          description: `Добро пожаловать, ${result.user.firstName} ${result.user.lastName}!`,
          duration: 1000,
        });
        
        setTimeout(() => {
          navigate('/');
        }, 100);
      } else {
        setIsLoading(false);
        toast({
          variant: 'destructive',
          title: 'Ошибка входа',
          description: result.error || 'Неверный email или пароль',
        });
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Login error:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Произошла ошибка при входе. Попробуйте снова.',
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
          <div className="flex items-center gap-2 mb-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              disabled={isLoading}
            >
              <Icon name="ArrowLeft" className="h-4 w-4 mr-1" />
              Вернуться на главную
            </Button>
          </div>
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
                <Label 
                  htmlFor="remember" 
                  className="text-sm font-normal cursor-pointer"
                >
                  Запомнить меня
                </Label>
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

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                  Вход...
                </>
              ) : (
                'Войти'
              )}
            </Button>

            <div className="space-y-3">
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

              <SupportContact className="pt-2 border-t" />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}