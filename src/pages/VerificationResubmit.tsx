import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/utils/fileUpload';
import { compressImage, formatFileSize } from '@/utils/imageCompression';
import VerificationSuccessScreen from '@/components/verification/VerificationSuccessScreen';
import VerificationRejectionAlert from '@/components/verification/VerificationRejectionAlert';
import DocumentUploadSection from '@/components/verification/DocumentUploadSection';

interface VerificationResubmitProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface VerificationDetails {
  id: number;
  rejectionReason?: string;
  verificationType: string;
}

export default function VerificationResubmit({ isAuthenticated, onLogout }: VerificationResubmitProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [verification, setVerification] = useState<VerificationDetails | null>(null);
  const [message, setMessage] = useState('');
  const [documents, setDocuments] = useState<Record<string, File>>({});
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({});
  const [uploadingDocs, setUploadingDocs] = useState<Record<string, boolean>>({});
  const [addressMatchesRegistration, setAddressMatchesRegistration] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadVerificationStatus();
  }, [isAuthenticated, navigate]);

  const loadVerificationStatus = async () => {
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
        console.log('Verification data:', data);
        
        if (!data.verification) {
          toast({
            title: 'Информация',
            description: 'У вас пока нет заявок на верификацию. Пройдите верификацию сначала',
          });
          navigate('/verification');
          return;
        }
        
        console.log('Verification status:', data.verification.status);
        
        if (data.verification.status === 'rejected') {
          setVerification(data.verification);
        } else if (data.verification.status === 'pending') {
          toast({
            title: 'Информация',
            description: 'Ваша заявка находится на рассмотрении. Дождитесь результата проверки',
          });
          navigate('/profile');
        } else if (data.verification.status === 'verified' || data.verification.status === 'approved') {
          toast({
            title: 'Информация',
            description: 'Ваш аккаунт уже верифицирован',
          });
          navigate('/profile');
        } else {
          toast({
            title: 'Информация',
            description: `Повторная подача доступна только для отклоненных заявок. Текущий статус: ${data.verification.status}`,
          });
          navigate('/profile');
        }
      } else {
        console.error('Response not OK:', response.status, await response.text());
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось загрузить данные верификации',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (docType: string, file: File | null) => {
    if (!file) return;

    setUploadingDocs(prev => ({ ...prev, [docType]: true }));

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User not authenticated');
      }

      let fileToUpload = file;
      const originalSize = file.size;

      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'Сжатие изображения...',
          description: `Исходный размер: ${formatFileSize(originalSize)}. Подождите немного...`,
        });

        try {
          fileToUpload = await compressImage(file, 1.8);
          
          const savedSize = originalSize - fileToUpload.size;
          const savedPercent = Math.round((savedSize / originalSize) * 100);
          
          toast({
            title: 'Изображение сжато!',
            description: `Новый размер: ${formatFileSize(fileToUpload.size)} (сжато на ${savedPercent}%)`,
          });
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Ошибка сжатия',
            description: 'Не удалось сжать изображение. Попробуйте другой файл или уменьшите размер вручную.',
          });
          setUploadingDocs(prev => ({ ...prev, [docType]: false }));
          return;
        }
      }

      const url = await uploadFile(fileToUpload, docType, userId);
      
      setDocuments(prev => ({ ...prev, [docType]: fileToUpload }));
      setDocumentUrls(prev => ({ ...prev, [docType]: url }));
      toast({
        title: 'Успешно',
        description: 'Документ загружен',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось загрузить документ',
      });
    } finally {
      setUploadingDocs(prev => ({ ...prev, [docType]: false }));
    }
  };

  const handleSubmit = async () => {
    if (!verification) return;

    if (Object.keys(documents).length === 0) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Загрузите хотя бы один обновленный документ',
      });
      return;
    }

    setSubmitting(true);

    try {
      const userId = localStorage.getItem('userId');
      
      const urlMapping: Record<string, string> = {
        passportScan: 'passportScanUrl',
        passportRegistration: 'passportRegistrationUrl',
        utilityBill: 'utilityBillUrl',
        registrationCert: 'registrationCertUrl',
        agreementForm: 'agreementFormUrl',
      };
      
      const payload: Record<string, any> = {
        verificationId: verification.id,
        message,
      };
      
      Object.keys(documentUrls).forEach(docType => {
        const fieldName = urlMapping[docType];
        const url = documentUrls[docType];
        if (fieldName && url) {
          payload[fieldName] = url;
        }
      });
      
      const response = await fetch('https://functions.poehali.dev/d3ac1521-9001-4630-9c2b-8c829187016e', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || '',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 413) {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: 'Размер документов слишком большой. Попробуйте загрузить файлы меньшего размера (до 2 МБ каждый)',
        });
        return;
      }

      if (response.ok) {
        setSubmitted(true);
        
        sessionStorage.setItem('verificationResubmitted', 'true');
        
        toast({
          title: (
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center animate-bounce">
                <Icon name="Check" className="h-4 w-4 text-white" />
              </div>
              <span>Документы успешно отправлены!</span>
            </div>
          ),
          description: (
            <div className="space-y-2">
              <p className="text-sm font-medium">Ваша заявка принята и ожидает проверки модератором.</p>
              <p className="text-xs text-muted-foreground">Обычно проверка занимает до 24 часов. Вы получите уведомление о результатах на email и в личном кабинете.</p>
            </div>
          ),
          duration: 7000,
        });
        
        setTimeout(() => {
          navigate('/profile');
        }, 3000);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to resubmit');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось отправить заявку',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddressMatchChange = (checked: boolean) => {
    setAddressMatchesRegistration(checked);
    if (checked) {
      setDocuments(prev => {
        const newDocs = { ...prev };
        delete newDocs.utilityBill;
        return newDocs;
      });
      setDocumentUrls(prev => {
        const newUrls = { ...prev };
        delete newUrls.utilityBill;
        return newUrls;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!verification) {
    return null;
  }

  const documentTypes = verification.verificationType === 'individual'
    ? (addressMatchesRegistration 
        ? ['passportScan', 'passportRegistration'] 
        : ['passportScan', 'passportRegistration', 'utilityBill'])
    : ['registrationCert', 'agreementForm'];

  if (submitted) {
    return <VerificationSuccessScreen isAuthenticated={isAuthenticated} onLogout={onLogout} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/profile')}
          className="mb-6"
        >
          <Icon name="ArrowLeft" className="h-4 w-4 mr-2" />
          Вернуться в профиль
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="RefreshCw" className="h-6 w-6" />
              Повторная подача документов
            </CardTitle>
            <CardDescription>
              Ваша предыдущая заявка была отклонена. Загрузите исправленные документы и отправьте заявку повторно
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <VerificationRejectionAlert rejectionReason={verification.rejectionReason} />

            <DocumentUploadSection
              verificationType={verification.verificationType}
              documentTypes={documentTypes}
              documents={documents}
              uploadingDocs={uploadingDocs}
              addressMatchesRegistration={addressMatchesRegistration}
              onAddressMatchChange={handleAddressMatchChange}
              onFileChange={handleFileChange}
            />

            <div className="space-y-2">
              <Label htmlFor="message">Сообщение для модератора (необязательно)</Label>
              <Textarea
                id="message"
                placeholder="Опишите, какие исправления вы внесли..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={submitting || Object.keys(documents).length === 0}
                className="flex-1"
                size="lg"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Отправка...
                  </>
                ) : (
                  <>
                    <Icon name="Send" className="h-4 w-4 mr-2" />
                    Отправить на рассмотрение
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/profile')}
                disabled={submitting}
              >
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}
