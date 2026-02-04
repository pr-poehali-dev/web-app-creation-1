import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import FileUploadWithIndicator from '@/components/FileUploadWithIndicator';
import type { VerificationFormData } from '@/types/verification';
import { validateINN, formatINN } from '@/utils/innValidation';

interface IndividualFormProps {
  formData: VerificationFormData;
  onInputChange: (field: keyof VerificationFormData, value: string) => void;
  onFileChange: (field: keyof VerificationFormData, file: File | null) => void;
  onFormDataChange: (updater: (prev: VerificationFormData) => VerificationFormData) => void;
}

export default function IndividualForm({ 
  formData, 
  onInputChange, 
  onFileChange,
  onFormDataChange 
}: IndividualFormProps) {
  const [innError, setInnError] = useState<string>('');

  const handleInnChange = (value: string) => {
    const formatted = formatINN(value);
    onInputChange('inn', formatted);
    
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

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="inn" className="text-sm font-medium">ИНН *</Label>
        <Input
          id="inn"
          value={formData.inn || ''}
          onChange={(e) => handleInnChange(e.target.value)}
          placeholder="123456789012"
          required
          maxLength={12}
          pattern="[0-9]*"
          inputMode="numeric"
          className={`text-base ${innError ? 'border-red-500' : ''}`}
        />
        {innError && (
          <p className="text-xs text-red-600">{innError}</p>
        )}
        {formData.inn && !innError && formData.inn.length >= 10 && (
          <p className="text-xs text-green-600">✓ ИНН корректен</p>
        )}
      </div>

      <FileUploadWithIndicator
        id="passportScan"
        label="Лицевая сторона паспорта"
        accept="image/*,.pdf"
        required
        helpText="Загрузите фото или скан лицевой стороны паспорта"
        onChange={(file) => onFileChange('passportScan', file)}
      />

      <FileUploadWithIndicator
        id="passportRegistration"
        label="Страница с отметкой о регистрации"
        accept="image/*,.pdf"
        required
        helpText="Загрузите страницу паспорта с отметкой о регистрации"
        onChange={(file) => onFileChange('passportRegistration', file)}
      />

      <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
        <Checkbox
          id="addressesMatch"
          checked={formData.addressesMatch}
          onCheckedChange={(checked) => {
            onFormDataChange(prev => ({ 
              ...prev, 
              addressesMatch: checked as boolean,
              actualAddress: checked ? '' : prev.actualAddress,
              utilityBill: checked ? null : prev.utilityBill
            }));
          }}
          className="mt-0.5"
        />
        <Label htmlFor="addressesMatch" className="font-normal cursor-pointer text-sm leading-relaxed">
          Фактический адрес проживания совпадает с адресом прописки
        </Label>
      </div>

      {!formData.addressesMatch && (
        <AddressAutocomplete
          id="actualAddress"
          label="Фактический адрес проживания"
          value={formData.actualAddress || ''}
          onChange={(value) => onInputChange('actualAddress', value)}
          placeholder="Начните вводить адрес"
          required
        />
      )}

      {!formData.addressesMatch && (
        <FileUploadWithIndicator
          id="utilityBill"
          label="Оплаченная квитанция"
          accept="image/*,.pdf"
          required
          helpText="Загрузите квитанцию для подтверждения адреса проживания"
          onChange={(file) => onFileChange('utilityBill', file)}
        />
      )}
    </>
  );
}