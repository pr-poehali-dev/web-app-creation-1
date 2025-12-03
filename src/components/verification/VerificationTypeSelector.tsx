import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { VerificationType } from '@/types/verification';

interface VerificationTypeSelectorProps {
  value: VerificationType;
  onChange: (value: VerificationType) => void;
}

export default function VerificationTypeSelector({ value, onChange }: VerificationTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Тип участника *</Label>
      <RadioGroup
        value={value}
        onValueChange={(val) => onChange(val as VerificationType)}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="individual" id="individual" />
          <Label htmlFor="individual" className="font-normal cursor-pointer">
            Самозанятый (физическое лицо)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="self_employed" id="self_employed" />
          <Label htmlFor="self_employed" className="font-normal cursor-pointer">
            ИП (индивидуальный предприниматель)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="legal_entity" id="legal_entity" />
          <Label htmlFor="legal_entity" className="font-normal cursor-pointer">
            Юридическое лицо
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
