import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { VerificationStatus } from '@/types/verification';

export default function ProfileVerificationCard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('not_verified');

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

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

  const getStatusBadge = () => {
    switch (verificationStatus) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <Icon name="CheckCircle" className="h-3 w-3 mr-1" />
            Верифицирован
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <Icon name="Clock" className="h-3 w-3 mr-1" />
            На рассмотрении
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <Icon name="XCircle" className="h-3 w-3 mr-1" />
            Отклонено
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Icon name="AlertCircle" className="h-3 w-3 mr-1" />
            Не верифицирован
          </Badge>
        );
    }
  };

  const getStatusDescription = () => {
    switch (verificationStatus) {
      case 'verified':
        return 'Ваш аккаунт успешно верифицирован. Вам доступен полный функционал платформы.';
      case 'pending':
        return 'Ваша заявка на верификацию находится на рассмотрении. Мы проверим документы в течение 1-3 рабочих дней.';
      case 'rejected':
        return 'Ваша заявка была отклонена. Пожалуйста, проверьте данные и подайте заявку повторно.';
      default:
        return 'Для создания запросов и предложений необходимо пройти верификацию аккаунта.';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Статус верификации</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{getStatusDescription()}</p>

        {verificationStatus !== 'verified' && verificationStatus !== 'pending' && (
          <Button onClick={() => navigate('/verification')} className="w-full">
            <Icon name="Shield" className="h-4 w-4 mr-2" />
            {verificationStatus === 'rejected' ? 'Подать заявку повторно' : 'Пройти верификацию'}
          </Button>
        )}

        {verificationStatus === 'verified' && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-md">
            <Icon name="CheckCircle" className="h-4 w-4" />
            <span>Вы можете создавать запросы и предложения</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
