import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import FileUploadWithIndicator from '@/components/FileUploadWithIndicator';
import type { VerificationFormData } from '@/types/verification';
import { validateINN, formatINN } from '@/utils/innValidation';
import Icon from '@/components/ui/icon';

interface EntrepreneurFormProps {
  formData: VerificationFormData;
  onInputChange: (field: keyof VerificationFormData, value: string) => void;
  onFileChange: (field: keyof VerificationFormData, file: File | null) => void;
  onFormDataChange: (updater: (prev: VerificationFormData) => VerificationFormData) => void;
}

export default function EntrepreneurForm({ 
  formData, 
  onInputChange, 
  onFileChange,
  onFormDataChange 
}: EntrepreneurFormProps) {
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
    if (formData.inn && formData.inn.length >= 10 && !innError && !autoFilled) {
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
            ogrnip: dadataData.ogrnip || prev.ogrnip,
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

  const handleOgrnipChange = (value: string) => {
    const formatted = value.replace(/\D/g, '').slice(0, 15);
    onInputChange('ogrnip', formatted);
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
        {autoFilled && (
          <p className="text-xs text-blue-600">✓ Данные загружены из ЕГРИП</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ogrnip" className="text-sm font-medium">ОГРНИП *</Label>
        <Input
          id="ogrnip"
          value={formData.ogrnip || ''}
          onChange={(e) => handleOgrnipChange(e.target.value)}
          placeholder="123456789012345"
          required
          maxLength={15}
          pattern="[0-9]*"
          inputMode="numeric"
          className="text-base"
        />
        {formData.ogrnip && formData.ogrnip.length !== 15 && (
          <p className="text-xs text-muted-foreground">ОГРНИП должен содержать 15 цифр (введено {formData.ogrnip.length})</p>
        )}
        {formData.ogrnip && formData.ogrnip.length === 15 && (
          <p className="text-xs text-green-600">✓ ОГРНИП корректен</p>
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