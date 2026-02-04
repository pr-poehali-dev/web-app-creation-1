import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FileUploadWithIndicator from '@/components/FileUploadWithIndicator';
import type { VerificationFormData } from '@/types/verification';

interface LegalEntityFormProps {
  formData: VerificationFormData;
  onInputChange: (field: keyof VerificationFormData, value: string) => void;
  onFileChange: (field: keyof VerificationFormData, file: File | null) => void;
}

export default function LegalEntityForm({ formData, onInputChange, onFileChange }: LegalEntityFormProps) {
  return (
    <>
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

      <div className="space-y-2">
        <Label htmlFor="inn" className="text-sm font-medium">ИНН *</Label>
        <Input
          id="inn"
          value={formData.inn || ''}
          onChange={(e) => onInputChange('inn', e.target.value)}
          placeholder="1234567890"
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