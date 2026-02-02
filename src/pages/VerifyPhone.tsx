import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import func2url from '../../backend/func2url.json';

export default function VerifyPhone() {
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const verifyPhone = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setIsVerifying(false);
        setErrorMessage('Отсутствует токен верификации');
        return;
      }

      try {
        const response = await fetch(func2url.auth, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'verify_phone',
            token,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setIsSuccess(true);
          toast({
            title: 'Успешно',
            description: 'Номер телефона подтверждён',
          });
        } else {
          setErrorMessage(data.error || 'Не удалось подтвердить номер телефона');
        }
      } catch (error) {
        setErrorMessage('Ошибка при подтверждении номера телефона');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPhone();
  }, [searchParams, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            {isVerifying ? (
              <Icon name="Loader2" className="h-6 w-6 text-primary animate-spin" />
            ) : isSuccess ? (
              <Icon name="CheckCircle" className="h-6 w-6 text-green-600" />
            ) : (
              <Icon name="XCircle" className="h-6 w-6 text-destructive" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {isVerifying
              ? 'Подтверждение номера телефона...'
              : isSuccess
              ? 'Номер подтверждён!'
              : 'Ошибка подтверждения'}
          </CardTitle>
          <CardDescription>
            {isVerifying
              ? 'Пожалуйста, подождите'
              : isSuccess
              ? 'Ваш номер телефона успешно подтверждён'
              : errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isVerifying && (
            <Button
              onClick={() => navigate('/login')}
              className="w-full"
            >
              {isSuccess ? 'Перейти к входу' : 'Вернуться к входу'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
