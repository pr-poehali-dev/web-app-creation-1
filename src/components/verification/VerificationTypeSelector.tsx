import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { VerificationType } from '@/types/verification';

interface VerificationTypeSelectorProps {
  value: VerificationType;
  onChange: (value: VerificationType) => void;
  disabled?: boolean;
}

export default function VerificationTypeSelector({ value, onChange, disabled = false }: VerificationTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Тип участника *</Label>
      <RadioGroup
        value={value}
        onValueChange={(val) => onChange(val as VerificationType)}
        disabled={disabled}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="individual" id="individual" disabled={disabled} />
          <Label htmlFor="individual" className={`font-normal ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
            Самозанятый (физическое лицо)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="self_employed" id="self_employed" disabled={disabled} />
          <Label htmlFor="self_employed" className={`font-normal ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
            ИП (индивидуальный предприниматель)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="legal_entity" id="legal_entity" disabled={disabled} />
          <Label htmlFor="legal_entity" className={`font-normal ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
            Юридическое лицо
          </Label>
        </div>
      </RadioGroup>
      {disabled && (
        <p className="text-xs text-muted-foreground">
          Тип участника определен при регистрации и не может быть изменен
        </p>
      )}
    </div>
  );
}