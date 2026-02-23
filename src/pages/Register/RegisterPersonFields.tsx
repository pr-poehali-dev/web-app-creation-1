import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FormData, FormErrors } from './types';

interface RegisterPersonFieldsProps {
  formData: FormData;
  errors: FormErrors;
  isSubmitting: boolean;
  onInputChange: (field: keyof FormData, value: string) => void;
}

export default function RegisterPersonFields({
  formData,
  errors,
  isSubmitting,
  onInputChange,
}: RegisterPersonFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="lastName">Фамилия <span className="text-destructive">*</span></Label>
        <Input
          id="lastName"
          value={formData.lastName}
          onChange={(e) => onInputChange('lastName', e.target.value)}
          className={errors.lastName ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="firstName">Имя <span className="text-destructive">*</span></Label>
        <Input
          id="firstName"
          value={formData.firstName}
          onChange={(e) => onInputChange('firstName', e.target.value)}
          className={errors.firstName ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="middleName">Отчество</Label>
        <Input
          id="middleName"
          value={formData.middleName}
          onChange={(e) => onInputChange('middleName', e.target.value)}
          className={errors.middleName ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {errors.middleName && <p className="text-sm text-destructive">{errors.middleName}</p>}
      </div>

      {(formData.userType === 'self-employed' || formData.userType === 'entrepreneur') && (
        <div className="space-y-2">
          <Label htmlFor="inn">ИНН (12 цифр) <span className="text-destructive">*</span></Label>
          <Input
            id="inn"
            value={formData.inn}
            onChange={(e) => onInputChange('inn', e.target.value)}
            maxLength={12}
            className={errors.inn ? 'border-destructive' : ''}
            disabled={isSubmitting}
          />
          {errors.inn && <p className="text-sm text-destructive">{errors.inn}</p>}
        </div>
      )}

      {formData.userType === 'entrepreneur' && (
        <div className="space-y-2">
          <Label htmlFor="ogrnip">ОГРНИП (15 цифр) <span className="text-destructive">*</span></Label>
          <Input
            id="ogrnip"
            value={formData.ogrnip}
            onChange={(e) => onInputChange('ogrnip', e.target.value)}
            maxLength={15}
            className={errors.ogrnip ? 'border-destructive' : ''}
            disabled={isSubmitting}
          />
          {errors.ogrnip && <p className="text-sm text-destructive">{errors.ogrnip}</p>}
        </div>
      )}
    </>
  );
}
