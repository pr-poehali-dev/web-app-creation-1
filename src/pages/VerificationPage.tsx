import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import type { VerificationType, VerificationFormData } from '@/types/verification';
import { uploadMultipleFiles } from '@/utils/fileUpload';

export default function VerificationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<VerificationFormData>({
    verificationType: 'individual',
    phone: '',
    registrationAddress: '',
    actualAddress: '',
    passportScan: null,
    utilityBill: null,
    companyName: '',
    inn: '',
    registrationCert: null,
    agreementForm: null,
  });

  const handleInputChange = (field: keyof VerificationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: keyof VerificationFormData, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        if (formData.utilityBill) {
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
      } else {
        dataToSend.registrationAddress = formData.registrationAddress || '';
        dataToSend.actualAddress = formData.actualAddress || '';
        dataToSend.passportScanUrl = uploadedUrls.passport_scan || null;
        dataToSend.utilityBillUrl = uploadedUrls.utility_bill || null;
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Верификация аккаунта</CardTitle>
          <CardDescription>
            Пройдите верификацию для получения доступа к созданию запросов и предложений
          </CardDescription>
        </CardHeader>
        <CardContent>
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

            <div className="space-y-3">
              <Label>Тип участника *</Label>
              <RadioGroup
                value={formData.verificationType}
                onValueChange={(value) => handleInputChange('verificationType', value as VerificationType)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="individual" id="individual" />
                  <Label htmlFor="individual" className="font-normal cursor-pointer">
                    Физическое лицо
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="self_employed" id="self_employed" />
                  <Label htmlFor="self_employed" className="font-normal cursor-pointer">
                    Самозанятый
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="legal_entity" id="legal_entity" />
                  <Label htmlFor="legal_entity" className="font-normal cursor-pointer">
                    Юридическое лицо
                  </Label>
                </div>
              </RadioGroup>
            </div>

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
              <>
                <div>
                  <Label htmlFor="companyName">Название организации *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="ООО «Пример»"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="inn">ИНН *</Label>
                  <Input
                    id="inn"
                    value={formData.inn}
                    onChange={(e) => handleInputChange('inn', e.target.value)}
                    placeholder="1234567890"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="registrationCert">Свидетельство о регистрации *</Label>
                  <Input
                    id="registrationCert"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange('registrationCert', e.target.files?.[0] || null)}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Загрузите скан-копию свидетельства о регистрации юридического лица
                  </p>
                </div>

                <div>
                  <Label htmlFor="agreementForm">Форма соглашения с ЕРТТП *</Label>
                  <Input
                    id="agreementForm"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange('agreementForm', e.target.files?.[0] || null)}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Загрузите заполненную форму с печатью и подписью
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="registrationAddress">Адрес регистрации *</Label>
                  <Textarea
                    id="registrationAddress"
                    value={formData.registrationAddress}
                    onChange={(e) => handleInputChange('registrationAddress', e.target.value)}
                    placeholder="Введите адрес регистрации"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="actualAddress">Фактический адрес проживания *</Label>
                  <Textarea
                    id="actualAddress"
                    value={formData.actualAddress}
                    onChange={(e) => handleInputChange('actualAddress', e.target.value)}
                    placeholder="Введите фактический адрес"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="passportScan">Скан паспорта с отметкой о регистрации *</Label>
                  <Input
                    id="passportScan"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange('passportScan', e.target.files?.[0] || null)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="utilityBill">Оплаченная квитанция *</Label>
                  <Input
                    id="utilityBill"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange('utilityBill', e.target.files?.[0] || null)}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Загрузите квитанцию для подтверждения адреса проживания
                  </p>
                </div>
              </>
            )}

            <Alert>
              <Icon name="Info" className="h-4 w-4" />
              <AlertDescription>
                Все документы проверяются в течение 1-3 рабочих дней. После успешной верификации вам будет доступен полный функционал платформы.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Отправка...' : 'Отправить на верификацию'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Отмена
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}