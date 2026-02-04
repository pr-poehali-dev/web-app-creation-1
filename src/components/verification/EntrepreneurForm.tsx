import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import FileUploadWithIndicator from '@/components/FileUploadWithIndicator';
import type { VerificationFormData } from '@/types/verification';

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
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="inn" className="text-sm font-medium">ИНН *</Label>
        <Input
          id="inn"
          value={formData.inn || ''}
          onChange={(e) => onInputChange('inn', e.target.value)}
          placeholder="123456789012"
          required
          className="text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ogrnip" className="text-sm font-medium">ОГРНИП *</Label>
        <Input
          id="ogrnip"
          value={formData.ogrnip || ''}
          onChange={(e) => onInputChange('ogrnip', e.target.value)}
          placeholder="123456789012345"
          required
          className="text-base"
        />
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