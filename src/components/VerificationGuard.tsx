import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { VerificationStatus } from '@/types/verification';

interface VerificationGuardProps {
  children: React.ReactNode;
}

export default function VerificationGuard({ children }: VerificationGuardProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('not_verified');

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        navigate('/login');
        return;
      }

      const response = await fetch('https://functions.poehali.dev/1c97f222-fdea-4b59-b941-223ee8bb077b', {
        headers: {
          'X-User-Id': userId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationStatus(data.verificationStatus);
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (verificationStatus === 'verified') {
    return <>{children}</>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {verificationStatus === 'not_verified' && (
        <Alert>
          <Icon name="AlertCircle" className="h-5 w-5" />
          <AlertTitle>Требуется верификация</AlertTitle>
          <AlertDescription className="mt-2 space-y-4">
            <p>
              Для создания запросов и предложений необходимо пройти верификацию аккаунта.
              Это займет всего несколько минут.
            </p>
            <Button onClick={() => navigate('/verification')}>
              Пройти верификацию
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {verificationStatus === 'pending' && (
        <Alert className="bg-blue-50 border-blue-200">
          <Icon name="Clock" className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-blue-900">Заявка на рассмотрении</AlertTitle>
          <AlertDescription className="text-blue-800 mt-2">
            <p>
              Ваша заявка на верификацию находится на рассмотрении. 
              Мы проверим ваши документы в течение 1-3 рабочих дней и уведомим вас о результате.
            </p>
            <p className="mt-2">
              После успешной верификации вам будет доступен полный функционал платформы.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {verificationStatus === 'rejected' && (
        <Alert variant="destructive">
          <Icon name="XCircle" className="h-5 w-5" />
          <AlertTitle>Заявка отклонена</AlertTitle>
          <AlertDescription className="mt-2 space-y-4">
            <p>
              К сожалению, ваша заявка на верификацию была отклонена.
              Пожалуйста, проверьте данные и документы, затем подайте заявку повторно.
            </p>
            <Button onClick={() => navigate('/verification')}>
              Подать заявку повторно
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
