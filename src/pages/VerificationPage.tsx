import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import type { VerificationType, VerificationFormData } from '@/types/verification';
import { uploadMultipleFiles } from '@/utils/fileUpload';
import AgreementDialog from '@/components/AgreementDialog';
import VerificationTypeSelector from '@/components/verification/VerificationTypeSelector';
import LegalEntityForm from '@/components/verification/LegalEntityForm';
import EntrepreneurForm from '@/components/verification/EntrepreneurForm';
import IndividualForm from '@/components/verification/IndividualForm';
import RejectedVerificationAlert from '@/components/verification/RejectedVerificationAlert';

export default function VerificationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [existingDocuments, setExistingDocuments] = useState<any>({});
  const [formData, setFormData] = useState<VerificationFormData>({
    verificationType: 'individual',
    phone: '',
    registrationAddress: '',
    actualAddress: '',
    addressesMatch: false,
    passportScan: null,
    passportRegistration: null,
    utilityBill: null,
    companyName: '',
    inn: '',
    ogrnip: '',
    registrationCert: null,
    agreementForm: null,
  });

  const handleInputChange = (field: keyof VerificationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: keyof VerificationFormData, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setIsLoadingUserData(false);
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
        setRejectionReason(data.rejectionReason || '');
        setExistingDocuments(data.existingDocuments || {});
        
        let verificationType: VerificationType = 'individual';
        if (data.userType === 'legal-entity') {
          verificationType = 'legal_entity';
        } else if (data.userType === 'entrepreneur') {
          verificationType = 'self_employed';
        } else if (data.userType === 'self-employed' || data.userType === 'individual') {
          verificationType = 'individual';
        }

        setFormData(prev => ({
          ...prev,
          verificationType,
          phone: data.phone || '',
          companyName: data.companyName || '',
          inn: data.inn || '',
          ogrnip: data.ogrnip || '',
        }));

        if (data.inn && (verificationType === 'legal_entity' || verificationType === 'self_employed')) {
          await fetchCompanyDataByINN(data.inn, verificationType);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoadingUserData(false);
    }
  };

  const fetchCompanyDataByINN = async (inn: string, verificationType: VerificationType) => {
    try {
      const response = await fetch(
        `https://functions.poehali.dev/de7c45a6-d320-45cc-8aca-719530cc640c?inn=${inn}`
      );
      const result = await response.json();

      if (result.success && result.data) {
        const dadataData = result.data;
        
        if (verificationType === 'legal_entity') {
          setFormData(prev => ({
            ...prev,
            companyName: dadataData.company_name || prev.companyName,
            inn: dadataData.inn || prev.inn,
          }));
        } else if (verificationType === 'self_employed') {
          setFormData(prev => ({
            ...prev,
            companyName: dadataData.company_name || prev.companyName,
            inn: dadataData.inn || prev.inn,
            ogrnip: dadataData.ogrnip || prev.ogrnip,
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreementAccepted) {
      setShowAgreement(true);
      return;
    }

    submitVerification();
  };

  const submitVerification = async () => {
    setError('');
    setLoading(true);
    setUploadProgress(0);
    setUploadTotal(0);

    try {
      const userId = localStorage.getItem('userId') || '';
      const filesToUpload: { file: File; type: string }[] = [];

      if (formData.verificationType === 'legal_entity') {
        if (formData.registrationCert) {
          filesToUpload.push({ file: formData.registrationCert, type: 'registration_cert' });
        }
        if (formData.agreementForm) {
          filesToUpload.push({ file: formData.agreementForm, type: 'agreement_form' });
        }
      } else {
        if (formData.passportScan) {
          filesToUpload.push({ file: formData.passportScan, type: 'passport_scan' });
        }
        if (formData.passportRegistration) {
          filesToUpload.push({ file: formData.passportRegistration, type: 'passport_registration' });
        }
        if (formData.utilityBill && !formData.addressesMatch) {
          filesToUpload.push({ file: formData.utilityBill, type: 'utility_bill' });
        }
      }

      let uploadedUrls: Record<string, string> = {};
      
      if (filesToUpload.length > 0) {
        setUploadTotal(filesToUpload.length);
        uploadedUrls = await uploadMultipleFiles(
          filesToUpload,
          userId,
          (current, total) => {
            setUploadProgress(current);
            setUploadTotal(total);
          }
        );
      }

      const dataToSend: any = {
        verificationType: formData.verificationType,
        phone: formData.phone,
      };

      if (formData.verificationType === 'legal_entity') {
        dataToSend.companyName = formData.companyName || '';
        dataToSend.inn = formData.inn || '';
        dataToSend.registrationCertUrl = uploadedUrls.registration_cert || null;
        dataToSend.agreementFormUrl = uploadedUrls.agreement_form || null;
      } else if (formData.verificationType === 'self_employed') {
        dataToSend.inn = formData.inn || '';
        dataToSend.ogrnip = formData.ogrnip || '';
        dataToSend.registrationAddress = formData.registrationAddress || '';
        dataToSend.actualAddress = formData.addressesMatch 
          ? formData.registrationAddress || '' 
          : formData.actualAddress || '';
        dataToSend.passportScanUrl = uploadedUrls.passport_scan || null;
        dataToSend.passportRegistrationUrl = uploadedUrls.passport_registration || null;
        dataToSend.utilityBillUrl = formData.addressesMatch ? null : uploadedUrls.utility_bill || null;
      } else {
        dataToSend.inn = formData.inn || '';
        dataToSend.registrationAddress = formData.registrationAddress || '';
        dataToSend.actualAddress = formData.addressesMatch 
          ? formData.registrationAddress || '' 
          : formData.actualAddress || '';
        dataToSend.passportScanUrl = uploadedUrls.passport_scan || null;
        dataToSend.passportRegistrationUrl = uploadedUrls.passport_registration || null;
        dataToSend.utilityBillUrl = formData.addressesMatch ? null : uploadedUrls.utility_bill || null;
      }

      const response = await fetch('https://functions.poehali.dev/afc94607-0379-45a9-bc60-262eded2b980', {
        method: 'POST',
        headers: {
          'X-User-Id': userId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка при отправке заявки');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/profile');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
      setUploadProgress(0);
      setUploadTotal(0);
    }
  };

  const handleAgreementAccept = () => {
    setAgreementAccepted(true);
    submitVerification();
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Alert className="bg-green-50 border-green-200">
          <Icon name="CheckCircle" className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-800">
            Заявка на верификацию успешно отправлена! Мы проверим ваши документы в течение 1-3 рабочих дней.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoadingUserData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              disabled={loading}
              className="text-primary font-bold"
            >
              <Icon name="ArrowLeft" className="h-4 w-4 mr-1" />
              Назад
            </Button>
          </div>
          <CardTitle>Верификация аккаунта</CardTitle>
          <CardDescription>
            Для полного доступа к функционалу платформы (создания запросов, предложений, аукциона, контракта) необходимо пройти верификацию аккаунта. Это займет всего несколько минут.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verificationStatus === 'rejected' && rejectionReason && (
            <RejectedVerificationAlert
              rejectionReason={rejectionReason}
              verificationType={formData.verificationType}
              existingDocuments={existingDocuments}
              phone={formData.phone}
              onResubmit={loadUserData}
            />
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <Icon name="AlertCircle" className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading && uploadTotal > 0 && (
              <Alert>
                <Icon name="Upload" className="h-4 w-4" />
                <AlertDescription>
                  Загрузка файлов: {uploadProgress} из {uploadTotal}
                  <Progress value={(uploadProgress / uploadTotal) * 100} className="mt-2" />
                </AlertDescription>
              </Alert>
            )}

            <VerificationTypeSelector
              value={formData.verificationType}
              onChange={(value) => handleInputChange('verificationType', value)}
              disabled={true}
            />

            <div>
              <Label htmlFor="phone">Номер телефона *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+7 (999) 123-45-67"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                На этот номер придет звонок для подтверждения
              </p>
            </div>

            {formData.verificationType === 'legal_entity' ? (
              <LegalEntityForm
                formData={formData}
                onInputChange={handleInputChange}
                onFileChange={handleFileChange}
              />
            ) : formData.verificationType === 'self_employed' ? (
              <EntrepreneurForm
                formData={formData}
                onInputChange={handleInputChange}
                onFileChange={handleFileChange}
                onFormDataChange={setFormData}
              />
            ) : (
              <IndividualForm
                formData={formData}
                onInputChange={handleInputChange}
                onFileChange={handleFileChange}
                onFormDataChange={setFormData}
              />
            )}

            <Alert>
              <Icon name="Info" className="h-4 w-4" />
              <AlertDescription>
                Все документы проверяются в течение 1-3 рабочих дней. После успешной верификации вам будет доступен полный функционал платформы.
              </AlertDescription>
            </Alert>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Отправка...' : agreementAccepted ? 'Отправить на верификацию' : 'Ознакомиться с соглашением'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <AgreementDialog
        open={showAgreement}
        onOpenChange={setShowAgreement}
        onAccept={handleAgreementAccept}
      />
    </div>
  );
}