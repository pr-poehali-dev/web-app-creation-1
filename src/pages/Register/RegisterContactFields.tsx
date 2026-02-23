import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import type { FormData, FormErrors } from './types';

interface RegisterContactFieldsProps {
  formData: FormData;
  errors: FormErrors;
  isSubmitting: boolean;
  showPassword: boolean;
  showConfirmPassword: boolean;
  onInputChange: (field: keyof FormData, value: string) => void;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
  onPhoneChange: (value: string) => void;
}

export default function RegisterContactFields({
  formData,
  errors,
  isSubmitting,
  showPassword,
  showConfirmPassword,
  onInputChange,
  onTogglePassword,
  onToggleConfirmPassword,
  onPhoneChange,
}: RegisterContactFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="phone">Телефон <span className="text-destructive">*</span></Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+7 999 123 45 67"
          value={formData.phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          className={errors.phone ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
        {!errors.phone && formData.phone && formData.phone.replace(/\D/g, '').length < 11 && (
          <p className="text-xs text-muted-foreground">Номер должен содержать 11 цифр</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          Email {formData.userType !== 'individual' && <span className="text-destructive">*</span>}
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => onInputChange('email', e.target.value)}
          className={errors.email ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Пароль <span className="text-destructive">*</span></Label>
        <div className="relative">
          <Input
            id="password"
            name="new-password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => onInputChange('password', e.target.value)}
            autoComplete="new-password"
            className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            disabled={isSubmitting}
          >
            <Icon name={showPassword ? 'EyeOff' : 'Eye'} className="h-4 w-4" />
          </button>
        </div>
        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
        <p className="text-xs text-muted-foreground">
          Минимум 6 символов, заглавная буква, спец символ или цифра
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Подтвердите пароль <span className="text-destructive">*</span></Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            autoComplete="new-password"
            onChange={(e) => onInputChange('confirmPassword', e.target.value)}
            className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={onToggleConfirmPassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            disabled={isSubmitting}
          >
            <Icon name={showConfirmPassword ? 'EyeOff' : 'Eye'} className="h-4 w-4" />
          </button>
        </div>
        {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
      </div>
    </>
  );
}
