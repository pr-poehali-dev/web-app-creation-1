import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import type { VerificationFormData } from '@/types/verification';

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
  return (
    <>
      <div>
        <Label htmlFor="inn">ИНН *</Label>
        <Input
          id="inn"
          value={formData.inn || ''}
          onChange={(e) => onInputChange('inn', e.target.value)}
          placeholder="123456789012"
          required
        />
      </div>

      <div>
        <Label htmlFor="passportScan">Лицевая сторона паспорта *</Label>
        <Input
          id="passportScan"
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => onFileChange('passportScan', e.target.files?.[0] || null)}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Загрузите фото или скан лицевой стороны паспорта
        </p>
      </div>

      <div>
        <Label htmlFor="passportRegistration">Страница с отметкой о регистрации *</Label>
        <Input
          id="passportRegistration"
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => onFileChange('passportRegistration', e.target.files?.[0] || null)}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Загрузите страницу паспорта с отметкой о регистрации
        </p>
      </div>

      <div className="flex items-center space-x-2">
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
        />
        <Label htmlFor="addressesMatch" className="font-normal cursor-pointer">
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
        <div>
          <Label htmlFor="utilityBill">Оплаченная квитанция *</Label>
          <Input
            id="utilityBill"
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => onFileChange('utilityBill', e.target.files?.[0] || null)}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Загрузите квитанцию для подтверждения адреса проживания
          </p>
        </div>
      )}
    </>
  );
}