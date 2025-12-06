import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/utils/fileUpload';

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
  const [verification, setVerification] = useState<VerificationDetails | null>(null);
  const [message, setMessage] = useState('');
  const [documents, setDocuments] = useState<Record<string, File>>({});
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({});
  const [uploadingDocs, setUploadingDocs] = useState<Record<string, boolean>>({});

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
        if (data.verification && data.verification.status === 'rejected') {
          setVerification(data.verification);
        } else {
          toast({
            variant: 'destructive',
            title: 'Ошибка',
            description: 'Нет отклоненных заявок для повторной подачи',
          });
          navigate('/profile');
        }
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

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Размер файла не должен превышать 5 МБ',
      });
      return;
    }

    setUploadingDocs(prev => ({ ...prev, [docType]: true }));

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const url = await uploadFile(file, docType, userId);
      
      setDocuments(prev => ({ ...prev, [docType]: file }));
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
          description: 'Размер документов слишком большой. Попробуйте загрузить файлы меньшего размера (до 5 МБ каждый)',
        });
        return;
      }

      if (response.ok) {
        toast({
          title: 'Заявка отправлена',
          description: 'Ваши документы отправлены на повторное рассмотрение',
        });
        navigate('/profile');
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

  const getDocumentLabel = (docType: string) => {
    const labels: Record<string, string> = {
      passportScan: 'Скан паспорта',
      passportRegistration: 'Скан прописки',
      utilityBill: 'Счёт за коммунальные услуги',
      registrationCert: 'Свидетельство о регистрации',
      agreementForm: 'Форма согласия',
    };
    return labels[docType] || docType;
  };

  const documentTypes = verification.verificationType === 'individual'
    ? ['passportScan', 'passportRegistration', 'utilityBill']
    : ['registrationCert', 'agreementForm'];

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
            {verification.rejectionReason && (
              <Alert variant="destructive">
                <Icon name="AlertCircle" className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-1">Причина отклонения:</p>
                  <p>{verification.rejectionReason}</p>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Загрузите обновленные документы</h3>
              
              {documentTypes.map(docType => (
                <div key={docType} className="space-y-2">
                  <Label htmlFor={docType}>{getDocumentLabel(docType)}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id={docType}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(docType, e.target.files?.[0] || null)}
                      disabled={uploadingDocs[docType]}
                      className="block w-full text-sm text-muted-foreground
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary file:text-primary-foreground
                        hover:file:bg-primary/90
                        cursor-pointer"
                    />
                    {uploadingDocs[docType] && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    )}
                    {documents[docType] && (
                      <Icon name="CheckCircle" className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>

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