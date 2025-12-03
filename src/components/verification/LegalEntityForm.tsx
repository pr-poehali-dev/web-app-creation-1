import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { VerificationFormData } from '@/types/verification';

interface LegalEntityFormProps {
  formData: VerificationFormData;
  onInputChange: (field: keyof VerificationFormData, value: string) => void;
  onFileChange: (field: keyof VerificationFormData, file: File | null) => void;
}

export default function LegalEntityForm({ formData, onInputChange, onFileChange }: LegalEntityFormProps) {
  return (
    <>
      <div>
        <Label htmlFor="companyName">Название организации *</Label>
        <Input
          id="companyName"
          value={formData.companyName || ''}
          onChange={(e) => onInputChange('companyName', e.target.value)}
          placeholder="ООО «Пример»"
          required
        />
      </div>

      <div>
        <Label htmlFor="inn">ИНН *</Label>
        <Input
          id="inn"
          value={formData.inn || ''}
          onChange={(e) => onInputChange('inn', e.target.value)}
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
          onChange={(e) => onFileChange('registrationCert', e.target.files?.[0] || null)}
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
          onChange={(e) => onFileChange('agreementForm', e.target.files?.[0] || null)}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Загрузите заполненную форму с печатью и подписью
        </p>
      </div>
    </>
  );
}