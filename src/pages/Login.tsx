import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { authenticateUser, saveRememberMe, getRememberMe, clearRememberMe } from '@/utils/auth';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const savedCredentials = getRememberMe();
    if (savedCredentials) {
      setLogin(savedCredentials.email);
      setRememberMe(true);
    }
  }, []);



  const validateLogin = (login: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const digitsOnly = login.replace(/\D/g, '');
    const isPhone = digitsOnly.length >= 10 && digitsOnly.length <= 15;
    return emailRegex.test(login) || isPhone;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!login) {
      setLoginError('Введите телефон или email');
      return;
    }

    if (!validateLogin(login)) {
      setLoginError('Некорректный формат телефона или email');
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
      const result = await authenticateUser(login, password);
      
      if (result.success && result.user) {
        if (rememberMe) {
          saveRememberMe(login, password);
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

  const formatPhoneNumber = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    
    if (digitsOnly.length === 0) return '';
    
    let normalizedDigits = digitsOnly;
    if (digitsOnly.startsWith('8') && digitsOnly.length >= 1) {
      normalizedDigits = '7' + digitsOnly.slice(1);
    } else if (!digitsOnly.startsWith('7') && !digitsOnly.startsWith('8')) {
      normalizedDigits = '7' + digitsOnly;
    }
    
    return formatWithMask(normalizedDigits);
  };

  const formatWithMask = (digits: string) => {
    if (digits.length === 0) return '';
    if (digits.length === 1 && digits === '7') return '';
    
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

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    console.log('🔍 Login input changed:', { value, length: value.length });
    
    // Если поле полностью пустое
    if (value === '') {
      console.log('✅ Empty value - clearing field');
      setLogin('');
      setLoginError('');
      return;
    }
    
    // Если это email или содержит буквы - не форматируем
    if (value.includes('@') || /[a-zA-Z]/.test(value)) {
      console.log('📧 Email or text detected');
      setLogin(value);
      setLoginError('');
      return;
    }
    
    // Форматируем телефон
    const formatted = formatPhoneNumber(value);
    console.log('📱 Formatted phone:', { input: value, output: formatted });
    
    // Если после форматирования получилась пустая строка - очищаем поле
    if (formatted === '') {
      console.log('✅ Formatted result empty - clearing field');
      setLogin('');
    } else {
      setLogin(formatted);
    }
    
    setLoginError('');
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
              <Label htmlFor="login">Телефон или Email</Label>
              <Input
                id="login"
                name="login"
                type="text"
                placeholder="+79991234567 или example@company.com"
                value={login}
                onChange={handleLoginChange}
                autoComplete="username"
                className={loginError ? 'border-destructive' : ''}
              />
              {loginError && <p className="text-sm text-destructive">{loginError}</p>}
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