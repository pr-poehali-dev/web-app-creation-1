import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FileUploadWithIndicator from '@/components/FileUploadWithIndicator';
import type { VerificationFormData } from '@/types/verification';
import { validateINN, formatINN } from '@/utils/innValidation';
import Icon from '@/components/ui/icon';

interface LegalEntityFormProps {
  formData: VerificationFormData;
  onInputChange: (field: keyof VerificationFormData, value: string) => void;
  onFileChange: (field: keyof VerificationFormData, file: File | null) => void;
  onFormDataChange: (updater: (prev: VerificationFormData) => VerificationFormData) => void;
}

export default function LegalEntityForm({ formData, onInputChange, onFileChange, onFormDataChange }: LegalEntityFormProps) {
  const [innError, setInnError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  const handleInnChange = (value: string) => {
    const formatted = formatINN(value);
    onInputChange('inn', formatted);
    setAutoFilled(false);
    
    if (formatted.length === 0) {
      setInnError('');
      return;
    }
    
    const validation = validateINN(formatted);
    if (!validation.isValid && validation.error) {
      setInnError(validation.error);
    } else {
      setInnError('');
    }
  };

  const handleInnBlur = async () => {
    if (formData.inn && formData.inn.length === 10 && !innError && !autoFilled) {
      setLoading(true);
      try {
        const response = await fetch(
          `https://functions.poehali.dev/de7c45a6-d320-45cc-8aca-719530cc640c?inn=${formData.inn}`
        );
        const result = await response.json();

        if (result.success && result.data) {
          const dadataData = result.data;
          onFormDataChange(prev => ({
            ...prev,
            companyName: dadataData.company_name || prev.companyName,
          }));
          setAutoFilled(true);
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="inn" className="text-sm font-medium">
          ИНН *
          {loading && <Icon name="Loader2" className="inline-block ml-2 h-3 w-3 animate-spin" />}
        </Label>
        <Input
          id="inn"
          value={formData.inn || ''}
          onChange={(e) => handleInnChange(e.target.value)}
          onBlur={handleInnBlur}
          placeholder="1234567890"
          required
          maxLength={10}
          pattern="[0-9]*"
          inputMode="numeric"
          className={`text-base ${innError ? 'border-red-500' : ''}`}
        />
        {innError && (
          <p className="text-xs text-red-600">{innError}</p>
        )}
        {formData.inn && !innError && formData.inn.length === 10 && (
          <p className="text-xs text-green-600">✓ ИНН корректен</p>
        )}
        {autoFilled && (
          <p className="text-xs text-blue-600">✓ Данные загружены из ЕГРЮЛ</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyName" className="text-sm font-medium">Название организации *</Label>
        <Input
          id="companyName"
          value={formData.companyName || ''}
          onChange={(e) => onInputChange('companyName', e.target.value)}
          placeholder="ООО «Пример»"
          required
          className="text-base"
        />
      </div>

      <FileUploadWithIndicator
        id="registrationCert"
        label="Свидетельство о регистрации"
        accept="image/*,.pdf"
        required
        helpText="Загрузите скан-копию свидетельства о регистрации юридического лица"
        onChange={(file) => onFileChange('registrationCert', file)}
      />

      <FileUploadWithIndicator
        id="agreementForm"
        label="Форма соглашения с ЕРТТП"
        accept="image/*,.pdf"
        required
        helpText="Загрузите заполненную форму с печатью и подписью"
        onChange={(file) => onFileChange('agreementForm', file)}
      />
    </>
  );
}