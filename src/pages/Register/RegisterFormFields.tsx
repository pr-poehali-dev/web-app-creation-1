import type { FormData, FormErrors } from './types';
import RegisterLegalEntityFields from './RegisterLegalEntityFields';
import RegisterPersonFields from './RegisterPersonFields';
import RegisterContactFields from './RegisterContactFields';

interface RegisterFormFieldsProps {
  formData: FormData;
  errors: FormErrors;
  isSubmitting: boolean;
  showPassword: boolean;
  showConfirmPassword: boolean;
  onInputChange: (field: keyof FormData, value: string) => void;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
  onFetchCompanyData?: (inn: string) => void;
  isFetchingCompany?: boolean;
}

export default function RegisterFormFields({
  formData,
  errors,
  isSubmitting,
  showPassword,
  showConfirmPassword,
  onInputChange,
  onTogglePassword,
  onToggleConfirmPassword,
  onFetchCompanyData,
  isFetchingCompany = false,
}: RegisterFormFieldsProps) {
  if (!formData.userType) return null;

  const formatPhoneNumber = (value: string) => {
    const hasPlus = value.trim().startsWith('+');
    const digitsOnly = value.replace(/\D/g, '');

    if (digitsOnly.length === 0) {
      return hasPlus ? '+' : '';
    }

    const limitedDigits = digitsOnly.slice(0, 11);

    if (hasPlus) {
      return formatWithSpaces('+' + limitedDigits);
    }

    let normalizedDigits = limitedDigits;
    if (limitedDigits.startsWith('8')) {
      normalizedDigits = '7' + limitedDigits.slice(1);
    } else if (!limitedDigits.startsWith('7')) {
      normalizedDigits = '7' + limitedDigits;
      normalizedDigits = normalizedDigits.slice(0, 11);
    }

    return formatWithSpaces('+' + normalizedDigits);
  };

  const formatWithSpaces = (phone: string) => {
    const cleaned = phone.replace(/[^\d+]/g, '');
    const digits = cleaned.replace(/\D/g, '');

    if (digits.length === 0) return cleaned;

    let formatted = '+';

    if (digits.length >= 1) {
      formatted += digits.substring(0, 1);
    }
    if (digits.length >= 2) {
      formatted += ' ' + digits.substring(1, Math.min(4, digits.length));
    }
    if (digits.length >= 5) {
      formatted += ' ' + digits.substring(4, Math.min(7, digits.length));
    }
    if (digits.length >= 8) {
      formatted += ' ' + digits.substring(7, Math.min(9, digits.length));
    }
    if (digits.length >= 10) {
      formatted += ' ' + digits.substring(9, Math.min(11, digits.length));
    }

    return formatted;
  };

  const handlePhoneChange = (value: string) => {
    if (value === '') {
      onInputChange('phone', '');
      return;
    }

    const hasPlus = value.trim().startsWith('+');
    if (value === '+') {
      onInputChange('phone', '+');
      return;
    }

    const newDigits = value.replace(/\D/g, '');

    if (newDigits.length === 0 && !hasPlus) {
      onInputChange('phone', '');
      return;
    }

    if (newDigits.length > 11) {
      return;
    }

    const formatted = formatPhoneNumber(value);
    onInputChange('phone', formatted);
  };

  return (
    <>
      {formData.userType === 'legal-entity' ? (
        <RegisterLegalEntityFields
          formData={formData}
          errors={errors}
          isSubmitting={isSubmitting}
          onInputChange={onInputChange}
          onFetchCompanyData={onFetchCompanyData}
          isFetchingCompany={isFetchingCompany}
        />
      ) : (
        <RegisterPersonFields
          formData={formData}
          errors={errors}
          isSubmitting={isSubmitting}
          onInputChange={onInputChange}
        />
      )}

      <RegisterContactFields
        formData={formData}
        errors={errors}
        isSubmitting={isSubmitting}
        showPassword={showPassword}
        showConfirmPassword={showConfirmPassword}
        onInputChange={onInputChange}
        onTogglePassword={onTogglePassword}
        onToggleConfirmPassword={onToggleConfirmPassword}
        onPhoneChange={handlePhoneChange}
      />
    </>
  );
}
