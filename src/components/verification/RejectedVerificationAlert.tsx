import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { uploadMultipleFiles } from '@/utils/fileUpload';

interface RejectedVerificationAlertProps {
  rejectionReason: string;
  verificationType: 'legal_entity' | 'self_employed' | 'individual';
  existingDocuments: {
    passportScanUrl?: string;
    passportRegistrationUrl?: string;
    utilityBillUrl?: string;
    registrationCertUrl?: string;
    agreementFormUrl?: string;
  };
  onResubmit: () => void;
}

export default function RejectedVerificationAlert({
  rejectionReason,
  verificationType,
  existingDocuments,
  onResubmit
}: RejectedVerificationAlertProps) {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<{ [key: string]: File | null }>({});
  const [uploadProgress, setUploadProgress] = useState(0);

  const getRequiredDocuments = () => {
    if (verificationType === 'legal_entity') {
      return [
        { key: 'registrationCert', label: 'Свидетельство о регистрации ЮЛ', current: existingDocuments.registrationCertUrl },
        { key: 'agreementForm', label: 'Форма договора', current: existingDocuments.agreementFormUrl }
      ];
    } else {
      return [
        { key: 'passportScan', label: 'Скан паспорта (главная страница + прописка)', current: existingDocuments.passportScanUrl },
        { key: 'passportRegistration', label: 'Страница с регистрацией', current: existingDocuments.passportRegistrationUrl },
        { key: 'utilityBill', label: 'Квитанция об оплате ЖКХ', current: existingDocuments.utilityBillUrl }
      ];
    }
  };

  const handleFileChange = (key: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [key]: file }));
  };

  const handleResubmit = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const filesToUpload = Object.entries(files).filter(([_, file]) => file !== null);
    
    if (filesToUpload.length === 0) {
      alert('Загрузите хотя бы один документ для повторной отправки');
      return;
    }

    setLoading(true);
    try {
      const uploadedUrls: { [key: string]: string } = {};
      
      for (let i = 0; i < filesToUpload.length; i++) {
        const [key, file] = filesToUpload[i];
        setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100));
        
        const urls = await uploadMultipleFiles([file as File], userId);
        if (urls.length > 0) {
          uploadedUrls[key] = urls[0];
        }
      }

      const body: any = {
        verificationType,
        phone: '',
      };

      if (verificationType === 'legal_entity') {
        body.registrationCertUrl = uploadedUrls.registrationCert || existingDocuments.registrationCertUrl;
        body.agreementFormUrl = uploadedUrls.agreementForm || existingDocuments.agreementFormUrl;
      } else {
        body.passportScanUrl = uploadedUrls.passportScan || existingDocuments.passportScanUrl;
        body.passportRegistrationUrl = uploadedUrls.passportRegistration || existingDocuments.passportRegistrationUrl;
        body.utilityBillUrl = uploadedUrls.utilityBill || existingDocuments.utilityBillUrl;
      }

      const response = await fetch('https://functions.poehali.dev/afc94607-0379-45a9-bc60-262eded2b980', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        onResubmit();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка при отправке документов');
      }
    } catch (error) {
      console.error('Error resubmitting documents:', error);
      alert('Произошла ошибка при загрузке документов');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const documents = getRequiredDocuments();

  return (
    <Alert variant="destructive" className="mb-6">
      <Icon name="AlertCircle" className="h-5 w-5" />
      <AlertTitle className="text-lg font-semibold mb-2">Верификация отклонена</AlertTitle>
      <AlertDescription className="space-y-4">
        <p className="text-sm">
          <strong>Причина:</strong> {rejectionReason}
        </p>
        
        <div className="space-y-3 mt-4">
          <p className="font-medium">Загрузите исправленные документы:</p>
          
          {documents.map(doc => (
            <div key={doc.key} className="space-y-2">
              <Label htmlFor={`reupload-${doc.key}`} className="text-sm">
                {doc.label}
                {doc.current && (
                  <a 
                    href={doc.current} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-xs text-blue-500 hover:underline"
                  >
                    (текущий документ)
                  </a>
                )}
              </Label>
              <input
                id={`reupload-${doc.key}`}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange(doc.key, e.target.files?.[0] || null)}
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
              />
            </div>
          ))}
        </div>

        {uploadProgress > 0 && (
          <div className="space-y-2">
            <p className="text-sm">Загрузка: {uploadProgress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <Button 
          onClick={handleResubmit} 
          disabled={loading || Object.keys(files).length === 0}
          className="w-full mt-4"
        >
          {loading ? (
            <>
              <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
              Отправка документов...
            </>
          ) : (
            <>
              <Icon name="Upload" className="mr-2 h-4 w-4" />
              Отправить исправленные документы
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
