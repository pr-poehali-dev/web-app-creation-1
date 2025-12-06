import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import type { VerificationStatus } from '@/types/verification';

interface VerificationDetails {
  id: number;
  rejectionReason?: string;
  adminMessage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function ProfileVerificationCard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('not_verified');
  const [verificationDetails, setVerificationDetails] = useState<VerificationDetails | null>(null);

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
        if (data.verification) {
          setVerificationDetails(data.verification);
        }
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
        return 'Ваш аккаунт успешно верифицирован. Вам доступен полный функционал платформы, включая создание запросов и предложений.';
      case 'pending':
        return 'Ваша заявка на верификацию находится на рассмотрении. Мы проверим документы в течение 1-3 рабочих дней и уведомим вас о результате.';
      case 'rejected':
        return 'Ваша заявка была отклонена. Пожалуйста, проверьте правильность данных и документов, затем подайте заявку повторно.';
      default:
        return 'Для полного доступа к функционалу платформы (создания запросов, предложений, аукциона, контракта) необходимо пройти верификацию аккаунта.';
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

  const getCardStyle = () => {
    switch (verificationStatus) {
      case 'verified':
        return 'border-green-200 bg-green-50/50';
      case 'pending':
        return 'border-blue-200 bg-blue-50/50';
      case 'rejected':
        return 'border-red-200 bg-red-50/50';
      default:
        return 'border-orange-200 bg-orange-50/50';
    }
  };

  return (
    <Card className={getCardStyle()}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="Shield" className="h-5 w-5" />
            Статус верификации
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">{getStatusDescription()}</p>

        {verificationStatus === 'verified' && (
          <div className="flex items-start gap-3 text-sm text-green-700 bg-green-100/80 p-4 rounded-lg border border-green-200">
            <Icon name="CheckCircle" className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-1">Верификация пройдена</p>
              <p className="text-green-600">Вам доступны все функции: создание предложений, запросов и участие в аукционах</p>
            </div>
          </div>
        )}

        {verificationStatus === 'pending' && (
          <div className="flex items-start gap-3 text-sm text-blue-700 bg-blue-100/80 p-4 rounded-lg border border-blue-200">
            <Icon name="Clock" className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-1">Заявка на рассмотрении</p>
              <p className="text-blue-600">Пожалуйста, дождитесь проверки документов. Обычно это занимает 1-3 рабочих дня</p>
            </div>
          </div>
        )}

        {verificationStatus === 'rejected' && (
          <Alert variant="destructive">
            <Icon name="XCircle" className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Заявка отклонена</p>
                {verificationDetails?.rejectionReason && (
                  <div className="mt-2 p-3 bg-white/50 rounded border border-red-200">
                    <p className="text-sm font-medium mb-1">Причина отклонения:</p>
                    <p className="text-sm">{verificationDetails.rejectionReason}</p>
                  </div>
                )}
                <p className="text-sm mt-2">Пожалуйста, исправьте указанные замечания и подайте документы повторно</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {verificationStatus === 'not_verified' && (
          <div className="flex items-start gap-3 text-sm text-orange-700 bg-orange-100/80 p-4 rounded-lg border border-orange-200">
            <Icon name="AlertCircle" className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-1">Рекомендуем пройти верификацию</p>
              <p className="text-orange-600">Верифицированные пользователи получают больше возможностей и доступ ко всем инструментам платформы</p>
            </div>
          </div>
        )}

        {verificationStatus === 'not_verified' && (
          <Button 
            onClick={() => navigate('/verification')} 
            className="w-full" 
            size="lg"
          >
            <Icon name="Shield" className="h-4 w-4 mr-2" />
            Пройти верификацию
          </Button>
        )}
        
        {verificationStatus === 'rejected' && (
          <Button 
            onClick={() => navigate('/verification/resubmit')} 
            className="w-full" 
            size="lg"
            variant="default"
          >
            <Icon name="RefreshCw" className="h-4 w-4 mr-2" />
            Подать документы повторно
          </Button>
        )}
      </CardContent>
    </Card>
  );
}